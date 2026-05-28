export interface NodeExecutionResult {
  output: any;
  logs: Array<{
    nodeId: string;
    nodeName: string;
    message: string;
    level: "info" | "error" | "warning" | "success";
  }>;
  status: "success" | "failed";
}

export interface NodeContext {
  nodeId: string;
  nodeName: string;
  nodeData: Record<string, any>;
  input: any;
}

// Base handler interface
interface NodeHandler {
  execute(ctx: NodeContext): Promise<NodeExecutionResult>;
}

// Manual Trigger — entry point, just passes through
class ManualTriggerHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    return {
      output: {
        triggered: true,
        timestamp: new Date().toISOString(),
        ...ctx.nodeData,
      },
      logs: [
        {
          nodeId: ctx.nodeId,
          nodeName: ctx.nodeName,
          message: "Workflow triggered manually",
          level: "info",
        },
      ],
      status: "success",
    };
  }
}

// Webhook Trigger — passes through incoming webhook payload
class WebhookTriggerHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    const hasPayload = ctx.input && Object.keys(ctx.input).length > 0;

    if (!hasPayload) {
      return {
        output: {
          triggered: true,
          source: "webhook",
          timestamp: new Date().toISOString(),
        },
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: "Webhook triggered (no payload — manual run)",
            level: "warning",
          },
        ],
        status: "success",
      };
    }

    return {
      output: ctx.input,
      logs: [
        {
          nodeId: ctx.nodeId,
          nodeName: ctx.nodeName,
          message: `Webhook received — source: ${ctx.input.source || "unknown"}`,
          level: "success",
        },
      ],
      status: "success",
    };
  }
}

// Discord Webhook — sends a message to a Discord channel via webhook URL
class DiscordWebhookHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    const webhookUrl = ctx.nodeData.webhookUrl;
    if (!webhookUrl) {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: "No Discord webhook URL configured",
            level: "error",
          },
        ],
        status: "failed",
      };
    }

    let content = ctx.nodeData.content || "";
    if (!content) {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: "No message content configured",
            level: "error",
          },
        ],
        status: "failed",
      };
    }

    // Basic template substitution: {{key}} → value from input
    if (ctx.input && typeof ctx.input === "object") {
      content = content.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => {
        const val = ctx.input[key];
        return val !== undefined ? String(val) : `{{${key}}}`;
      });
    }

    const payload: Record<string, any> = { content };
    if (ctx.nodeData.username) {
      payload.username = ctx.nodeData.username;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return {
          output: { status: response.status, discord: "message sent" },
          logs: [
            {
              nodeId: ctx.nodeId,
              nodeName: ctx.nodeName,
              message: `Discord message sent successfully`,
              level: "success",
            },
          ],
          status: "success",
        };
      }

      const errorText = await response.text();
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: `Discord API error: ${response.status} ${errorText}`,
            level: "error",
          },
        ],
        status: "failed",
      };
    } catch (error: any) {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: `Discord request failed: ${error.message}`,
            level: "error",
          },
        ],
        status: "failed",
      };
    }
  }
}

// Delay — waits configured duration then passes input through
class DelayHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    // Support both new config (duration + timeUnit) and legacy (seconds)
    let seconds: number;
    if (ctx.nodeData.duration !== undefined) {
      const duration = Number(ctx.nodeData.duration) || 5;
      const timeUnit = ctx.nodeData.timeUnit || "seconds";
      seconds = timeUnit === "minutes" ? duration * 60 : duration;
    } else {
      seconds = Number(ctx.nodeData.seconds) || 5;
    }

    // Cap at 300 seconds (5 min) for safety
    const cappedSeconds = Math.min(seconds, 300);

    await new Promise((resolve) => setTimeout(resolve, cappedSeconds * 1000));

    const display =
      cappedSeconds >= 60
        ? `${(cappedSeconds / 60).toFixed(1)} minutes`
        : `${cappedSeconds} seconds`;

    return {
      output: ctx.input,
      logs: [
        {
          nodeId: ctx.nodeId,
          nodeName: ctx.nodeName,
          message: `Delayed ${display}`,
          level: "info",
        },
      ],
      status: "success",
    };
  }
}

