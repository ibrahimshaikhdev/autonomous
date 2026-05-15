"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { currentUser } from "@/mock-data/dashboard";
import Link from "next/link";

const nodeTypes = [
  { type: "trigger", label: "Trigger", icon: "⚡", color: "bg-yellow-500/20 border-yellow-500" },
  { type: "action", label: "Action", icon: "⚙️", color: "bg-blue-500/20 border-blue-500" },
  { type: "condition", label: "Condition", icon: "🔀", color: "bg-purple-500/20 border-purple-500" },
  { type: "ai", label: "AI Agent", icon: "🤖", color: "bg-green-500/20 border-green-500" },
  { type: "webhook", label: "Webhook", icon: "🔗", color: "bg-orange-500/20 border-orange-500" },
  { type: "transform", label: "Transform", icon: "🔄", color: "bg-cyan-500/20 border-cyan-500" },
];

const triggerNodes = [
  { name: "Webhook", icon: "🔗" },
  { name: "Schedule", icon: "⏰" },
  { name: "Email", icon: "📧" },
  { name: "Form", icon: "📝" },
  { name: "API", icon: "🌐" },
];

const actionNodes = [
  { name: "Send Email", icon: "📧" },
  { name: "Slack Message", icon: "💬" },
  { name: "Save to CRM", icon: "💾" },
  { name: "Create Task", icon: "✅" },
  { name: "HTTP Request", icon: "🌐" },
];

const aiNodes = [
  { name: "Classify", icon: "🏷️" },
  { name: "Generate", icon: "✨" },
  { name: "Analyze", icon: "📊" },
  { name: "Chat", icon: "💬" },
];

const mockNodes = [
  { id: "1", type: "trigger", label: "Webhook Trigger", position: { x: 50, y: 150 }, icon: "🔗" },
  { id: "2", type: "ai", label: "AI Classifier", position: { x: 300, y: 150 }, icon: "🤖" },
  { id: "3", type: "condition", label: "Check Score", position: { x: 550, y: 150 }, icon: "🔀" },
  { id: "4", type: "action", label: "Save to CRM", position: { x: 300, y: 300 }, icon: "💾" },
  { id: "5", type: "action", label: "Send Slack", position: { x: 550, y: 300 }, icon: "💬" },
];

const mockEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e3-5", source: "3", target: "5" },
];

export default function WorkflowBuilderPage() {
  const [selectedNode, setSelectedNode] = useState<any>(mockNodes[1]);
  const [zoom, setZoom] = useState(1);

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
            {triggerNodes.map((node) => (
              <div
                key={node.name}
                className="flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors bg-background"
              >
                <span className="text-lg">{node.icon}</span>
                <span className="text-sm">{node.name}</span>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Actions</h3>
          <div className="space-y-2 mb-4">
            {actionNodes.map((node) => (
              <div
                key={node.name}
                className="flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors bg-background"
              >
                <span className="text-lg">{node.icon}</span>
                <span className="text-sm">{node.name}</span>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-muted-foreground mb-3">AI Nodes</h3>
          <div className="space-y-2">
            {aiNodes.map((node) => (
              <div
                key={node.name}
                className="flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors bg-background"
              >
                <span className="text-lg">{node.icon}</span>
                <span className="text-sm">{node.name}</span>
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
              defaultValue="Lead Qualification Pipeline"
              className="w-64 font-semibold"
            />
            <Badge variant="success">Active</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
              −
            </Button>
            <span className="text-sm text-muted-foreground w-16 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}>
              +
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="outline" size="sm">
              🔄 Reset
            </Button>
            <Button variant="outline" size="sm">
              💾 Save
            </Button>
            <Button size="sm">
              ▶️ Run
            </Button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-background" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)", backgroundSize: "24px 24px" }}>
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            {/* Render nodes and edges */}
            {mockNodes.map((node) => (
              <div
                key={node.id}
                className={`absolute cursor-pointer transition-all hover:scale-105 ${
                  node.type === "trigger"
                    ? "bg-yellow-500/20 border-yellow-500"
                    : node.type === "ai"
                    ? "bg-green-500/20 border-green-500"
                    : node.type === "condition"
                    ? "bg-purple-500/20 border-purple-500"
                    : "bg-blue-500/20 border-blue-500"
                } border-2 rounded-lg p-4 w-40 text-center shadow-lg`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                }}
                onClick={() => setSelectedNode(node)}
              >
                <div className="text-2xl mb-2">{node.icon}</div>
                <div className="text-sm font-medium">{node.label}</div>
              </div>
            ))}

            {/* Render edges as SVG */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
              {mockEdges.map((edge) => {
                const sourceNode = mockNodes.find((n) => n.id === edge.source);
                const targetNode = mockNodes.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const x1 = sourceNode.position.x + 80;
                const y1 = sourceNode.position.y + 30;
                const x2 = targetNode.position.x;
                const y2 = targetNode.position.y + 30;

                return (
                  <path
                    key={edge.id}
                    d={`M ${x1} ${y1} C ${x1 + 100} ${y1}, ${x2 - 100} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Configuration Panel */}
      <aside className="w-72 border-l border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Node Configuration</h3>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          {selectedNode && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                <span className="text-2xl">{selectedNode.icon}</span>
                <div>
                  <div className="font-medium">{selectedNode.label}</div>
                  <div className="text-xs text-muted-foreground capitalize">{selectedNode.type}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Node Name</Label>
                  <Input defaultValue={selectedNode.label} className="mt-1" />
                </div>

                {selectedNode.type === "ai" && (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground">AI Model</Label>
                      <select className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                        <option>GPT-4</option>
                        <option>Claude 3</option>
                        <option>GPT-3.5</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Prompt</Label>
                      <textarea
                        className="w-full mt-1 h-24 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                        defaultValue="Classify the incoming lead based on the form data. Score from 0-100 and categorize as Hot, Warm, or Cold."
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === "trigger" && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                    <Input defaultValue="https://api.autonomousops.ai/webhook/abc123" className="mt-1" />
                  </div>
                )}

                {selectedNode.type === "condition" && (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground">Field</Label>
                      <select className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                        <option>Lead Score</option>
                        <option>Company Size</option>
                        <option>Industry</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Operator</Label>
                      <select className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                        <option>Greater than</option>
                        <option>Less than</option>
                        <option>Equals</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Value</Label>
                      <Input defaultValue="70" className="mt-1" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <Button className="w-full">Apply Changes</Button>
        </div>
      </aside>
    </div>
  );
}