"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  ReactFlowProvider,
  ReactFlowInstance,
  Handle,
  Position,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { getNodeType, getNodeCategories, getDefaultConfig } from "@/lib/node-registry";
import { NodeConfigPanel } from "@/components/workflow/node-config-panel";
import { AIBuilderModal } from "@/components/workflow/ai-builder-modal";

// Node sidebar categories from registry
const nodeCategories = getNodeCategories();

// Execution status overlay styles
const execStatusStyles: Record<string, { ring: string; badge: string; label: string }> = {
  success: { ring: "ring-2 ring-green-500 ring-offset-1", badge: "bg-green-600", label: "✓" },
  failed: { ring: "ring-2 ring-red-500 ring-offset-1", badge: "bg-red-600", label: "✗" },
  running: { ring: "ring-2 ring-blue-500 ring-offset-1 animate-pulse", badge: "bg-blue-600", label: "…" },
  skipped: { ring: "ring-2 ring-yellow-500/50 ring-offset-1", badge: "bg-yellow-600", label: "⏭" },
};

// Custom node component — uses registry for icon/color, supports multiple output handles
function WorkflowNode({ data, selected }: NodeProps) {
  const nodeTypeDef = getNodeType(data.nodeType);
  const colorClass = nodeTypeDef.color;
  const icon = nodeTypeDef.icon;
  const outputHandles = nodeTypeDef.outputHandles;
  const execStatus = data._execStatus as string | undefined;
  const execDuration = data._execDuration as number | undefined;
  const statusStyle = execStatus ? execStatusStyles[execStatus] : null;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-lg min-w-[140px] text-center cursor-pointer transition-all hover:scale-105 ${colorClass} ${selected ? "ring-2 ring-primary ring-offset-2" : ""} ${statusStyle ? statusStyle.ring : ""}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-border !border-border" />
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-sm font-medium">{data.label}</div>
      <div className="text-xs text-muted-foreground capitalize mt-1">{data.nodeType}</div>

      {/* Execution status badge */}
      {statusStyle && (
        <div className="mt-2 flex items-center justify-center gap-1">
          <span className={`${statusStyle.badge} text-white text-[10px] px-2 py-0.5 rounded-full font-medium`}>
            {statusStyle.label} {execStatus}
          </span>
          {execDuration != null && (
            <span className="text-[10px] text-muted-foreground">
              {execDuration < 1000 ? `${execDuration}ms` : `${(execDuration / 1000).toFixed(1)}s`}
            </span>
          )}
        </div>
      )}

      {outputHandles ? (
        <div className="flex flex-col items-end gap-1 mt-2">
          {outputHandles.map((h, i) => (
            <div key={h.id} className="flex items-center gap-1">
              <span className="text-[10px] font-medium" style={{ color: h.color }}>{h.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={h.id}
                style={{
                  background: h.color,
                  borderColor: h.color,
                  width: 10,
                  height: 10,
                  top: `${50 + (i - (outputHandles.length - 1) / 2) * 20}%`,
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <Handle type="source" position={Position.Right} className="!bg-border !border-border" />
      )}
    </div>
  );
}

const nodeTypes = { workflowNode: WorkflowNode };

function BuilderContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingWorkflow, setLoadingWorkflow] = useState(!!workflowId);
  const [saveMessage, setSaveMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [activeEdgeIds, setActiveEdgeIds] = useState<Set<string>>(new Set());
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // AI Builder modal state
  const [showAIBuilder, setShowAIBuilder] = useState(false);

  // Undo/Redo history
  const undoStack = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const redoStack = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);

  const pushToHistory = useCallback(() => {
    undoStack.current.push({ nodes: [...nodes], edges: [...edges] });
    redoStack.current = [];
    // Cap history at 50 entries
    if (undoStack.current.length > 50) undoStack.current.shift();
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    redoStack.current.push({ nodes: [...nodes], edges: [...edges] });
    const prev = undoStack.current.pop()!;
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setSelectedNode(null);
  }, [nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    undoStack.current.push({ nodes: [...nodes], edges: [...edges] });
    const next = redoStack.current.pop()!;
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNode(null);
  }, [nodes, edges, setNodes, setEdges]);

  // Stable callback for AI builder — avoids stale closure in modal's useCallback
  const handleAIApply = useCallback((generatedNodes: Node[], generatedEdges: Edge[], name: string, description: string) => {
    pushToHistory();
    setNodes(generatedNodes);
    setEdges(generatedEdges);
    setWorkflowName(name);
    setWorkflowDescription(description);
    setSelectedNode(null);
    // Force fitView after nodes are applied so they're visible on canvas
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.2, duration: 300 });
    }, 50);
  }, [pushToHistory, setNodes, setEdges, reactFlowInstance]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // Load existing workflow
  useEffect(() => {
    if (workflowId && user?.workspace?.id) {
      setNodes([]);
      setEdges([]);
      setWorkflowName("Untitled Workflow");
      setWorkflowDescription("");
      loadWorkflow();
    }
  }, [workflowId, user?.id]);

  // Restore draft from localStorage (only for unsaved workflows, after auth loads)
  useEffect(() => {
    if (workflowId || loading) return;
    try {
      const saved = localStorage.getItem("workflow-draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.nodes?.length > 0) {
          setNodes(draft.nodes);
          setEdges(draft.edges || []);
          if (draft.name) setWorkflowName(draft.name);
          if (draft.description !== undefined) setWorkflowDescription(draft.description);
        }
      }
    } catch {}
  }, [workflowId, user?.id, loading]);

  // Autosave draft to localStorage (debounced, only for unsaved workflows after auth loads)
  useEffect(() => {
    if (workflowId || loading || nodes.length === 0) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("workflow-draft", JSON.stringify({
          nodes, edges, name: workflowName, description: workflowDescription,
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [nodes, edges, workflowName, workflowDescription, workflowId, loading]);

  // Clear draft when canvas is emptied (e.g. "Clear" button)
  useEffect(() => {
    if (loading) return;
    if (!workflowId && nodes.length === 0) {
      localStorage.removeItem("workflow-draft");
    }
  }, [nodes.length, workflowId, loading]);

  const loadWorkflow = async () => {
    if (!workflowId || !user?.workspace?.id) return;
    setLoadingWorkflow(true);
    const result = await api.workflows.getById(user.workspace.id, workflowId);
    if (result.data) {
      const wf = result.data;
      setWorkflowName(wf.name);
      setWorkflowDescription(wf.description || "");
      // Parse nodes/edges from JSON (they're stored as JSON strings in DB)
      let parsedNodes = typeof wf.nodes === "string" ? JSON.parse(wf.nodes) : wf.nodes;
      const parsedEdges = typeof wf.edges === "string" ? JSON.parse(wf.edges) : wf.edges;
      // Inject webhookUrl into webhook trigger nodes if workflow has a webhookId
      if (wf.webhookId && Array.isArray(parsedNodes)) {
        parsedNodes = parsedNodes.map((n: any) =>
          n.data?.nodeType === "webhook"
            ? { ...n, data: { ...n.data, webhookUrl: `POST http://localhost:3001/api/webhooks/${wf.webhookId}` } }
            : n
        );
      }
      setNodes(parsedNodes || []);
      setEdges(parsedEdges || []);
    }
    setLoadingWorkflow(false);
  };

  // Save workflow
  const handleSave = async () => {
    if (!user?.workspace?.id) return;
    setSaving(true);
    setSaveMessage("");

    const nodesJson = JSON.stringify(nodes);
    const edgesJson = JSON.stringify(edges);

    if (workflowId) {
      // Update existing
      const result = await api.workflows.update(user.workspace.id, workflowId, {
        name: workflowName,
        description: workflowDescription,
        nodes: nodesJson,
        edges: edgesJson,
      });
      if (result.error) {
        setSaveMessage("Error: " + result.error);
      } else {
        setSaveMessage("Saved!");
        // Inject webhookUrl if webhookId was just generated
        if (result.data?.webhookId) {
          const webhookUrl = `POST http://localhost:3001/api/webhooks/${result.data.webhookId}`;
          setNodes((nds) =>
            nds.map((n: any) =>
              n.data?.nodeType === "webhook"
                ? { ...n, data: { ...n.data, webhookUrl } }
                : n
            )
          );
        }
      }
    } else {
      // Create new
      const result = await api.workflows.create(user.workspace.id, {
        name: workflowName,
        description: workflowDescription,
        nodes: nodesJson,
        edges: edgesJson,
      });
      if (result.error) {
        setSaveMessage("Error: " + result.error);
      } else if (result.data) {
        setSaveMessage("Saved!");
        localStorage.removeItem("workflow-draft");
        // Inject webhookUrl if workflow has a webhookId (from webhook trigger node)
        if (result.data.webhookId) {
          const webhookUrl = `POST http://localhost:3001/api/webhooks/${result.data.webhookId}`;
          setNodes((nds) =>
            nds.map((n: any) =>
              n.data?.nodeType === "webhook"
                ? { ...n, data: { ...n.data, webhookUrl } }
                : n
            )
          );
        }
        // Redirect to the new workflow's URL
        router.replace(`/workflows/builder?id=${result.data.id}`);
      }
    }
    setSaving(false);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  // Run workflow
  const handleRun = async () => {
    if (!user?.workspace?.id || !workflowId) return;
    setRunning(true);
    setExecutionResult(null);
    setShowExecutionPanel(true);
    setActiveEdgeIds(new Set());

    const result = await api.executions.execute(user.workspace.id, workflowId);
    if (result.data) {
      setExecutionResult(result.data);

      // Inject per-node execution status into canvas nodes
      const execData = result.data as any;
      const nodeResults: any[] = typeof execData.nodeResults === "string"
        ? JSON.parse(execData.nodeResults)
        : (execData.nodeResults || []);

      if (nodeResults.length > 0) {
        const statusMap: Record<string, { status: string; duration: number }> = {};
        for (const nr of nodeResults) {
          statusMap[nr.nodeId] = { status: nr.status, duration: nr.duration };
        }

        setNodes((nds) =>
          nds.map((n) => {
            const nr = statusMap[n.id];
            if (nr) {
              return {
                ...n,
                data: { ...n.data, _execStatus: nr.status, _execDuration: nr.duration },
              };
            }
            return n;
          })
        );

        // Compute active edges from execution path
        const execPath: string[] = typeof execData.executionPath === "string"
          ? JSON.parse(execData.executionPath || "[]")
          : (execData.executionPath || []);

        // Build set of active edge IDs from execution path
        const activeIds = new Set<string>();
        for (let i = 0; i < execPath.length - 1; i++) {
          const sourceId = execPath[i];
          const targetId = execPath[i + 1];
          // Find edges connecting these nodes
          for (const edge of edges) {
            if (edge.source === sourceId && edge.target === targetId) {
              activeIds.add(edge.id);
            }
          }
        }
        // Also mark edges for nodes that had branch info
        for (const nr of nodeResults) {
          if (nr.branchTaken) {
            // Find edges from this node with matching sourceHandle
            for (const edge of edges) {
              if (edge.source === nr.nodeId && edge.sourceHandle === nr.branchTaken) {
                activeIds.add(edge.id);
              }
            }
          }
        }
        setActiveEdgeIds(activeIds);
      }
    } else if (result.error) {
      setExecutionResult({ status: "FAILED", logs: [{ timestamp: new Date().toISOString(), nodeId: "system", nodeName: "System", message: result.error, level: "error" }] });
    }
    setRunning(false);
  };

  // Handle new connections — preserve sourceHandle for routing nodes
  const onConnect = useCallback(
    (params: Connection) => {
      pushToHistory();
      const handleSuffix = params.sourceHandle ? `-${params.sourceHandle}` : "";
      setEdges((eds) => addEdge({
        ...params,
        id: `e-${params.source}${handleSuffix}-${params.target}`,
      }, eds));
    },
    [setEdges, pushToHistory]
  );

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData("application/reactflow-type");
      const nodeLabel = event.dataTransfer.getData("application/reactflow-label");

      if (!nodeType || !reactFlowInstance || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const defaultConfig = getDefaultConfig(nodeType);
      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: "workflowNode",
        position,
        data: { label: nodeLabel, nodeType, ...defaultConfig },
      };

      pushToHistory();
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, pushToHistory]
  );

  // Handle node selection
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle clicking on canvas (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Update selected node's label
  const updateNodeLabel = (label: string) => {
    if (!selectedNode) return;
    pushToHistory();
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id ? { ...n, data: { ...n.data, label } } : n
      )
    );
    setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, label } } : null));
  };

  // Update selected node's data field
  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;
    pushToHistory();
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id ? { ...n, data: { ...n.data, [key]: value } } : n
      )
    );
    setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, [key]: value } } : null));
  };

  // Delete selected node
  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    pushToHistory();
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  // Drag start for sidebar items
  const onDragStart = (event: React.DragEvent, nodeType: string, nodeLabel: string) => {
    event.dataTransfer.setData("application/reactflow-type", nodeType);
    event.dataTransfer.setData("application/reactflow-label", nodeLabel);
    event.dataTransfer.effectAllowed = "move";
  };

  // Snapshot history when node drag ends (position change)
  const onNodeDragStop = useCallback(() => {
    pushToHistory();
  }, [pushToHistory]);

  if (loading || loadingWorkflow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{loadingWorkflow ? "Loading workflow..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/signin");
    return null;
  }

  return (
    <div className="flex h-screen">
      {/* Left Sidebar - Node Panel */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <span>←</span> Back to Dashboard
          </Link>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Triggers</h3>
          <div className="space-y-2 mb-4">
            {nodeCategories.triggers.map((node) => (
              <div
                key={node.type}
                className="flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary/50 cursor-grab transition-colors bg-background"
                draggable
                onDragStart={(e) => onDragStart(e, node.type, node.label)}
              >
                <span className="text-lg">{node.icon}</span>
                <span className="text-sm">{node.label}</span>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Actions</h3>
          <div className="space-y-2 mb-4">
            {nodeCategories.actions.map((node) => (
              <div
                key={node.type}
                className="flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary/50 cursor-grab transition-colors bg-background"
                draggable
                onDragStart={(e) => onDragStart(e, node.type, node.label)}
              >
                <span className="text-lg">{node.icon}</span>
                <span className="text-sm">{node.label}</span>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-muted-foreground mb-3">AI Nodes</h3>
          <div className="space-y-2 mb-4">
            {nodeCategories.ai.map((node) => (
              <div
                key={node.type}
                className="flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary/50 cursor-grab transition-colors bg-background"
                draggable
                onDragStart={(e) => onDragStart(e, node.type, node.label)}
              >
                <span className="text-lg">{node.icon}</span>
                <span className="text-sm">{node.label}</span>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Logic</h3>
          <div className="space-y-2">
            {nodeCategories.logic.map((node) => (
              <div
                key={node.type}
                className="flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary/50 cursor-grab transition-colors bg-background"
                draggable
                onDragStart={(e) => onDragStart(e, node.type, node.label)}
              >
                <span className="text-lg">{node.icon}</span>
                <span className="text-sm">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Input
              type="text"
              placeholder="Workflow name..."
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-64 font-semibold"
            />
            {workflowId && <Badge variant="outline">Editing</Badge>}
            {!workflowId && nodes.length > 0 && <Badge variant="secondary">New</Badge>}
          </div>

          <div className="flex items-center gap-2">
            {saveMessage && (
              <span className={`text-sm ${saveMessage.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>
                {saveMessage}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={undoStack.current.length === 0}
              title="Undo (Ctrl+Z)"
            >
              ↩
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={redoStack.current.length === 0}
              title="Redo (Ctrl+Shift+Z)"
            >
              ↪
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (nodes.length > 0) pushToHistory();
                setNodes([]);
                setEdges([]);
                setSelectedNode(null);
              }}
            >
              🔄 Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIBuilder(true)}
              className="border-purple-500/50 text-purple-500 hover:bg-purple-500/10 hover:text-purple-400"
            >
              ✨ AI Generate
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "💾 Saving..." : "💾 Save"}
            </Button>
            {workflowId && (
              <Button
                size="sm"
                variant="default"
                onClick={handleRun}
                disabled={running || nodes.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {running ? "⏳ Running..." : "▶ Run"}
              </Button>
            )}
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges.map((e) => {
              if (activeEdgeIds.size === 0) return e;
              const isActive = activeEdgeIds.has(e.id);
              return {
                ...e,
                style: isActive
                  ? { stroke: "#22c55e", strokeWidth: 3 }
                  : { stroke: "#94a3b8", strokeWidth: 1.5, opacity: 0.4 },
                animated: isActive,
              };
            })}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
          >
            <Controls />
            <Background gap={24} size={1} />
          </ReactFlow>

          {/* Execution Results Panel */}
          {showExecutionPanel && (
            <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border max-h-[40vh] overflow-auto z-10 shadow-lg">
              <div className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-card">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold">Execution Results</h3>
                  {executionResult && (
                    <Badge
                      variant={executionResult.status === "SUCCESS" ? "default" : "destructive"}
                      className={executionResult.status === "SUCCESS" ? "bg-green-600" : ""}
                    >
                      {executionResult.status}
                    </Badge>
                  )}
                  {executionResult?.duration != null && (
                    <span className="text-xs text-muted-foreground">
                      {executionResult.duration}ms
                    </span>
                  )}
                  {executionResult?.id && (
                    <a
                      href={`/executions/${executionResult.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline hover:no-underline"
                    >
                      View Details →
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNodes((nds) =>
                        nds.map((n) => {
                          const { _execStatus, _execDuration, ...restData } = n.data;
                          return { ...n, data: restData };
                        })
                      );
                    }}
                  >
                    Clear Status
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowExecutionPanel(false); setExecutionResult(null); }}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="p-3">
                {running && (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Executing workflow...</span>
                  </div>
                )}

                {executionResult?.logs && (
                  <div className="space-y-1 font-mono text-xs">
                    {(executionResult.logs as any[]).map((log: any, i: number) => (
                      <div
                        key={i}
                        className={`flex gap-3 py-1 px-2 rounded ${
                          log.level === "error"
                            ? "bg-red-500/10 text-red-400"
                            : log.level === "success"
                            ? "bg-green-500/10 text-green-400"
                            : log.level === "warning"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span className="shrink-0 w-16 text-right opacity-60">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                        <span className="shrink-0 w-24 truncate font-medium">{log.nodeName}</span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Configuration Panel */}
      <aside className="w-72 border-l border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Node Configuration</h3>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          {selectedNode ? (
            <NodeConfigPanel
              node={selectedNode}
              onUpdateLabel={updateNodeLabel}
              onUpdateData={updateNodeData}
              onDelete={deleteSelectedNode}
            />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">Select a node to configure it</p>
              <p className="text-xs mt-2">Drag nodes from the left panel to build your workflow</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            {nodes.length} nodes · {edges.length} connections
          </div>
        </div>
      </aside>

      {/* AI Builder Modal */}
      <AIBuilderModal
        isOpen={showAIBuilder}
        onClose={() => setShowAIBuilder(false)}
        onApply={handleAIApply}
      />
    </div>
  );
}

export default function WorkflowBuilderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
      <ReactFlowProvider>
        <BuilderContent />
      </ReactFlowProvider>
    </Suspense>
  );
}
