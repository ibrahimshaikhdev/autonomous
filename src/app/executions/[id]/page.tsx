"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExecutionDetail {
  id: string;
  workflowId: string;
  status: string;
  triggerSource: string | null;
  triggerData: any;
  outputData: any;
  nodeResults: NodeResult[];
  logs: LogEntry[];
  duration: number | null;
  startedAt: string;
  completedAt: string | null;
  errorTrace: string | null;
  workflow: { name: string; nodes: any; edges: any };
}

interface NodeResult {
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
}

interface LogEntry {
  timestamp: string;
  nodeId: string;
  nodeName: string;
  message: string;
  level: "info" | "error" | "warning" | "success";
}

const statusConfig: Record<string, { label: string; color: string; dot: string; icon: string }> = {
  SUCCESS: { label: "Success", color: "bg-green-600", dot: "bg-green-500", icon: "✅" },
  FAILED: { label: "Failed", color: "bg-red-600", dot: "bg-red-500", icon: "❌" },
  RUNNING: { label: "Running", color: "bg-blue-600", dot: "bg-blue-500 animate-pulse", icon: "🔄" },
  PENDING: { label: "Pending", color: "bg-yellow-600", dot: "bg-yellow-500", icon: "⏳" },
};

const levelColors: Record<string, string> = {
  info: "text-blue-400",
  error: "text-red-400",
  warning: "text-yellow-400",
  success: "text-green-400",
};

const nodeStatusStyles: Record<string, { bg: string; border: string; icon: string }> = {
  success: { bg: "bg-green-500/10", border: "border-green-500/30", icon: "✅" },
  failed: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "❌" },
  skipped: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: "⏭️" },
};

export default function ExecutionDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const executionId = params.id as string;

  const [execution, setExecution] = useState<ExecutionDetail | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "logs" | "payload">("timeline");
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.workspace?.id && executionId) {
      loadExecution();
    }
  }, [user?.id, executionId]);

  const loadExecution = async () => {
    if (!user?.workspace?.id) return;
    setLoadingData(true);
    const result = await api.executions.getById(user.workspace.id, executionId);
    if (result.data) {
      // Parse JSON fields if they come as strings
      const data = result.data as any;
      if (typeof data.nodeResults === "string") data.nodeResults = JSON.parse(data.nodeResults);
      if (typeof data.logs === "string") data.logs = JSON.parse(data.logs);
      if (typeof data.triggerData === "string") data.triggerData = JSON.parse(data.triggerData);
      if (typeof data.outputData === "string") data.outputData = JSON.parse(data.outputData);
      if (typeof data.workflow?.nodes === "string") data.workflow.nodes = JSON.parse(data.workflow.nodes);
      if (typeof data.workflow?.edges === "string") data.workflow.edges = JSON.parse(data.workflow.edges);
      setExecution(data);
    }
    setLoadingData(false);
  };

  const handleRetry = async () => {
    if (!user?.workspace?.id || !execution) return;
    setRetrying(true);
    const result = await api.executions.retry(user.workspace.id, execution.id);
    if (result.data) {
      router.push(`/executions/${result.data.id}`);
    }
    setRetrying(false);
  };

  const formatDuration = (ms: number | null) => {
    if (ms == null) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  if (loading || loadingData) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AppShell>
    );
  }

  if (!execution) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Execution not found</h3>
            <Button onClick={() => router.push("/executions")} className="mt-4">
              Back to Executions
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const config = statusConfig[execution.status] || statusConfig.PENDING;
  const nodeResults = execution.nodeResults || [];
  const logs = execution.logs || [];

  return (
    <AppShell>
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/executions")}>
                ← Back
              </Button>
              <Badge variant="secondary" className={`${config.color} text-white`}>
                {config.icon} {config.label}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{execution.workflow?.name || "Workflow"}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Execution {execution.id.slice(0, 8)}... • {new Date(execution.startedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {execution.status === "FAILED" && (
              <Button onClick={handleRetry} disabled={retrying}>
                {retrying ? "Retrying..." : "Retry Execution"}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="text-2xl font-bold font-mono">{formatDuration(execution.duration)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Trigger</div>
              <div className="text-2xl font-bold capitalize">
                {execution.triggerSource === "webhook" ? "Webhook" : execution.triggerSource === "retry" ? "Retry" : "Manual"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Nodes Executed</div>
              <div className="text-2xl font-bold">{nodeResults.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Log Entries</div>
              <div className="text-2xl font-bold">{logs.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Error Trace */}
        {execution.errorTrace && (
          <Card className="mb-6 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-sm text-red-400">Error Trace</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-red-300 bg-red-500/5 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {execution.errorTrace}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "timeline" as const, label: "Node Timeline" },
            { key: "logs" as const, label: "Execution Logs" },
            { key: "payload" as const, label: "Payload" },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "timeline" && (
          <div className="space-y-3">
            {nodeResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No node execution data available
              </div>
            ) : (
              nodeResults.map((node, i) => {
                const style = nodeStatusStyles[node.status] || nodeStatusStyles.skipped;
                const isExpanded = expandedNode === node.nodeId;

                return (
                  <div key={node.nodeId}>
                    <div
                      className={`rounded-lg border ${style.border} ${style.bg} p-4 cursor-pointer transition-all hover:brightness-110`}
                      onClick={() => setExpandedNode(isExpanded ? null : node.nodeId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background/50 text-sm font-bold">
                            {i + 1}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {style.icon} {node.nodeName}
                              <span className="text-xs text-muted-foreground font-normal">({node.nodeType})</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatTimestamp(node.startedAt)} → {formatTimestamp(node.completedAt)} • {formatDuration(node.duration)}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-xs capitalize ${
                          node.status === "success" ? "bg-green-600 text-white" :
                          node.status === "failed" ? "bg-red-600 text-white" :
                          "bg-yellow-600 text-white"
                        }`}>
                          {node.status}
                        </Badge>
                      </div>

                      {node.error && (
                        <div className="mt-3 text-sm text-red-300 bg-red-500/10 rounded p-2">
                          {node.error}
                        </div>
                      )}

                      {isExpanded && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Input</div>
                            <pre className="text-xs bg-background/50 rounded p-3 overflow-auto max-h-48">
                              {JSON.stringify(node.input, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Output</div>
                            <pre className="text-xs bg-background/50 rounded p-3 overflow-auto max-h-48">
                              {JSON.stringify(node.output, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                    {i < nodeResults.length - 1 && (
                      <div className="flex justify-center py-1">
                        <div className="w-0.5 h-4 bg-border" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "logs" && (
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No logs available</div>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 px-4 py-2 border-b border-border hover:bg-muted/30 font-mono text-sm"
                    >
                      <span className="text-muted-foreground shrink-0 text-xs mt-0.5">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span className={`shrink-0 w-16 text-xs font-medium ${levelColors[log.level]}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-muted-foreground shrink-0 w-32 truncate text-xs">
                        [{log.nodeName}]
                      </span>
                      <span className="text-sm">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "payload" && (
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Trigger Input</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted rounded p-4 overflow-auto max-h-[500px]">
                  {execution.triggerData
                    ? JSON.stringify(execution.triggerData, null, 2)
                    : "No trigger data"}
                </pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Final Output</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted rounded p-4 overflow-auto max-h-[500px]">
                  {execution.outputData
                    ? JSON.stringify(execution.outputData, null, 2)
                    : "No output data"}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </AppShell>
  );
}