// HTTP Request — makes a real HTTP call
class HttpHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    const url = ctx.nodeData.url;
    if (!url) {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: "No URL configured for HTTP node",
            level: "error",
          },
        ],
        status: "failed",
      };
    }

    const method = (ctx.nodeData.method || "GET").toUpperCase();
    const headers = ctx.nodeData.headers
      ? typeof ctx.nodeData.headers === "string"
        ? JSON.parse(ctx.nodeData.headers)
        : ctx.nodeData.headers
      : {};

    try {
      const fetchOptions: RequestInit = { method, headers };

      if (method !== "GET" && method !== "HEAD" && ctx.nodeData.body) {
        fetchOptions.body =
          typeof ctx.nodeData.body === "string"
            ? ctx.nodeData.body
            : JSON.stringify(ctx.nodeData.body);
        if (!headers["Content-Type"] && !headers["content-type"]) {
          (fetchOptions.headers as Record<string, string>)["Content-Type"] =
            "application/json";
        }
      }

      const response = await fetch(url, fetchOptions);
      const text = await response.text();
      let body: any;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      return {
        output: {
          status: response.status,
          statusText: response.statusText,
          body,
        },
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: `${method} ${url} → ${response.status} ${response.statusText}`,
            level: response.ok ? "success" : "error",
          },
        ],
        status: response.ok ? "success" : "failed",
      };
    } catch (error: any) {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: `HTTP request failed: ${error.message}`,
            level: "error",
          },
        ],
        status: "failed",
      };
    }
  }
}

// Log — logs input data and passes through
class LogHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    const message =
      ctx.nodeData.message ||
      (typeof ctx.input === "string"
        ? ctx.input
        : JSON.stringify(ctx.input, null, 2));

    return {
      output: ctx.input,
      logs: [
        {
          nodeId: ctx.nodeId,
          nodeName: ctx.nodeName,
          message: `Log: ${message}`,
          level: "info",
        },
      ],
      status: "success",
    };
  }
}

// Lead Intake — validates and structures incoming lead data
class LeadIntakeHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    const requiredFields = (ctx.nodeData.requiredFields || "name,email")
      .split(",")
      .map((f: string) => f.trim().toLowerCase());

    const defaultSource = ctx.nodeData.defaultSource || "website";
    const input = ctx.input || {};

    // Validate required fields
    const missing = requiredFields.filter((f: string) => !input[f]);
    if (missing.length > 0) {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: `Missing required lead fields: ${missing.join(", ")}`,
            level: "error",
          },
        ],
        status: "failed",
      };
    }

    const lead = {
      name: input.name || "",
      email: input.email || "",
      company: input.company || "",
      source: input.source || defaultSource,
      message: input.message || "",
      budget: Number(input.budget) || 0,
      receivedAt: new Date().toISOString(),
    };

    return {
      output: lead,
      logs: [
        {
          nodeId: ctx.nodeId,
          nodeName: ctx.nodeName,
          message: `Lead received: ${lead.name} (${lead.email}) from ${lead.source}`,
          level: "success",
        },
      ],
      status: "success",
    };
  }
}

// Lead Scoring — computes score from budget, source, and keywords
class LeadScoringHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    const lead = ctx.input;
    if (!lead || !lead.name) {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: "No lead data to score",
            level: "error",
          },
        ],
        status: "failed",
      };
    }

    // Budget scoring
    const budget = Number(lead.budget) || 0;
    const budgetHigh = Number(ctx.nodeData.budgetHigh) || 10000;
    const budgetMed = Number(ctx.nodeData.budgetMed) || 5000;
    const budgetHighScore = Number(ctx.nodeData.budgetHighScore) || 30;
    const budgetMedScore = Number(ctx.nodeData.budgetMedScore) || 20;
    const budgetLowScore = Number(ctx.nodeData.budgetLowScore) || 10;

    let score = 0;
    if (budget >= budgetHigh) score += budgetHighScore;
    else if (budget >= budgetMed) score += budgetMedScore;
    else score += budgetLowScore;

    // Source weighting
    const sourceWeightsRaw = ctx.nodeData.sourceWeights || "referral:25\nwebsite:15\nsocial:10\ncold:5";
    const sourceWeights: Record<string, number> = {};
    for (const line of sourceWeightsRaw.split("\n")) {
      const [src, pts] = line.split(":").map((s: string) => s.trim());
      if (src && pts) sourceWeights[src.toLowerCase()] = Number(pts) || 0;
    }
    const sourceKey = (lead.source || "").toLowerCase();
    const sourceScore = sourceWeights[sourceKey] ?? 5; // default 5 for unknown sources
    score += sourceScore;

    // Keyword detection
    const keywords = (ctx.nodeData.keywords || "urgent,enterprise,ASAP")
      .split(",")
      .map((k: string) => k.trim().toLowerCase())
      .filter(Boolean);
    const keywordBonus = Number(ctx.nodeData.keywordBonus) || 10;
    const message = (lead.message || "").toLowerCase();
    const matchedKeywords = keywords.filter((k: string) => message.includes(k));
    score += matchedKeywords.length * keywordBonus;

    // Priority classification
    const hotThreshold = Number(ctx.nodeData.hotThreshold) || 70;
    const warmThreshold = Number(ctx.nodeData.warmThreshold) || 40;
    let priority: "hot" | "warm" | "cold";
    if (score >= hotThreshold) priority = "hot";
    else if (score >= warmThreshold) priority = "warm";
    else priority = "cold";

    return {
      output: { ...lead, score, priority, matchedKeywords },
      logs: [
        {
          nodeId: ctx.nodeId,
          nodeName: ctx.nodeName,
          message: `Lead scored ${score} → ${priority.toUpperCase()} (budget: ${budget >= budgetHigh ? "high" : budget >= budgetMed ? "med" : "low"}, source: +${sourceScore}, keywords: +${matchedKeywords.length * keywordBonus})`,
          level: priority === "hot" ? "success" : priority === "warm" ? "info" : "warning",
        },
      ],
      status: "success",
    };
  }
}

