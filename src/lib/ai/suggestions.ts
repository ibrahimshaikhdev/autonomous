// Suggestion Engine — post-generation workflow improvement hints
// Analyzes a generated workflow and suggests missing nodes or optimizations.

import { getNodeType } from "@/lib/node-registry";
import type { WorkflowNode, WorkflowEdge } from "@/types";

export interface Suggestion {
  type: "missing-node" | "optimization" | "info";
  message: string;
  nodeType?: string; // suggested node type to add
  icon: string;
}

/**
 * Analyze a workflow and return actionable suggestions.
 */
export function analyzeSuggestions(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const nodeTypes = new Set(nodes.map(n => n.data.nodeType as string));

  // ── Missing Node Checks ──

  // No trigger
  const hasTrigger = nodes.some(n => {
    const def = getNodeType(n.data.nodeType as string);
    return def.category === "trigger";
  });
  if (!hasTrigger && nodes.length > 0) {
    suggestions.push({
      type: "missing-node",
      message: "No trigger node found. Add a trigger to start the workflow.",
      nodeType: "lead-intake",
      icon: "⚠️",
    });
  }

  // Has router but no scoring
  if (nodeTypes.has("lead-router") && !nodeTypes.has("lead-scoring")) {
    suggestions.push({
      type: "missing-node",
      message: "Add Lead Scoring before the router to classify leads by priority.",
      nodeType: "lead-scoring",
      icon: "📊",
    });
  }

  // Has scoring but no router
  if (nodeTypes.has("lead-scoring") && !nodeTypes.has("lead-router")) {
    suggestions.push({
      type: "missing-node",
      message: "Add Lead Router after scoring to direct leads by priority.",
      nodeType: "lead-router",
      icon: "🔀",
    });
  }

  // No persistence
  const hasPersistence = nodeTypes.has("google-sheets") || nodeTypes.has("crm");
  if (!hasPersistence && nodes.length > 2) {
    suggestions.push({
      type: "missing-node",
      message: "Add Google Sheets or CRM to persist your data.",
      nodeType: "google-sheets",
      icon: "💾",
    });
  }

  // No notification
  const hasNotification = nodeTypes.has("discord") || nodeTypes.has("notification") || nodeTypes.has("send-email") || nodeTypes.has("slack");
  if (!hasNotification && nodes.length > 1) {
    suggestions.push({
      type: "missing-node",
      message: "Add a notification node to alert your team.",
      nodeType: "notification",
      icon: "🔔",
    });
  }

  // ── Optimization Checks ──

  // Many nodes but no log
  if (!nodeTypes.has("log") && nodes.length > 4) {
    suggestions.push({
      type: "optimization",
      message: "Add a Log node for easier debugging during development.",
      nodeType: "log",
      icon: "📋",
    });
  }

  // Long chain without delay
  if (!nodeTypes.has("delay") && nodes.length > 5) {
    suggestions.push({
      type: "optimization",
      message: "Consider adding a Delay between steps for rate limiting.",
      nodeType: "delay",
      icon: "⏱️",
    });
  }

  // Disconnected nodes
  const connectedIds = new Set<string>();
  for (const edge of edges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }
  const disconnected = nodes.filter(n => !connectedIds.has(n.id) && nodes.length > 1);
  if (disconnected.length > 0) {
    suggestions.push({
      type: "info",
      message: `${disconnected.length} node(s) are not connected. Drag to connect them.`,
      icon: "🔗",
    });
  }

  return suggestions.slice(0, 4); // Max 4 suggestions
}
