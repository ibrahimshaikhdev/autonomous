"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

const navItems = [
  { icon: "📊", label: "Dashboard", href: "/dashboard", active: true },
  { icon: "🔄", label: "Workflows", href: "/workflows/builder", active: false },
  { icon: "📜", label: "History", href: "/workflows/history", active: false },
  { icon: "🏢", label: "Workspace", href: "/settings", active: false },
  { icon: "⚙️", label: "Settings", href: "/settings", active: false },
];

const sidebarLinks = [
  { icon: "📁", label: "All Workflows", count: 24 },
  { icon: "▶️", label: "Active", count: 18 },
  { icon: "⏸️", label: "Inactive", count: 4 },
  { icon: "📝", label: "Drafts", count: 2 },
];

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

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [workflows, setWorkflows] = useState<WorkflowFromApi[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    } else if (!loading && user) {
      setIsLoadingPage(false);
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

  if (loading || isLoadingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const recentWorkflows = workflows.slice(0, 5);

  // Get actual user initials for avatar
  const userInitials = user.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user.email[0].toUpperCase();

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
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 mt-8">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Filters
          </h3>
          {sidebarLinks.map((link) => (
            <Link
              key={link.label}
              href="#"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>{link.icon}</span>
                {link.label}
              </span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{link.count}</span>
            </Link>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-medium">
                  {userInitials}
                </div>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium">{user.name || "User"}</div>
                <div className="text-muted-foreground text-xs">{user.workspace?.name || "Personal"}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user.name || user.email.split('@')[0]}!</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Workflows</CardTitle>
                <span className="text-2xl">📊</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{workflowsLoading ? "—" : workflows.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Saved workflows</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Public Workflows</CardTitle>
                <span className="text-2xl">▶️</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{workflowsLoading ? "—" : workflows.filter(w => w.isPublic).length}</div>
                <p className="text-xs text-green-400 mt-1">Shared with workspace</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
                <span className="text-2xl">⚡</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {workflowsLoading ? "—" : workflows.filter(w => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(w.createdAt) > weekAgo;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">New this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Workspace</CardTitle>
                <span className="text-2xl">✅</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{user.workspace?.name?.split(' ')[0] || "—"}</div>
                <p className="text-xs text-muted-foreground mt-1">Active workspace</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Workflows */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Workflows</CardTitle>
                <CardDescription>Your most recently modified workflows</CardDescription>
              </CardHeader>
              <CardContent>
                {workflowsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : recentWorkflows.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No workflows yet</p>
                    <Link href="/workflows/builder">
                      <Button>Create Your First Workflow</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {recentWorkflows.map((workflow) => (
                        <Link
                          key={workflow.id}
                          href={`/workflows/builder?id=${workflow.id}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-accent transition-colors block"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{workflow.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {workflow.description || "No description"}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            {workflow.isPublic && (
                              <Badge variant="outline">Public</Badge>
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(workflow.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <Link href="/workflows/history" className="block mt-4">
                      <Button variant="outline" className="w-full">
                        View All Workflows
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest workflow executions and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="w-2 h-2 rounded-full mt-2 bg-green-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium">Lead Qualification Pipeline</span> executed successfully
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">2 minutes ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="w-2 h-2 rounded-full mt-2 bg-green-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium">Customer Onboarding Flow</span> completed
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">1 hour ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="w-2 h-2 rounded-full mt-2 bg-red-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium">Invoice Generation</span> failed
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">3 hours ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/workflows/builder">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                  <span className="text-2xl">➕</span>
                  <span>Create New Workflow</span>
                </Button>
              </Link>
              <Link href="/workflows/history">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                  <span className="text-2xl">📜</span>
                  <span>View Execution History</span>
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                  <span className="text-2xl">⚙️</span>
                  <span>Configure Settings</span>
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}