// Lead Router — routes based on priority (hot/warm/cold)
class LeadRouterHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    const input = ctx.input;
    const priority = input?.priority;

    if (!priority || !["hot", "warm", "cold"].includes(priority)) {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: `Invalid priority "${priority}" — expected hot, warm, or cold`,
            level: "error",
          },
        ],
        status: "failed",
      };
    }

    return {
      output: { ...input, route: priority },
      logs: [
        {
          nodeId: ctx.nodeId,
          nodeName: ctx.nodeName,
          message: `Lead routed → ${priority.toUpperCase()} path`,
          level: priority === "hot" ? "success" : "info",
        },
      ],
      status: "success",
    };
  }
}

// Google Sheets CRM — appends lead row via Apps Script webhook
class GoogleSheetsHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    const webhookUrl = ctx.nodeData.webhookUrl;
    if (!webhookUrl) {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: "No Google Apps Script webhook URL configured",
            level: "error",
          },
        ],
        status: "failed",
      };
    }

    const lead = ctx.input || {};
    const sheetName = ctx.nodeData.sheetName || "Leads";

    const row = {
      timestamp: new Date().toISOString(),
      name: lead.name || "",
      email: lead.email || "",
      company: lead.company || "",
      score: lead.score ?? "",
      priority: lead.priority || "",
      source: lead.source || "",
      budget: lead.budget ?? "",
      status: "new",
      sheetName,
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });

      if (response.ok) {
        return {
          output: { ...lead, sheetStatus: "added" },
          logs: [
            {
              nodeId: ctx.nodeId,
              nodeName: ctx.nodeName,
              message: `Lead added to Google Sheets: ${row.name} (${row.priority})`,
              level: "success",
            },
          ],
          status: "success",
        };
      }

      const errorText = await response.text();
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: `Google Sheets error: ${response.status} ${errorText}`,
            level: "error",
          },
        ],
        status: "failed",
      };
    } catch (error: any) {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: `Google Sheets request failed: ${error.message}`,
            level: "error",
          },
        ],
        status: "failed",
      };
    }
  }
}

// Notification — sends Discord alert for leads
class NotificationHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    const webhookUrl = ctx.nodeData.webhookUrl;
    if (!webhookUrl) {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: "No Discord webhook URL configured",
            level: "error",
          },
        ],
        status: "failed",
      };
    }

    const lead = ctx.input || {};
    const triggerOn = ctx.nodeData.triggerOn || "always";

    // Skip if hot-only and lead is not hot
    if (triggerOn === "hot-only" && lead.priority !== "hot") {
      return {
        output: lead,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: `Skipped notification — lead is ${lead.priority || "unknown"} (triggerOn: hot-only)`,
            level: "info",
          },
        ],
        status: "success",
      };
    }

    // Template substitution
    let content = ctx.nodeData.message || "Lead alert: {{name}} ({{priority}})";
    if (lead && typeof lead === "object") {
      content = content.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => {
        const val = lead[key];
        return val !== undefined ? String(val) : `{{${key}}}`;
      });
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        return {
          output: { ...lead, notified: true },
          logs: [
            {
              nodeId: ctx.nodeId,
              nodeName: ctx.nodeName,
              message: `Notification sent: ${lead.priority?.toUpperCase() || "unknown"} lead alert`,
              level: "success",
            },
          ],
          status: "success",
        };
      }

      const errorText = await response.text();
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: `Discord error: ${response.status} ${errorText}`,
            level: "error",
          },
        ],
        status: "failed",
      };
    } catch (error: any) {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: `Notification request failed: ${error.message}`,
            level: "error",
          },
        ],
        status: "failed",
      };
    }
  }
}

