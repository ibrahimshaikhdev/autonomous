import { getNodeHandler, NodeExecutionResult } from "./node-handlers";

interface WorkflowNode {
  id: string;
  type: string;
  data: Record<string, any>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

export interface ExecutionLog {
  timestamp: string;
  nodeId: string;
  nodeName: string;
  message: string;
  level: "info" | "error" | "warning" | "success";
}

export interface NodeResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: "success" | "failed" | "skipped";
  input: any;
  output: any;
  startedAt: string;
  completedAt: string;
  duration: number;
  error?: string;
  retryAttempt?: number;
  branchTaken?: string; // for conditional nodes
}

export interface ExecutionResult {
  status: "success" | "failed";
  outputData: any;
  logs: ExecutionLog[];
  nodeResults: NodeResult[];
  executionPath: string[]; // ordered list of node IDs that were executed
}

// ── Retry Logic ──

interface RetryConfig {
  retryCount: number;
  retryDelay: number; // ms
  exponentialBackoff: boolean;
}

function getRetryConfig(nodeData: Record<string, any>): RetryConfig {
  return {
    retryCount: Number(nodeData.retryCount) || 0,
    retryDelay: Number(nodeData.retryDelay) || 1000,
    exponentialBackoff: nodeData.exponentialBackoff === true || nodeData.exponentialBackoff === "true",
  };
}

async function executeWithRetry(
  handler: { execute: (ctx: any) => Promise<NodeExecutionResult> },
  ctx: any,
  retryConfig: RetryConfig
): Promise<NodeExecutionResult & { retryAttempt: number }> {
  let lastError: NodeExecutionResult | null = null;
  const maxAttempts = retryConfig.retryCount + 1; // 1 initial + retries

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await handler.execute(ctx);

      // If successful, return immediately
      if (result.status === "success") {
        return { ...result, retryAttempt: attempt };
      }

      // If failed and we have retries left
      lastError = result;
      if (attempt < maxAttempts - 1) {
        const delay = retryConfig.exponentialBackoff
          ? retryConfig.retryDelay * Math.pow(2, attempt)
          : retryConfig.retryDelay;

        ctx.input = { ...ctx.input }; // reset input for retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error: any) {
      lastError = {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: `Attempt ${attempt + 1} error: ${error.message}`,
            level: "error",
          },
        ],
        status: "failed",
      };

      if (attempt < maxAttempts - 1) {
        const delay = retryConfig.exponentialBackoff
          ? retryConfig.retryDelay * Math.pow(2, attempt)
          : retryConfig.retryDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return { ...lastError!, retryAttempt: retryConfig.retryCount };
}

// ── Failure Policy ──

type FailurePolicy = "stop" | "continue" | "fallback";

function getFailurePolicy(nodeData: Record<string, any>): FailurePolicy {
  const policy = nodeData.onFailure || "stop";
  if (["stop", "continue", "fallback"].includes(policy)) return policy;
  return "stop";
}

// ── Main Engine ──

