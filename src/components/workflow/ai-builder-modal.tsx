"use client";

import { useState, useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { getNodeType, getDefaultConfig } from "@/lib/node-registry";
import { generateWorkflow, type GeneratedWorkflow } from "@/lib/ai/workflow-generator";
import { findMatchingTemplate, getAllTemplates, type WorkflowTemplate } from "@/lib/ai/templates";
import { analyzeSuggestions, type Suggestion } from "@/lib/ai/suggestions";
import type { WorkflowNode } from "@/types";

// Inline mini-node for preview (avoids import issues with the builder's WorkflowNode)
function PreviewNode({ data }: NodeProps) {
  const nodeTypeDef = getNodeType(data.nodeType);
  const colorClass = nodeTypeDef.color;
  const icon = nodeTypeDef.icon;
  const outputHandles = nodeTypeDef.outputHandles;

  return (
    <div className={`px-3 py-2 rounded-lg border-2 shadow-md min-w-[120px] text-center ${colorClass}`}>
      <Handle type="target" position={Position.Left} className="!bg-border !border-border" />
      <div className="text-lg mb-0.5">{icon}</div>
      <div className="text-xs font-medium truncate">{data.label}</div>

      {outputHandles ? (
        <div className="flex flex-col items-end gap-0.5 mt-1">
          {outputHandles.map((h, i) => (
            <div key={h.id} className="flex items-center gap-0.5">
              <span className="text-[9px] font-medium" style={{ color: h.color }}>{h.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={h.id}
                style={{
                  background: h.color,
                  borderColor: h.color,
                  width: 8,
                  height: 8,
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

const previewNodeTypes = { workflowNode: PreviewNode };

interface AIBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (nodes: Node[], edges: Edge[], name: string, description: string) => void;
}

type Tab = "generate" | "templates";

export function AIBuilderModal({ isOpen, onClose, onApply }: AIBuilderModalProps) {
  const [tab, setTab] = useState<Tab>("generate");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedWorkflow | null>(null);
  const [previewNodes, setPreviewNodes, onPreviewNodesChange] = useNodesState([]);
  const [previewEdges, setPreviewEdges, onPreviewEdgesChange] = useEdgesState([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    setGenerating(true);

    // Simulate brief processing (deterministic, but gives visual feedback)
    setTimeout(() => {
      // Check templates first
      const template = findMatchingTemplate(prompt);
      let generated: GeneratedWorkflow;

      if (template) {
        generated = {
          nodes: template.nodes,
          edges: template.edges,
          name: template.name,
          description: template.description,
          suggestions: ["Based on template: " + template.name],
        };
      } else {
        generated = generateWorkflow(prompt);
      }

      setResult(generated);
      setPreviewNodes(generated.nodes);
      setPreviewEdges(generated.edges);
      setSuggestions(analyzeSuggestions(generated.nodes, generated.edges));
      setGenerating(false);
    }, 400);
  }, [prompt, setPreviewNodes, setPreviewEdges]);

  const handleApply = useCallback(() => {
    if (!result) return;
    onApply(result.nodes, result.edges, result.name, result.description);
    onClose();
    setPrompt("");
    setResult(null);
    setSuggestions([]);
  }, [result, onApply, onClose]);

  const handleUseTemplate = useCallback((template: WorkflowTemplate) => {
    const generated: GeneratedWorkflow = {
      nodes: template.nodes,
      edges: template.edges,
      name: template.name,
      description: template.description,
      suggestions: [],
    };
    setResult(generated);
    setPreviewNodes(generated.nodes);
    setPreviewEdges(generated.edges);
    setSuggestions(analyzeSuggestions(generated.nodes, generated.edges));
    setPrompt(template.description);
  }, [setPreviewNodes, setPreviewEdges]);

  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    if (suggestion.nodeType && result) {
      // Add the suggested node to the preview
      const defaultConfig = getDefaultConfig(suggestion.nodeType);
      const nodeTypeDef = getNodeType(suggestion.nodeType);
      const newNode: WorkflowNode = {
        id: `${suggestion.nodeType}-${Date.now()}`,
        type: "workflowNode",
        position: { x: (result.nodes.length) * 300 + 50, y: 200 },
        data: { label: nodeTypeDef.label, nodeType: suggestion.nodeType, ...defaultConfig },
      };

      // Connect to last node if exists
      const lastNode = result.nodes[result.nodes.length - 1];
      const newEdges = [...result.edges];
      if (lastNode) {
        newEdges.push({
          id: `e-${lastNode.id}-${newNode.id}`,
          source: lastNode.id,
          target: newNode.id,
        });
      }

      const updatedNodes = [...result.nodes, newNode];
      const updatedResult = { ...result, nodes: updatedNodes, edges: newEdges };
      setResult(updatedResult);
      setPreviewNodes(updatedNodes);
      setPreviewEdges(newEdges);
      setSuggestions(analyzeSuggestions(updatedNodes, newEdges));
    }
  }, [result, setPreviewNodes, setPreviewEdges]);

  if (!isOpen) return null;

  const templates = getAllTemplates();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-[95vw] max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <h2 className="text-lg font-semibold">AI Workflow Builder</h2>
              <p className="text-xs text-muted-foreground">Describe your workflow in plain English</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab buttons */}
            <div className="flex bg-muted rounded-lg p-0.5 mr-4">
              <button
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === "generate" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setTab("generate")}
              >
                Generate
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === "templates" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setTab("templates")}
              >
                Templates
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === "generate" ? (
            <>
              {/* Prompt Input */}
              <div className="p-4 border-b border-border">
                <div className="flex gap-2">
                  <textarea
                    className="flex-1 min-h-[80px] p-3 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                    placeholder="Describe your workflow... e.g. 'When a lead submits a form, score it, route hot leads to Discord, save all to Google Sheets'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || generating}
                      className="flex-1"
                    >
                      {generating ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin">⏳</span> Generating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">✨ Generate</span>
                      )}
                    </Button>
                    {result && (
                      <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                        🔄 Regenerate
                      </Button>
                    )}
                  </div>
                </div>

                {/* Quick prompt suggestions */}
                {!result && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[
                      "Lead capture and qualification flow",
                      "Webhook to Discord relay",
                      "Score leads and save to CRM",
                      "Notify team on new hot leads",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        className="px-3 py-1.5 text-xs rounded-full border border-border bg-muted/50 hover:bg-muted hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                        onClick={() => { setPrompt(suggestion); }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Main content: Preview + Suggestions */}
              <div className="flex-1 flex overflow-hidden">
                {/* Preview Canvas */}
                <div className="flex-1 relative">
                  {result && previewNodes.length > 0 ? (
                    <ReactFlow
                      nodes={previewNodes}
                      edges={previewEdges}
                      onNodesChange={onPreviewNodesChange}
                      onEdgesChange={onPreviewEdgesChange}
                      nodeTypes={previewNodeTypes}
                      fitView
                      nodesDraggable={false}
                      nodesConnectable={false}
                      elementsSelectable={false}
                      className="bg-background"
                    >
                      <Background gap={24} size={1} />
                    </ReactFlow>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <span className="text-4xl block mb-3">✨</span>
                        <p className="text-sm">Describe your workflow above and click Generate</p>
                        <p className="text-xs mt-1">Or use a template from the Templates tab</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions Sidebar */}
                {(result || suggestions.length > 0) && (
                  <div className="w-72 border-l border-border p-4 overflow-auto">
                    {/* Workflow Info */}
                    {result && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-1">{result.name}</h4>
                        <p className="text-xs text-muted-foreground">{result.description}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {result.nodes.length} nodes
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {result.edges.length} connections
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Suggestions</h4>
                        <div className="space-y-2">
                          {suggestions.map((s, i) => (
                            <div
                              key={i}
                              className={`p-2.5 rounded-lg border text-xs ${
                                s.type === "missing-node"
                                  ? "border-amber-500/30 bg-amber-500/5"
                                  : s.type === "optimization"
                                  ? "border-blue-500/30 bg-blue-500/5"
                                  : "border-border bg-muted/30"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="shrink-0">{s.icon}</span>
                                <span className="flex-1 text-muted-foreground">{s.message}</span>
                              </div>
                              {s.nodeType && (
                                <button
                                  className="mt-2 text-[10px] font-medium text-primary hover:underline"
                                  onClick={() => handleSuggestionClick(s)}
                                >
                                  + Add {getNodeType(s.nodeType).label}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Templates Tab */
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 rounded-xl border border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group"
                    onClick={() => { handleUseTemplate(template); setTab("generate"); }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📋</span>
                      <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                        {template.name}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-full bg-background border border-border">
                        {template.nodes.length} nodes
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-background border border-border">
                        {template.edges.length} connections
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {result && tab === "generate" && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
            <div className="text-xs text-muted-foreground">
              Preview: {result.nodes.length} nodes, {result.edges.length} connections
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={result.nodes.length === 0}>
                ✨ Use This Workflow
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
