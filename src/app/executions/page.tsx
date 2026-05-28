"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface ExecutionFromApi {
  id: string;
  workflowId: string;
  status: string;
  triggerSource: string;
  triggerData: any;
  duration: number | null;
  startedAt: string;
  completedAt: string | null;
  workflow: { id: string; name: string };
}

interface ExecStats {
  total: number;
  today: number;
  successRate: number;
}

const statusConfig: Record<string, { color: string; icon: string }> = {
  SUCCESS: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: "check-circle" },
  FAILED: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: "x-circle" },
  RUNNING: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: "loader" },
  PENDING: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: "clock" },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.PENDING;
  return (
    <Badge variant="outline" className={`${config.color} font-medium`}>
      {status === "RUNNING" && (
        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1.5 animate-pulse" />
      )}
      {status === "SUCCESS" && (
        <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {status === "FAILED" && (
        <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {status}
    </Badge>
  );
}

function formatDuration(ms: number | null) {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ExecutionHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [executions, setExecutions] = useState<ExecutionFromApi[]>([]);
  const [stats, setStats] = useState<ExecStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.workspace?.id) {
      loadData();
    }
  }, [user?.id, statusFilter]);

  const loadData = async () => {
    if (!user?.workspace?.id) return;
    setLoadingData(true);

    const [execResult, statsResult] = await Promise.all([
      api.executions.getAll(user.workspace.id, undefined, statusFilter || undefined),
      api.executions.getStats(user.workspace.id),
    ]);

    if (execResult.data) setExecutions(execResult.data as ExecutionFromApi[]);
    if (statsResult.data) setStats(statsResult.data as ExecStats);
    setLoadingData(false);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const filters = ["", "SUCCESS", "FAILED", "RUNNING"];
  const filterLabels: Record<string, string> = {
    "": "All",
    SUCCESS: "Succeeded",
    FAILED: "Failed",
    RUNNING: "Running",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-foreground">
              AutonomousOps
            </Link>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-sm font-medium">Execution History</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Executions</p>
                    <p className="text-2xl font-bold mt-1">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-2xl font-bold mt-1">{stats.today}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold mt-1">{stats.successRate}%</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                statusFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        {/* Executions Table */}
        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : executions.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <svg className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m0 0H7.5m2.25 0v3m0-3v-3m10.5-3V6.375a3.375 3.375 0 00-3.375-3.375H6.75a3.375 3.375 0 00-3.375 3.375v11.25A3.375 3.375 0 006.75 21h4.5" />
              </svg>
              <p className="text-muted-foreground font-medium">No executions yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Run a workflow to see execution history here</p>
              <Link href="/workflows/builder">
                <Button className="mt-4" size="sm">Go to Workflow Builder</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Workflow</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Trigger</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Duration</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Time</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((exec) => (
                      <tr
                        key={exec.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/executions/${exec.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-sm">{exec.workflow?.name || "Unknown Workflow"}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 font-mono">{exec.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={exec.status} />
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-xs capitalize">
                            {exec.triggerSource || "manual"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                          {formatDuration(exec.duration)}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground" title={formatDate(exec.startedAt)}>
                          {formatTime(exec.startedAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <svg className="w-4 h-4 text-muted-foreground inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