export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  triggerData?: any
): Promise<ExecutionResult> {
  const allLogs: ExecutionLog[] = [];
  const nodeResults: NodeResult[] = [];
  const executionPath: string[] = [];

  // Build adjacency list (with sourceHandle) and reverse adjacency
  const adjacency: Record<string, Array<{ targetId: string; sourceHandle?: string; edgeId: string }>> = {};
  const reverseAdj: Record<string, Array<{ sourceId: string; sourceHandle?: string; edgeId: string }>> = {};
  const inDegree: Record<string, number> = {};
  const nodeMap: Record<string, WorkflowNode> = {};

  for (const node of nodes) {
    nodeMap[node.id] = node;
    adjacency[node.id] = [];
    reverseAdj[node.id] = [];
    inDegree[node.id] = 0;
  }

  for (const edge of edges) {
    if (adjacency[edge.source]) {
      adjacency[edge.source].push({ targetId: edge.target, sourceHandle: edge.sourceHandle, edgeId: edge.id });
    }
    if (reverseAdj[edge.target]) {
      reverseAdj[edge.target].push({ sourceId: edge.source, sourceHandle: edge.sourceHandle, edgeId: edge.id });
    }
    if (inDegree[edge.target] !== undefined) {
      inDegree[edge.target]++;
    }
  }

  // Mutable in-degree for execution tracking
  const remainingDegree = { ...inDegree };

  // Find start nodes (in-degree 0)
  const readyQueue: string[] = [];
  for (const node of nodes) {
    if (inDegree[node.id] === 0) {
      readyQueue.push(node.id);
    }
  }

  // If no start node found (cycle), pick the first node
  if (readyQueue.length === 0 && nodes.length > 0) {
    readyQueue.push(nodes[0].id);
  }

  // Track processed nodes and their outputs
  const processed = new Set<string>();
  const nodeOutputs: Record<string, any> = {};
  const activeEdges = new Set<string>(); // edges that were traversed

  // Process nodes in parallel batches
  while (readyQueue.length > 0) {
    // Execute all ready nodes in parallel
    const currentBatch = [...readyQueue];
    readyQueue.length = 0;

    const batchPromises = currentBatch.map(async (nodeId) => {
      if (processed.has(nodeId)) return null;

      const node = nodeMap[nodeId];
      if (!node) return null;

      // Gather inputs from all predecessor nodes (for fan-in)
      const predecessors = reverseAdj[nodeId] || [];
      let mergedInput = triggerData || {};

      if (predecessors.length > 0) {
        // Collect all predecessor outputs
        const predOutputs = predecessors
          .map(p => ({ output: nodeOutputs[p.sourceId], sourceHandle: p.sourceHandle, edgeId: p.edgeId }))
          .filter(p => p.output !== undefined);

        if (predOutputs.length === 1) {
          mergedInput = predOutputs[0].output;
          activeEdges.add(predOutputs[0].edgeId);
        } else if (predOutputs.length > 1) {
          // Fan-in: merge outputs (last one wins for most fields, but collect all)
          mergedInput = { ...triggerData };
          for (const pred of predOutputs) {
            mergedInput = { ...mergedInput, ...pred.output };
            activeEdges.add(pred.edgeId);
          }
        }
      }

      return executeNode(node, mergedInput, allLogs, nodeResults, executionPath, nodeOutputs);
    });

    // Wait for all nodes in this batch to complete
    const batchResults = await Promise.allSettled(batchPromises);

    // Process completed nodes and update ready queue
    for (const result of batchResults) {
      if (result.status === "rejected") continue;
      const nodeResult = result.value;
      if (!nodeResult) continue;

      const nodeId = nodeResult.nodeId;
      processed.add(nodeId);

      // Update remaining degree of children and find newly ready ones
      const children = adjacency[nodeId] || [];
      const route = nodeOutputs[nodeId]?.route;
      const failurePolicy = getFailurePolicy(nodeMap[nodeId]?.data || {});

      for (const child of children) {
        // Conditional routing: if output has a route, only follow matching edges
        if (route && child.sourceHandle && child.sourceHandle !== route) {
          continue;
        }

        activeEdges.add(child.edgeId);
        remainingDegree[child.targetId]--;

        // Node is ready when all its predecessors have been processed
        if (remainingDegree[child.targetId] <= 0 && !processed.has(child.targetId)) {
          readyQueue.push(child.targetId);
        }
      }

      // Handle failure policy
      if (nodeResult.status === "failed") {
        if (failurePolicy === "stop") {
          return {
            status: "failed",
            outputData: nodeOutputs[nodeId],
            logs: allLogs,
            nodeResults,
            executionPath,
          };
        } else if (failurePolicy === "continue") {
          // Mark as processed, continue to children with previous input
          allLogs.push({
            timestamp: new Date().toISOString(),
            nodeId,
            nodeName: nodeMap[nodeId]?.data?.label || nodeId,
            message: "Failure policy: continue — skipping failed node",
            level: "warning",
          });
        } else if (failurePolicy === "fallback") {
          const fallbackNodeId = nodeMap[nodeId]?.data?.fallbackNodeId;
          if (fallbackNodeId && nodeMap[fallbackNodeId] && !processed.has(fallbackNodeId)) {
            readyQueue.push(fallbackNodeId);
            allLogs.push({
              timestamp: new Date().toISOString(),
              nodeId,
              nodeName: nodeMap[nodeId]?.data?.label || nodeId,
              message: `Failure policy: routing to fallback node ${fallbackNodeId}`,
              level: "warning",
            });
          }
        }
      }
    }
  }

  // Find the final output (last node in execution path)
  const lastNodeId = executionPath[executionPath.length - 1];
  const finalOutput = lastNodeId ? nodeOutputs[lastNodeId] : triggerData;

  allLogs.push({
    timestamp: new Date().toISOString(),
    nodeId: "system",
    nodeName: "System",
    message: `Workflow completed — ${executionPath.length} nodes executed`,
    level: "success",
  });

  return {
    status: "success",
    outputData: finalOutput,
    logs: allLogs,
    nodeResults,
    executionPath,
  };
}

