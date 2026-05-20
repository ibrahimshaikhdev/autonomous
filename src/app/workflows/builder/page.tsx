"use client";

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

// Node type definitions
const nodeCategories = {
  triggers: [
    { type: "webhook", label: "Webhook", icon: "🔗" },
    { type: "schedule", label: "Schedule", icon: "⏰" },
    { type: "email-trigger", label: "Email", icon: "📧" },
    { type: "form", label: "Form", icon: "📝" },
    { type: "api-trigger", label: "API", icon: "🌐" },
  ],
  actions: [
    { type: "send-email", label: "Send Email", icon: "📧" },
    { type: "slack", label: "Slack Message", icon: "💬" },
    { type: "crm", label: "Save to CRM", icon: "💾" },
    { type: "task", label: "Create Task", icon: "✅" },
    { type: "http", label: "HTTP Request", icon: "🌐" },
  ],
  ai: [
    { type: "classify", label: "Classify", icon: "🏷️" },
    { type: "generate", label: "Generate", icon: "✨" },
    { type: "analyze", label: "Analyze", icon: "📊" },
    { type: "chat", label: "Chat", icon: "💬" },
  ],
  logic: [
    { type: "condition", label: "Condition", icon: "🔀" },
    { type: "transform", label: "Transform", icon: "🔄" },
    { type: "delay", label: "Delay", icon: "⏱️" },
  ],
};

const nodeColors: Record<string, string> = {
  webhook: "bg-yellow-500/20 border-yellow-500",
  schedule: "bg-yellow-500/20 border-yellow-500",
  "email-trigger": "bg-yellow-500/20 border-yellow-500",
  form: "bg-yellow-500/20 border-yellow-500",
  "api-trigger": "bg-yellow-500/20 border-yellow-500",
  "send-email": "bg-blue-500/20 border-blue-500",
  slack: "bg-blue-500/20 border-blue-500",
  crm: "bg-blue-500/20 border-blue-500",
  task: "bg-blue-500/20 border-blue-500",
  http: "bg-blue-500/20 border-blue-500",
  classify: "bg-green-500/20 border-green-500",
  generate: "bg-green-500/20 border-green-500",
  analyze: "bg-green-500/20 border-green-500",
  chat: "bg-green-500/20 border-green-500",
  condition: "bg-purple-500/20 border-purple-500",
  transform: "bg-cyan-500/20 border-cyan-500",
  delay: "bg-orange-500/20 border-orange-500",
};

const nodeIcons: Record<string, string> = {
  webhook: "🔗", schedule: "⏰", "email-trigger": "📧", form: "📝", "api-trigger": "🌐",
  "send-email": "📧", slack: "💬", crm: "💾", task: "✅", http: "🌐",
  classify: "🏷️", generate: "✨", analyze: "📊", chat: "💬",
  condition: "🔀", transform: "🔄", delay: "⏱️",
};

// Custom node component
function WorkflowNode({ data, selected }: NodeProps) {
  const colorClass = nodeColors[data.nodeType] || "bg-gray-500/20 border-gray-500";
  const icon = nodeIcons[data.nodeType] || "⚙️";

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-lg min-w-[140px] text-center cursor-pointer transition-all hover:scale-105 ${colorClass} ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-border !border-border" />
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-sm font-medium">{data.label}</div>
      <div className="text-xs text-muted-foreground capitalize mt-1">{data.nodeType}</div>
      <Handle type="source" position={Position.Right} className="!bg-border !border-border" />
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
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

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
      const parsedNodes = typeof wf.nodes === "string" ? JSON.parse(wf.nodes) : wf.nodes;
      const parsedEdges = typeof wf.edges === "string" ? JSON.parse(wf.edges) : wf.edges;
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
        // Redirect to the new workflow's URL
        router.replace(`/workflows/builder?id=${result.data.id}`);
      }
    }
    setSaving(false);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      pushToHistory();
      setEdges((eds) => addEdge({ ...params, id: `e-${params.source}-${params.target}` }, eds));
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

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: "workflowNode",
        position,
        data: { label: nodeLabel, nodeType },
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
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "💾 Saving..." : "💾 Save"}
            </Button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
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
        </div>
      </div>

      {/* Right Sidebar - Configuration Panel */}
      <aside className="w-72 border-l border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Node Configuration</h3>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                <span className="text-2xl">{nodeIcons[selectedNode.data.nodeType] || "⚙️"}</span>
                <div>
                  <div className="font-medium">{selectedNode.data.label}</div>
                  <div className="text-xs text-muted-foreground capitalize">{selectedNode.data.nodeType}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Node Name</Label>
                  <Input
                    value={selectedNode.data.label}
                    onChange={(e) => updateNodeLabel(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Node ID</Label>
                  <Input value={selectedNode.id} disabled className="mt-1" />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Position</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={`x: ${Math.round(selectedNode.position.x)}`} disabled className="flex-1" />
                    <Input value={`y: ${Math.round(selectedNode.position.y)}`} disabled className="flex-1" />
                  </div>
                </div>
              </div>

              <Button variant="destructive" size="sm" className="w-full mt-4" onClick={deleteSelectedNode}>
                🗑️ Delete Node
              </Button>
            </div>
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
