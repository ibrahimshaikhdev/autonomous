// Node Configuration Registry
// Single source of truth for all node type metadata, config fields, and defaults.

export interface NodeConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select";
  placeholder?: string;
  defaultValue?: any;
  options?: string[];       // for select type
  required?: boolean;
  min?: number;             // for number type
  max?: number;             // for number type
  helpText?: string;
  readonly?: boolean;       // display as read-only with copy button
  // For conditional visibility: only show this field when another field has a specific value
  showWhen?: { field: string; value: any };
}

export interface OutputHandle {
  id: string;
  label: string;
  color: string;            // CSS color for the handle
}

export interface NodeTypeDef {
  label: string;
  icon: string;
  color: string;            // Tailwind classes: "bg-X/20 border-X"
  category: "trigger" | "action" | "ai" | "logic";
  configFields: NodeConfigField[];
  outputHandles?: OutputHandle[];  // Multiple output handles for routing nodes
}

export const nodeRegistry: Record<string, NodeTypeDef> = {
  // ── Triggers ──
  webhook: {
    label: "Webhook Trigger",
    icon: "🔗",
    color: "bg-yellow-500/20 border-yellow-500",
    category: "trigger",
    configFields: [
      {
        key: "webhookUrl",
        label: "Webhook URL",
        type: "text",
        placeholder: "Save workflow to generate URL",
        readonly: true,
        helpText: "POST to this URL to trigger the workflow externally",
      },
    ],
  },
  schedule: {
    label: "Schedule",
    icon: "⏰",
    color: "bg-yellow-500/20 border-yellow-500",
    category: "trigger",
    configFields: [],
  },
  "email-trigger": {
    label: "Email",
    icon: "📧",
    color: "bg-yellow-500/20 border-yellow-500",
    category: "trigger",
    configFields: [],
  },
  form: {
    label: "Form",
    icon: "📝",
    color: "bg-yellow-500/20 border-yellow-500",
    category: "trigger",
    configFields: [],
  },
  "api-trigger": {
    label: "API",
    icon: "🌐",
    color: "bg-yellow-500/20 border-yellow-500",
    category: "trigger",
    configFields: [],
  },
  "lead-intake": {
    label: "Lead Intake",
    icon: "📥",
    color: "bg-amber-500/20 border-amber-500",
    category: "trigger",
    configFields: [
      {
        key: "requiredFields",
        label: "Required Fields",
        type: "text",
        placeholder: "name,email",
        defaultValue: "name,email",
        helpText: "Comma-separated fields that must be present in the lead data",
      },
      {
        key: "defaultSource",
        label: "Default Source",
        type: "text",
        placeholder: "website",
        defaultValue: "website",
        helpText: "Default lead source if not provided in payload",
      },
    ],
  },

  // ── Actions ──
  "send-email": {
    label: "Send Email",
    icon: "📧",
    color: "bg-blue-500/20 border-blue-500",
    category: "action",
    configFields: [],
  },
  slack: {
    label: "Slack Message",
    icon: "💬",
    color: "bg-blue-500/20 border-blue-500",
    category: "action",
    configFields: [],
  },
  crm: {
    label: "Save to CRM",
    icon: "💾",
    color: "bg-blue-500/20 border-blue-500",
    category: "action",
    configFields: [],
  },
  task: {
    label: "Create Task",
    icon: "✅",
    color: "bg-blue-500/20 border-blue-500",
    category: "action",
    configFields: [],
  },
  discord: {
    label: "Discord Message",
    icon: "🎮",
    color: "bg-indigo-500/20 border-indigo-500",
    category: "action",
    configFields: [
      {
        key: "webhookUrl",
        label: "Discord Webhook URL",
        type: "text",
        placeholder: "https://discord.com/api/webhooks/...",
        required: true,
        helpText: "Get this from Discord → Channel Settings → Integrations → Webhooks",
      },
      {
        key: "content",
        label: "Message",
        type: "textarea",
        placeholder: "Hello from AutonomousOps!",
        required: true,
        helpText: "Use {{key}} to insert values from previous nodes",
      },
      {
        key: "username",
        label: "Bot Username",
        type: "text",
        placeholder: "AutonomousOps Bot",
        helpText: "Override the webhook's default display name (optional)",
      },
    ],
  },
  "google-sheets": {
    label: "Google Sheets CRM",
    icon: "📗",
    color: "bg-emerald-500/20 border-emerald-500",
    category: "action",
    configFields: [
      {
        key: "webhookUrl",
        label: "Apps Script Webhook URL",
        type: "text",
        placeholder: "https://script.google.com/macros/s/.../exec",
        required: true,
        helpText: "Deploy a Google Apps Script as a web app and paste its URL here. The script should accept POST requests and append rows to your sheet.",
      },
      {
        key: "sheetName",
        label: "Sheet Name",
        type: "text",
        placeholder: "Leads",
        defaultValue: "Leads",
        helpText: "Name of the sheet tab to append rows to",
      },
    ],
  },
  notification: {
    label: "Notification",
    icon: "🔔",
    color: "bg-sky-500/20 border-sky-500",
    category: "action",
    configFields: [
      {
        key: "webhookUrl",
        label: "Discord Webhook URL",
        type: "text",
        placeholder: "https://discord.com/api/webhooks/...",
        required: true,
      },
      {
        key: "message",
        label: "Alert Message",
        type: "textarea",
        placeholder: "🔥 Hot lead: {{name}} from {{company}} (score: {{score}})",
        required: true,
        helpText: "Use {{key}} to insert lead fields (name, company, score, priority, source)",
      },
      {
        key: "triggerOn",
        label: "Trigger On",
        type: "select",
        options: ["always", "hot-only"],
        defaultValue: "always",
        helpText: "Send alert for all leads or hot leads only",
      },
    ],
  },
  http: {
    label: "HTTP Request",
    icon: "🌐",
    color: "bg-blue-500/20 border-blue-500",
    category: "action",
    configFields: [
      {
        key: "url",
        label: "URL",
        type: "text",
        placeholder: "https://api.example.com/data",
        required: true,
      },
      {
        key: "method",
        label: "HTTP Method",
        type: "select",
        options: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        defaultValue: "GET",
      },
      {
        key: "headers",
        label: "Headers (JSON)",
        type: "textarea",
        placeholder: '{"Content-Type": "application/json"}',
        helpText: "Enter headers as a JSON object",
        showWhen: { field: "method", value: ["POST", "PUT", "PATCH", "DELETE"] },
      },
      {
        key: "body",
        label: "Request Body",
        type: "textarea",
        placeholder: '{"key": "value"}',
        helpText: "Enter request body as JSON",
        showWhen: { field: "method", value: ["POST", "PUT", "PATCH", "DELETE"] },
      },
    ],
  },

  // ── AI Nodes ──
  classify: {
    label: "Classify",
    icon: "🏷️",
    color: "bg-green-500/20 border-green-500",
    category: "ai",
    configFields: [],
  },
  generate: {
    label: "Generate",
    icon: "✨",
    color: "bg-green-500/20 border-green-500",
    category: "ai",
    configFields: [],
  },
  analyze: {
    label: "Analyze",
    icon: "📊",
    color: "bg-green-500/20 border-green-500",
    category: "ai",
    configFields: [],
  },
  chat: {
    label: "Chat",
    icon: "💬",
    color: "bg-green-500/20 border-green-500",
    category: "ai",
    configFields: [],
  },

  // ── Logic ──
  condition: {
    label: "Condition",
    icon: "🔀",
    color: "bg-purple-500/20 border-purple-500",
    category: "logic",
    configFields: [
      {
        key: "leftOperand",
        label: "Left Operand",
        type: "text",
        placeholder: "e.g. score or {{budget}}",
        required: true,
        helpText: "Field name from input or a static value. Use {{key}} for dynamic values.",
      },
      {
        key: "operator",
        label: "Operator",
        type: "select",
        options: [
          "equals",
          "not_equals",
          "greater_than",
          "less_than",
          "greater_equal",
          "less_equal",
          "contains",
          "starts_with",
          "is_empty",
          "is_not_empty",
        ],
        defaultValue: "equals",
        required: true,
      },
      {
        key: "rightOperand",
        label: "Right Operand",
        type: "text",
        placeholder: "e.g. 80 or hot",
        helpText: "Value to compare against. Use {{key}} for dynamic values.",
        showWhen: { field: "operator", value: ["equals", "not_equals", "greater_than", "less_than", "greater_equal", "less_equal", "contains", "starts_with"] },
      },
    ],
    outputHandles: [
      { id: "true", label: "True", color: "#22c55e" },
      { id: "false", label: "False", color: "#ef4444" },
    ],
  },
  transform: {
    label: "Transform",
    icon: "🔄",
    color: "bg-cyan-500/20 border-cyan-500",
    category: "logic",
    configFields: [],
  },
  delay: {
    label: "Delay",
    icon: "⏱️",
    color: "bg-orange-500/20 border-orange-500",
    category: "logic",
    configFields: [
      {
        key: "duration",
        label: "Duration",
        type: "number",
        defaultValue: 5,
        min: 1,
        max: 300,
        required: true,
      },
      {
        key: "timeUnit",
        label: "Time Unit",
        type: "select",
        options: ["seconds", "minutes"],
        defaultValue: "seconds",
      },
    ],
  },
  log: {
    label: "Log",
    icon: "📋",
    color: "bg-orange-500/20 border-orange-500",
    category: "logic",
    configFields: [
      {
        key: "message",
        label: "Log Message",
        type: "text",
        placeholder: "Enter log message...",
        defaultValue: "",
      },
    ],
  },
  "lead-scoring": {
    label: "Lead Scoring",
    icon: "📊",
    color: "bg-violet-500/20 border-violet-500",
    category: "logic",
    configFields: [
      {
        key: "budgetHigh",
        label: "High Budget Threshold",
        type: "number",
        defaultValue: 10000,
        min: 0,
        helpText: "Budget >= this is considered high",
      },
      {
        key: "budgetMed",
        label: "Medium Budget Threshold",
        type: "number",
        defaultValue: 5000,
        min: 0,
        helpText: "Budget >= this is considered medium",
      },
      {
        key: "budgetHighScore",
        label: "High Budget Score",
        type: "number",
        defaultValue: 30,
        min: 0,
      },
      {
        key: "budgetMedScore",
        label: "Medium Budget Score",
        type: "number",
        defaultValue: 20,
        min: 0,
      },
      {
        key: "budgetLowScore",
        label: "Low Budget Score",
        type: "number",
        defaultValue: 10,
        min: 0,
      },
      {
        key: "sourceWeights",
        label: "Source Weights",
        type: "textarea",
        placeholder: "referral:25\nwebsite:15\nsocial:10\ncold:5",
        defaultValue: "referral:25\nwebsite:15\nsocial:10\ncold:5",
        helpText: "One per line — source:points",
      },
      {
        key: "keywords",
        label: "Bonus Keywords",
        type: "text",
        placeholder: "urgent,enterprise,ASAP",
        defaultValue: "urgent,enterprise,ASAP",
        helpText: "Comma-separated keywords to detect in message",
      },
      {
        key: "keywordBonus",
        label: "Keyword Bonus",
        type: "number",
        defaultValue: 10,
        min: 0,
        helpText: "Points added per keyword match",
      },
      {
        key: "hotThreshold",
        label: "Hot Threshold",
        type: "number",
        defaultValue: 70,
        min: 0,
        helpText: "Score >= this → hot lead",
      },
      {
        key: "warmThreshold",
        label: "Warm Threshold",
        type: "number",
        defaultValue: 40,
        min: 0,
        helpText: "Score >= this → warm lead, below → cold",
      },
    ],
  },
  "lead-router": {
    label: "Lead Router",
    icon: "🔀",
    color: "bg-rose-500/20 border-rose-500",
    category: "logic",
    configFields: [],
    outputHandles: [
      { id: "hot", label: "Hot", color: "#ef4444" },
      { id: "warm", label: "Warm", color: "#f59e0b" },
      { id: "cold", label: "Cold", color: "#6b7280" },
    ],
  },
};