// Execute a single node with retry support
async function executeNode(
  node: WorkflowNode,
  input: any,
  allLogs: ExecutionLog[],
  nodeResults: NodeResult[],
  executionPath: string[],
  nodeOutputs: Record<string, any>
): Promise<NodeResult> {
  // Use node.data.nodeType for handler lookup — node.type is always "workflowNode" (React Flow component key)
  const logicalType = node.data?.nodeType || node.type;
  const handler = getNodeHandler(logicalType);
  const nodeName = node.data?.label || logicalType;
  const nodeInput = { ...input };
  const nodeStartedAt = new Date().toISOString();
  const nodeStartTime = Date.now();

  if (!handler) {
    // Unsupported node type — skip
    const result: NodeResult = {
      nodeId: node.id,
      nodeName,
      nodeType: logicalType,
      status: "skipped",
      input: nodeInput,
      output: null,
      startedAt: nodeStartedAt,
      completedAt: new Date().toISOString(),
      duration: 0,
    };
    allLogs.push({
      timestamp: new Date().toISOString(),
      nodeId: node.id,
      nodeName,
      message: `Skipped: unsupported node type "${node.type}"`,
      level: "warning",
    });
    nodeResults.push(result);
    executionPath.push(node.id);
    nodeOutputs[node.id] = input; // pass through
    return result;
  }

  // Get retry and failure config
  const retryConfig = getRetryConfig(node.data || {});
  const failurePolicy = getFailurePolicy(node.data || {});

  try {
    // Execute with retry
    const execResult = await executeWithRetry(
      handler,
      {
        nodeId: node.id,
        nodeName,
        nodeData: node.data || {},
        input,
      },
      retryConfig
    );

    const nodeDuration = Date.now() - nodeStartTime;
    const nodeCompletedAt = new Date().toISOString();

    // Collect logs
    for (const log of execResult.logs) {
      allLogs.push({
        timestamp: new Date().toISOString(),
        ...log,
      });
    }

    // Log retry info if retries happened
    if (execResult.retryAttempt > 0) {
      allLogs.push({
        timestamp: new Date().toISOString(),
        nodeId: node.id,
        nodeName,
        message: `Succeeded after ${execResult.retryAttempt} retry attempt(s)`,
        level: "warning",
      });
    }

    // Record node result
    const result: NodeResult = {
      nodeId: node.id,
      nodeName,
      nodeType: logicalType,
      status: execResult.status,
      input: nodeInput,
      output: execResult.output,
      startedAt: nodeStartedAt,
      completedAt: nodeCompletedAt,
      duration: nodeDuration,
      retryAttempt: execResult.retryAttempt,
      branchTaken: execResult.output?.route,
    };

    nodeResults.push(result);
    executionPath.push(node.id);

    if (execResult.status === "success") {
      nodeOutputs[node.id] = execResult.output;
    } else {
      // Failed — store null output, failure policy handled in main loop
      nodeOutputs[node.id] = execResult.output;
      if (failurePolicy === "stop") {
        allLogs.push({
          timestamp: new Date().toISOString(),
          nodeId: node.id,
          nodeName,
          message: `Node failed — execution stopped`,
          level: "error",
        });
      }
    }

    return result;
  } catch (error: any) {
    const nodeDuration = Date.now() - nodeStartTime;
    const nodeCompletedAt = new Date().toISOString();

    allLogs.push({
      timestamp: new Date().toISOString(),
      nodeId: node.id,
      nodeName,
      message: `Unexpected error: ${error.message}`,
      level: "error",
    });

    const result: NodeResult = {
      nodeId: node.id,
      nodeName,
      nodeType: logicalType,
      status: "failed",
      input: nodeInput,
      output: null,
      startedAt: nodeStartedAt,
      completedAt: nodeCompletedAt,
      duration: nodeDuration,
      error: error.message,
    };

    nodeResults.push(result);
    executionPath.push(node.id);
    nodeOutputs[node.id] = null;

    return result;
  }
}
