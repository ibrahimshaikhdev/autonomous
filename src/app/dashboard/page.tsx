"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { dashboardStats, activities, currentUser } from "@/mock-data/dashboard";
import { workflows } from "@/mock-data/workflows";
import { formatRelativeTime } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { icon: "📊", label: "Dashboard", href: "/dashboard", active: true },
  { icon: "🔄", label: "Workflows", href: "/workflows/builder", active: false },
  { icon: "📜", label: "History", href: "/workflows/history", active: false },
  { icon: "⚙️", label: "Settings", href: "/settings", active: false },
];

const sidebarLinks = [
  { icon: "📁", label: "All Workflows", count: 24 },
  { icon: "▶️", label: "Active", count: 18 },
  { icon: "⏸️", label: "Inactive", count: 4 },
  { icon: "📝", label: "Drafts", count: 2 },
];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const recentWorkflows = workflows.slice(0, 5);

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
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <span className="text-xl">🔔</span>
            </Button>
            <div className="flex items-center gap-3">
              <Avatar src={currentUser.avatar} alt={currentUser.name} />
              <div className="text-sm">
                <div className="font-medium">{currentUser.name}</div>
                <div className="text-muted-foreground text-xs">{currentUser.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your workflow overview.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Workflows</CardTitle>
                <span className="text-2xl">📊</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboardStats.totalWorkflows}</div>
                <p className="text-xs text-muted-foreground mt-1">+2 this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Workflows</CardTitle>
                <span className="text-2xl">▶️</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboardStats.activeWorkflows}</div>
                <p className="text-xs text-green-400 mt-1">All running smoothly</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Executions Today</CardTitle>
                <span className="text-2xl">⚡</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboardStats.executionsToday}</div>
                <p className="text-xs text-muted-foreground mt-1">+12% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
                <span className="text-2xl">✅</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboardStats.successRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
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
                <div className="space-y-4">
                  {recentWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-accent transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{workflow.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{workflow.description}</div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Badge
                          variant={
                            workflow.status === "active"
                              ? "success"
                              : workflow.status === "inactive"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {workflow.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {workflow.executions} runs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/workflows/history" className="block mt-4">
                  <Button variant="outline" className="w-full">
                    View All Workflows
                  </Button>
                </Link>
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
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          activity.status === "success"
                            ? "bg-green-500"
                            : activity.status === "failed"
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <span className="font-medium">{activity.description.split(" ")[0]}</span>{" "}
                          {activity.description.split(" ").slice(1).join(" ")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
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