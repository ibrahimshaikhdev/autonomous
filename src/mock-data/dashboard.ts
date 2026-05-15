import { User, DashboardStats, Activity } from "@/types";

export const currentUser: User = {
  id: "user-001",
  name: "Alex Morgan",
  email: "alex.morgan@autonomousops.ai",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  role: "Admin",
};

export const dashboardStats: DashboardStats = {
  totalWorkflows: 24,
  activeWorkflows: 18,
  executionsToday: 156,
  successRate: 94.5,
};

export const activities: Activity[] = [
  { id: "act-001", type: "execution", action: "completed", description: "Lead Qualification Pipeline executed successfully", timestamp: "2024-01-20T14:30:45Z", status: "success" },
  { id: "act-002", type: "workflow", action: "created", description: "New workflow Social Media Scheduler created", timestamp: "2024-01-20T15:00:00Z" },
  { id: "act-003", type: "execution", action: "failed", description: "Invoice Generation failed", timestamp: "2024-01-20T09:00:15Z", status: "failed" },
  { id: "act-004", type: "execution", action: "completed", description: "Customer Onboarding Flow executed successfully", timestamp: "2024-01-20T10:15:32Z", status: "success" },
  { id: "act-005", type: "user", action: "updated", description: "Workspace settings updated by Alex Morgan", timestamp: "2024-01-19T16:30:00Z" },
  { id: "act-006", type: "execution", action: "completed", description: "Data Sync Pipeline completed", timestamp: "2024-01-20T13:45:22Z", status: "success" },
];