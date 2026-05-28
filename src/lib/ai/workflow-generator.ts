// Workflow Graph Generator — converts parsed intents into React Flow nodes & edges
// Auto-layouts in a horizontal chain, handles routing branching.

import { getDefaultConfig, getNodeType } from "@/lib/node-registry";
import { parseIntents, extractWorkflowName, extractWorkflowDescription, type ParsedIntent } from "./prompt-parser";
import type { WorkflowNode, WorkflowEdge } from "@/types";

export interface GeneratedWorkflow {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  name: string;
  description: string;
  suggestions: string[]; // hints for the user
}

const NODE_SPACING_X = 300;
const NODE_SPACING_Y = 150;
const START_X = 50;
const START_Y = 200;

/**
 * Generate a full workflow graph from a natural language prompt.
 */
export function generateWorkflow(prompt: string): GeneratedWorkflow {
  const intents = parseIntents(prompt);
  const name = extractWorkflowName(prompt);
  const description = extractWorkflowDescription(prompt);

  if (intents.length === 0) {
    return {
      nodes: [],
      edges: [],
      name,
      description,
      suggestions: ["Could not identify any workflow steps. Try using keywords like: lead, score, route, notify, save, discord, webhook, delay."],
    };
  }

  // If no trigger was found, prepend a default one
  const hasTrigger = intents.some(i => {
    const def = getNodeType(i.nodeType);
    return def.category === "trigger";
  });

  if (!hasTrigger) {
    intents.unshift({
      nodeType: "lead-intake",
      label: "Lead Intake",
      params: {},
      confidence: 0.3,
    });
  }

  const { nodes, edges } = buildGraph(intents);
  const suggestions = generateQuickSuggestions(intents);

  return { nodes, edges, name, description, suggestions };
}

/**
 * Build a React Flow graph from ordered intents.
 * Handles lead-router branching specially.
 */
function buildGraph(intents: ParsedIntent[]): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];

  let x = START_X;
  let y = START_Y;
  let nodeIndex = 0;

  // Check if we have a router — this affects graph shape
  const routerIndex = intents.findIndex(i => i.nodeType === "lead-router");
  const hasRouter = routerIndex !== -1;

  for (let i = 0; i < intents.length; i++) {
    const intent = intents[i];
    const nodeId = `${intent.nodeType}-${Date.now()}-${nodeIndex}`;
    const defaultConfig = getDefaultConfig(intent.nodeType);

    // Merge extracted params with defaults
    const config = { ...defaultConfig, ...intent.params };

    const node: WorkflowNode = {
      id: nodeId,
      type: "workflowNode",
      position: { x, y },
      data: {
        label: intent.label,
        nodeType: intent.nodeType,
        ...config,
      },
    };

    nodes.push(node);

    // Create edge from previous node (if not the first)
    if (i > 0 && !(hasRouter && i === routerIndex)) {
      const prevNode = nodes[i - 1];
      edges.push({
        id: `e-${prevNode.id}-${nodeId}`,
        source: prevNode.id,
        target: nodeId,
      });
    }

    // If this is a router, handle branching
    if (intent.nodeType === "lead-router") {
      // Connect previous node to router
      if (i > 0) {
        const prevNode = nodes[i - 1];
        // Remove the last edge we created (it connected prev to router)
        // We'll re-create it properly below
        const lastEdgeIdx = edges.findIndex(e => e.target === nodeId);
        if (lastEdgeIdx !== -1) edges.splice(lastEdgeIdx, 1);

        edges.push({
          id: `e-${prevNode.id}-${nodeId}`,
          source: prevNode.id,
          target: nodeId,
        });
      }

      // Find action nodes after the router to branch into
      const afterRouter = intents.slice(i + 1);
      const hotActions = afterRouter.filter(a =>
        ["discord", "notification"].includes(a.nodeType)
      );
      const coldActions = afterRouter.filter(a =>
        ["google-sheets", "crm"].includes(a.nodeType)
      );

      // Create branch nodes (hot, warm, cold) if there are actions after
      if (afterRouter.length > 0) {
        let branchY = y - NODE_SPACING_Y;
        const routerNodeId = nodeId;

        // Branch: hot → first action (e.g., discord)
        if (hotActions.length > 0) {
          const action = hotActions[0];
          const branchId = `${action.nodeType}-hot-${Date.now()}`;
          const branchConfig = { ...getDefaultConfig(action.nodeType), ...action.params };
          const branchNode: WorkflowNode = {
            id: branchId,
            type: "workflowNode",
            position: { x: x + NODE_SPACING_X, y: branchY },
            data: { label: `${action.label} (Hot)`, nodeType: action.nodeType, ...branchConfig },
          };
          nodes.push(branchNode);
          edges.push({
            id: `e-${routerNodeId}-${branchId}-hot`,
            source: routerNodeId,
            target: branchId,
            sourceHandle: "hot",
          });
        }

        // Branch: warm/cold → save to sheets
        if (coldActions.length > 0) {
          const action = coldActions[0];
          // Warm branch
          const warmId = `${action.nodeType}-warm-${Date.now()}`;
          const warmConfig = { ...getDefaultConfig(action.nodeType), ...action.params };
          const warmNode: WorkflowNode = {
            id: warmId,
            type: "workflowNode",
            position: { x: x + NODE_SPACING_X, y: branchY + NODE_SPACING_Y },
            data: { label: `${action.label} (Warm)`, nodeType: action.nodeType, ...warmConfig },
          };
          nodes.push(warmNode);
          edges.push({
            id: `e-${routerNodeId}-${warmId}-warm`,
            source: routerNodeId,
            target: warmId,
            sourceHandle: "warm",
          });

          // Cold branch
          const coldId = `${action.nodeType}-cold-${Date.now() + 1}`;
          const coldConfig = { ...getDefaultConfig(action.nodeType), ...action.params };
          const coldNode: WorkflowNode = {
            id: coldId,
            type: "workflowNode",
            position: { x: x + NODE_SPACING_X, y: branchY + NODE_SPACING_Y * 2 },
            data: { label: `${action.label} (Cold)`, nodeType: action.nodeType, ...coldConfig },
          };
          nodes.push(coldNode);
          edges.push({
            id: `e-${routerNodeId}-${coldId}-cold`,
            source: routerNodeId,
            target: coldId,
            sourceHandle: "cold",
          });
        }

        // Skip the after-router actions in the main chain (they've been branched)
        break;
      }
    }

    x += NODE_SPACING_X;
    nodeIndex++;
  }

  return { nodes, edges };
}

/**
 * Generate quick suggestions based on what's missing.
 */
function generateQuickSuggestions(intents: ParsedIntent[]): string[] {
  const suggestions: string[] = [];
  const types = new Set(intents.map(i => i.nodeType));

  if (!types.has("lead-scoring") && types.has("lead-router")) {
    suggestions.push("Consider adding Lead Scoring before Lead Router to classify leads.");
  }
  if (!types.has("lead-router") && types.has("lead-scoring")) {
    suggestions.push("Consider adding Lead Router after Lead Scoring to route leads by priority.");
  }
  if (types.has("discord") || types.has("notification")) {
    // Good — they have notifications
  } else {
    suggestions.push("Add a Notification or Discord node to alert your team.");
  }
  if (!types.has("google-sheets") && !types.has("crm")) {
    suggestions.push("Add Google Sheets or CRM to persist lead data.");
  }
  if (!types.has("log")) {
    suggestions.push("Add a Log node for debugging during development.");
  }
  if (!types.has("delay") && intents.length > 3) {
    suggestions.push("Consider adding a Delay node between steps for rate limiting.");
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
}
