export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "draft";
  createdAt: string;
  updatedAt: string;
  executions: number;
  lastRun?: string;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "success" | "failed" | "running" | "pending";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: string;
  node: string;
  message: string;
  level: "info" | "error" | "warning" | "success";
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface DashboardStats {
  totalWorkflows: number;
  activeWorkflows: number;
  executionsToday: number;
  successRate: number;
}

export interface Activity {
  id: string;
  type: "execution" | "workflow" | "user";
  action: string;
  description: string;
  timestamp: string;
  status?: "success" | "failed";
}