// ── Helper functions ──

/** Get node type definition, falls back to a generic definition for unknown types */
export function getNodeType(nodeType: string): NodeTypeDef {
  return (
    nodeRegistry[nodeType] || {
      label: nodeType,
      icon: "⚙️",
      color: "bg-gray-500/20 border-gray-500",
      category: "logic",
      configFields: [],
    }
  );
}

/** Get default config values for a node type (from configField defaultValue) */
export function getDefaultConfig(nodeType: string): Record<string, any> {
  const def = nodeRegistry[nodeType];
  if (!def) return {};
  const config: Record<string, any> = {};
  for (const field of def.configFields) {
    if (field.defaultValue !== undefined) {
      config[field.key] = field.defaultValue;
    }
  }
  return config;
}

/** Get the icon for a node type */
export function getNodeIcon(nodeType: string): string {
  return getNodeType(nodeType).icon;
}

/** Get the color classes for a node type */
export function getNodeColor(nodeType: string): string {
  return getNodeType(nodeType).color;
}

/** Get sidebar categories formatted for the node palette */
export function getNodeCategories() {
  const categories: Record<string, { type: string; label: string; icon: string }[]> = {
    triggers: [],
    actions: [],
    ai: [],
    logic: [],
  };

  const categoryMap: Record<string, string> = {
    trigger: "triggers",
    action: "actions",
    ai: "ai",
    logic: "logic",
  };

  for (const [type, def] of Object.entries(nodeRegistry)) {
    const cat = categoryMap[def.category];
    if (cat) {
      categories[cat].push({ type, label: def.label, icon: def.icon });
    }
  }

  return categories;
}
