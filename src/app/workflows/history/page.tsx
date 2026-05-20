"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface WorkflowFromApi {
  id: string;
  name: string;
  description: string | null;
  nodes: any;
  edges: any;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [workflows, setWorkflows] = useState<WorkflowFromApi[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<WorkflowFromApi | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.workspace?.id) {
      setWorkflows([]);
      loadWorkflows();
    }
  }, [user?.id]);

  const loadWorkflows = async () => {
    if (!user?.workspace?.id) return;
    setWorkflowsLoading(true);
    const result = await api.workflows.getAll(user.workspace.id);
    if (result.data) {
      setWorkflows(result.data);
    }
    setWorkflowsLoading(false);
  };

  const handleDelete = async () => {
    if (!user?.workspace?.id || !deleteTarget) return;
    setDeleting(true);
    const result = await api.workflows.delete(user.workspace.id, deleteTarget.id);
    if (!result.error) {
      setWorkflows((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
    setDeleting(false);
  };

  const handleDuplicate = async (id: string) => {
    if (!user?.workspace?.id) return;
    const result = await api.workflows.duplicate(user.workspace.id, id);
    if (result.data) {
      loadWorkflows();
    }
  };

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.description && w.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

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
            <span>📜</span> My Workflows
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
            <h2 className="text-lg font-semibold">My Workflows</h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}
            </span>
            <Link href="/workflows/builder">
              <Button size="sm">+ New Workflow</Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Search */}
          <div className="mb-6">
            <Input
              type="search"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Loading State */}
          {workflowsLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Empty State */}
          {!workflowsLoading && workflows.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-6">Create your first workflow to get started</p>
              <Link href="/workflows/builder">
                <Button>Create Workflow</Button>
              </Link>
            </div>
          )}

          {/* Workflow Cards */}
          {!workflowsLoading && filteredWorkflows.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredWorkflows.map((workflow) => {
                const nodeCount = (() => {
                  try {
                    const parsed = typeof workflow.nodes === "string" ? JSON.parse(workflow.nodes) : workflow.nodes;
                    return Array.isArray(parsed) ? parsed.length : 0;
                  } catch { return 0; }
                })();

                return (
                  <Card key={workflow.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{workflow.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {workflow.description || "No description"}
                          </p>
                        </div>
                        {workflow.isPublic && (
                          <Badge variant="outline" className="ml-2 shrink-0">Public</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <span>{nodeCount} node{nodeCount !== 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span>Updated {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/workflows/builder?id=${workflow.id}`} className="flex-1">
                          <Button variant="default" size="sm" className="w-full">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDuplicate(workflow.id); }}
                        >
                          Duplicate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(workflow); }}
                        >
                          🗑️
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* No search results */}
          {!workflowsLoading && workflows.length > 0 && filteredWorkflows.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No workflows match your search.</p>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Delete Workflow</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