// Condition — evaluates a comparison and routes to true/false path
class ConditionHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    const leftOperand = ctx.nodeData.leftOperand;
    const operator = ctx.nodeData.operator || "equals";
    const rightOperand = ctx.nodeData.rightOperand;

    if (leftOperand === undefined || leftOperand === null || leftOperand === "") {
      return {
        output: null,
        logs: [
          {
            nodeId: ctx.nodeId,
            nodeName: ctx.nodeName,
            message: "No left operand configured",
            level: "error",
          },
        ],
        status: "failed",
      };
    }

    // Resolve operands — if they match a key in the input, use the input value
    const resolve = (val: any): any => {
      if (typeof val !== "string") return val;
      // Template syntax: {{key}} or just a key name
      const keyMatch = val.match(/^\{\{(\w+)\}\}$/) || val.match(/^(\w+)$/);
      if (keyMatch && ctx.input && typeof ctx.input === "object" && ctx.input[keyMatch[1]] !== undefined) {
        return ctx.input[keyMatch[1]];
      }
      return val;
    };

    const left = resolve(leftOperand);
    const right = resolve(rightOperand);

    let result = false;

    switch (operator) {
      case "equals":
        result = String(left) === String(right);
        break;
      case "not_equals":
        result = String(left) !== String(right);
        break;
      case "greater_than":
        result = Number(left) > Number(right);
        break;
      case "less_than":
        result = Number(left) < Number(right);
        break;
      case "greater_equal":
        result = Number(left) >= Number(right);
        break;
      case "less_equal":
        result = Number(left) <= Number(right);
        break;
      case "contains":
        result = String(left).toLowerCase().includes(String(right).toLowerCase());
        break;
      case "starts_with":
        result = String(left).toLowerCase().startsWith(String(right).toLowerCase());
        break;
      case "is_empty":
        result = !left || left === "" || left === null || left === undefined;
        break;
      case "is_not_empty":
        result = !!left && left !== "" && left !== null && left !== undefined;
        break;
      default:
        result = String(left) === String(right);
    }

    const route = result ? "true" : "false";

    return {
      output: { ...ctx.input, route, conditionResult: result },
      logs: [
        {
          nodeId: ctx.nodeId,
          nodeName: ctx.nodeName,
          message: `Condition: ${JSON.stringify(left)} ${operator} ${JSON.stringify(right)} → ${result ? "TRUE" : "FALSE"}`,
          level: result ? "success" : "info",
        },
      ],
      status: "success",
    };
  }
}

// Transform — passes input through with optional field mapping
class TransformHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    return {
      output: ctx.input,
      logs: [
        {
          nodeId: ctx.nodeId,
          nodeName: ctx.nodeName,
          message: "Data transformed and passed through",
          level: "success",
        },
      ],
      status: "success",
    };
  }
}

// Schedule Trigger — acts like manual trigger for now
class ScheduleTriggerHandler implements NodeHandler {
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    return {
      output: {
        triggered: true,
        source: "schedule",
        timestamp: new Date().toISOString(),
        ...ctx.nodeData,
      },
      logs: [
        {
          nodeId: ctx.nodeId,
          nodeName: ctx.nodeName,
          message: "Schedule trigger fired",
          level: "success",
        },
      ],
      status: "success",
    };
  }
}

// Generic pass-through handler for nodes without specific logic
class PassThroughHandler implements NodeHandler {
  private typeName: string;
  constructor(typeName: string) {
    this.typeName = typeName;
  }
  async execute(ctx: NodeContext): Promise<NodeExecutionResult> {
    return {
      output: ctx.input,
      logs: [
        {
          nodeId: ctx.nodeId,
          nodeName: ctx.nodeName,
          message: `${this.typeName} executed (pass-through)`,
          level: "success",
        },
      ],
      status: "success",
    };
  }
}

// Handler registry
const handlers: Record<string, NodeHandler> = {
  "manual-trigger": new ManualTriggerHandler(),
  "api-trigger": new ManualTriggerHandler(), // alias
  webhook: new WebhookTriggerHandler(),
  schedule: new ScheduleTriggerHandler(),
  "email-trigger": new PassThroughHandler("Email Trigger"),
  form: new PassThroughHandler("Form Trigger"),
  delay: new DelayHandler(),
  http: new HttpHandler(),
  log: new LogHandler(),
  discord: new DiscordWebhookHandler(),
  "lead-intake": new LeadIntakeHandler(),
  "lead-scoring": new LeadScoringHandler(),
  "lead-router": new LeadRouterHandler(),
  "google-sheets": new GoogleSheetsHandler(),
  notification: new NotificationHandler(),
  condition: new ConditionHandler(),
  transform: new TransformHandler(),
  "send-email": new PassThroughHandler("Send Email"),
  slack: new PassThroughHandler("Slack Message"),
  crm: new PassThroughHandler("CRM"),
  task: new PassThroughHandler("Task"),
  classify: new PassThroughHandler("Classify"),
  generate: new PassThroughHandler("Generate"),
  analyze: new PassThroughHandler("Analyze"),
  chat: new PassThroughHandler("Chat"),
};

export function getNodeHandler(nodeType: string): NodeHandler | null {
  return handlers[nodeType] || null;
}

export function getSupportedNodeTypes(): string[] {
  return Object.keys(handlers);
}
