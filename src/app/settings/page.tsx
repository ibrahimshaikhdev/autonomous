"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/components/theme-provider";
import { api } from "@/lib/api";
import Link from "next/link";

type Tab = "profile" | "workspace" | "appearance" | "notifications";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Profile form state
  const [profileName, setProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Notification state
  const [weeklyReports, setWeeklyReports] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMessage("");
    const result = await api.users.updateProfile({ name: profileName });
    if (result.error) {
      setProfileMessage("Error: " + result.error);
    } else {
      setProfileMessage("Profile updated!");
    }
    setProfileSaving(false);
    setTimeout(() => setProfileMessage(""), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const userInitials = user.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user.email[0].toUpperCase();

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
                    <CardDescription>Update your personal details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar alt={user.name || user.email} className="w-20 h-20">
                        <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-medium text-xl">
                          {userInitials}
                        </div>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name || "No name set"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Your name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={user.email} disabled className="mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
                    </div>

                    <div className="flex items-center justify-end gap-4">
                      {profileMessage && (
                        <span className={`text-sm ${profileMessage.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>
                          {profileMessage}
                        </span>
                      )}
                      <Button onClick={handleSaveProfile} disabled={profileSaving}>
                        {profileSaving ? "Saving..." : "Save Changes"}
                      </Button>
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
                    <CardDescription>Your current workspace information.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="workspaceName">Workspace Name</Label>
                      <Input id="workspaceName" value={user.workspace?.name || "No workspace"} disabled className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="workspaceSlug">Workspace Slug</Label>
                      <Input id="workspaceSlug" value={user.workspace?.slug || ""} disabled className="mt-1" />
                    </div>
                    <p className="text-xs text-muted-foreground">Workspace settings are managed by your admin.</p>
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
                    <CardDescription>Choose between dark and light mode.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <button
                        onClick={() => setTheme("dark")}
                        className={`p-4 rounded-lg border-2 transition-colors text-left ${
                          theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
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
                        className={`p-4 rounded-lg border-2 transition-colors text-left ${
                          theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
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
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Manage your email notification preferences.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">Weekly Reports</div>
                        <div className="text-sm text-muted-foreground">Receive weekly summaries of your workflow activity</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={weeklyReports}
                          onChange={(e) => setWeeklyReports(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {weeklyReports
                        ? "You will receive a weekly email every Monday with your workflow stats."
                        : "Weekly reports are disabled."}
                    </p>
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
