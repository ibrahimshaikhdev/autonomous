"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { currentUser } from "@/mock-data/dashboard";
import Link from "next/link";

type Tab = "profile" | "workspace" | "appearance" | "notifications";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const tabs = [
    { id: "profile" as Tab, label: "Profile", icon: "👤" },
    { id: "workspace" as Tab, label: "Workspace", icon: "🏢" },
    { id: "appearance" as Tab, label: "Appearance", icon: "🎨" },
    { id: "notifications" as Tab, label: "Notifications", icon: "🔔" },
  ];

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

        <nav className="px-2 py-4">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <span>📊</span> Dashboard
          </Link>
          <Link href="/workflows/builder" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <span>🔄</span> Workflows
          </Link>
          <Link href="/workflows/history" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <span>📜</span> History
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-primary/10 text-primary">
            <span>⚙️</span> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-card flex items-center px-6">
          <h2 className="text-lg font-semibold">Settings</h2>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-8 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal details and profile picture.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar src={currentUser.avatar} alt={currentUser.name} className="w-20 h-20" />
                      <div className="space-y-2">
                        <Button variant="outline" size="sm">Upload New Photo</Button>
                        <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="Alex" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Morgan" className="mt-1" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue={currentUser.email} className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" defaultValue={currentUser.role} className="mt-1" />
                    </div>

                    <div className="flex justify-end">
                      <Button>Save Changes</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your password and security settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" placeholder="••••••••" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" placeholder="••••••••" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input id="confirmPassword" type="password" placeholder="••••••••" className="mt-1" />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline">Change Password</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Workspace Tab */}
            {activeTab === "workspace" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Workspace Details</CardTitle>
                    <CardDescription>Manage your workspace name and settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="workspaceName">Workspace Name</Label>
                      <Input id="workspaceName" defaultValue="AutonomousOps AI" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="workspaceSlug">Workspace URL</Label>
                      <Input id="workspaceSlug" defaultValue="autonomousops-ai" className="mt-1" />
                      <p className="text-sm text-muted-foreground mt-1">autonomousops.app/{currentUser.email.split("@")[1]?.split(".")[0]}/workspace</p>
                    </div>
                    <div className="flex justify-end">
                      <Button>Save Workspace</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your team and permissions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <Avatar src={currentUser.avatar} alt={currentUser.name} />
                          <div>
                            <div className="font-medium">{currentUser.name}</div>
                            <div className="text-sm text-muted-foreground">{currentUser.email}</div>
                          </div>
                        </div>
                        <Badge>Owner</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="mt-4">Invite Team Member</Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Theme</CardTitle>
                    <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <button
                        onClick={() => setTheme("dark")}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          theme === "dark" ? "border-primary" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="aspect-video bg-slate-900 rounded-md mb-3 flex items-center justify-center">
                          <span className="text-4xl">🌙</span>
                        </div>
                        <div className="font-medium">Dark</div>
                        <div className="text-sm text-muted-foreground">Easy on the eyes</div>
                      </button>
                      <button
                        onClick={() => setTheme("light")}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          theme === "light" ? "border-primary" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="aspect-video bg-slate-100 rounded-md mb-3 flex items-center justify-center">
                          <span className="text-4xl">☀️</span>
                        </div>
                        <div className="font-medium">Light</div>
                        <div className="text-sm text-muted-foreground">Classic bright theme</div>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Accent Color</CardTitle>
                    <CardDescription>Choose your preferred accent color.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      {["#4f46e5", "#7c3aed", "#db2777", "#ea580c", "#16a34a"].map((color) => (
                        <button
                          key={color}
                          className="w-10 h-10 rounded-full border-2 border-transparent hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Choose which emails you want to receive.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <div className="font-medium">Workflow Execution Results</div>
                        <div className="text-sm text-muted-foreground">Get notified when workflows complete or fail</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <div className="font-medium">Weekly Reports</div>
                        <div className="text-sm text-muted-foreground">Receive weekly summaries of your workflows</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <div className="font-medium">Product Updates</div>
                        <div className="text-sm text-muted-foreground">Be the first to know about new features</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">Marketing Emails</div>
                        <div className="text-sm text-muted-foreground">Tips, best practices, and promotional content</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}