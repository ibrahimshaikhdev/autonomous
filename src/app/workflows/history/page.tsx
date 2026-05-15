"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { executions } from "@/mock-data/executions";
import { formatDate, formatTime, formatDuration } from "@/lib/utils";
import Link from "next/link";

type StatusFilter = "all" | "success" | "failed" | "running";

export default function WorkflowHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedExecution, setExpandedExecution] = useState<string | null>(null);

  const filteredExecutions = executions.filter((exec) => {
    const matchesSearch = exec.workflowName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || exec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="success">Success</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return <Badge variant="warning">Running</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card shrink-0">
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              A
            </div>
            <span className="text-xl font-bold tracking-tight">AutonomousOps</span>
          </Link>
        </div>

        <div className="p-4">
          <Link href="/workflows/builder">
            <Button className="w-full mb-4">
              <span className="mr-2">+</span>
              New Workflow
            </Button>
          </Link>
        </div>

        <nav className="px-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <span>📊</span> Dashboard
          </Link>
          <Link href="/workflows/builder" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <span>🔄</span> Workflows
          </Link>
          <Link href="/workflows/history" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-primary/10 text-primary">
            <span>📜</span> History
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <span>⚙️</span> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div>
            <h2 className="text-lg font-semibold">Execution History</h2>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              📥 Export
            </Button>
            <Button variant="outline" size="sm">
              🗑️ Clear History
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "success" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("success")}
              >
                Success
              </Button>
              <Button
                variant={statusFilter === "failed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("failed")}
              >
                Failed
              </Button>
              <Button
                variant={statusFilter === "running" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("running")}
              >
                Running
              </Button>
            </div>
          </div>

          {/* Execution Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Workflow</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Started</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Duration</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExecutions.map((execution) => (
                      <>
                        <tr key={execution.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium">{execution.workflowName}</div>
                            <div className="text-sm text-muted-foreground">{execution.id}</div>
                          </td>
                          <td className="p-4">{getStatusBadge(execution.status)}</td>
                          <td className="p-4">
                            <div className="text-sm">{formatDate(execution.startedAt)}</div>
                            <div className="text-xs text-muted-foreground">{formatTime(execution.startedAt)}</div>
                          </td>
                          <td className="p-4 text-sm">
                            {execution.duration ? formatDuration(execution.duration) : "—"}
                          </td>
                          <td className="p-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedExecution(expandedExecution === execution.id ? null : execution.id)
                              }
                            >
                              {expandedExecution === execution.id ? "Hide Logs" : "View Logs"}
                            </Button>
                          </td>
                        </tr>

                        {/* Expanded Logs */}
                        {expandedExecution === execution.id && (
                          <tr>
                            <td colSpan={5} className="p-4 bg-muted/30">
                              <div className="rounded-lg border border-border p-4">
                                <h4 className="text-sm font-semibold mb-3">Execution Logs</h4>
                                <div className="space-y-2 font-mono text-xs">
                                  {execution.logs.map((log, index) => (
                                    <div key={index} className={`flex gap-4 ${getLogLevelColor(log.level)}`}>
                                      <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
                                      <span className="shrink-0">[{log.node}]</span>
                                      <span>{log.message}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>

                {filteredExecutions.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No executions found matching your filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">Showing {filteredExecutions.length} of {executions.length} executions</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                ← Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next →
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}