import { Execution } from "@/types";

export const executions: Execution[] = [
  {
    id: "exec-001",
    workflowId: "wf-001",
    workflowName: "Lead Qualification Pipeline",
    status: "success",
    startedAt: "2024-01-20T14:30:00Z",
    completedAt: "2024-01-20T14:30:45Z",
    duration: 45,
    logs: [
      { timestamp: "14:30:00", nodeId: "trigger-1", nodeName: "Trigger", message: "Received new lead from web form", level: "info" },
      { timestamp: "14:30:02", nodeId: "ai-1", nodeName: "AI Classifier", message: "Lead scored: 85/100 (Hot)", level: "success" },
      { timestamp: "14:30:05", nodeId: "cond-1", nodeName: "Condition", message: "Score > 70, routing to sales", level: "info" },
      { timestamp: "14:30:10", nodeId: "crm-1", nodeName: "CRM Save", message: "Lead saved to Salesforce", level: "success" },
      { timestamp: "14:30:15", nodeId: "slack-1", nodeName: "Slack Notify", message: "Notification sent to #leads channel", level: "success" },
      { timestamp: "14:30:45", nodeId: "system", nodeName: "Complete", message: "Workflow completed successfully", level: "success" },
    ],
  },
  {
    id: "exec-002",
    workflowId: "wf-002",
    workflowName: "Customer Onboarding Flow",
    status: "success",
    startedAt: "2024-01-20T10:15:00Z",
    completedAt: "2024-01-20T10:15:32Z",
    duration: 32,
    logs: [
      { timestamp: "10:15:00", nodeId: "trigger-1", nodeName: "Trigger", message: "New customer signup detected", level: "info" },
      { timestamp: "10:15:03", nodeId: "email-1", nodeName: "Email Welcome", message: "Welcome email sent", level: "success" },
      { timestamp: "10:15:10", nodeId: "tasks-1", nodeName: "Create Tasks", message: "Onboarding tasks created in Asana", level: "success" },
      { timestamp: "10:15:32", nodeId: "system", nodeName: "Complete", message: "Workflow completed successfully", level: "success" },
    ],
  },
  {
    id: "exec-003",
    workflowId: "wf-004",
    workflowName: "Invoice Generation",
    status: "failed",
    startedAt: "2024-01-20T09:00:00Z",
    completedAt: "2024-01-20T09:00:15Z",
    duration: 15,
    logs: [
      { timestamp: "09:00:00", nodeId: "trigger-1", nodeName: "Trigger", message: "Invoice request received", level: "info" },
      { timestamp: "09:00:05", nodeId: "data-1", nodeName: "Fetch Data", message: "Customer data retrieved", level: "success" },
      { timestamp: "09:00:15", nodeId: "inv-1", nodeName: "Generate PDF", message: "Failed to generate PDF: template not found", level: "error" },
    ],
  },
];
