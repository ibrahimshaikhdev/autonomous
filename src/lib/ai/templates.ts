// Workflow Template Library — predefined workflows for common use cases
// Templates are matched by prompt keywords and returned as pre-built graphs.

import { getDefaultConfig } from "@/lib/node-registry";
import type { WorkflowNode, WorkflowEdge } from "@/types";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

function makeNode(nodeType: string, label: string, x: number, y: number, config: Record<string, any> = {}): WorkflowNode {
  const defaultConfig = getDefaultConfig(nodeType);
  return {
    id: `${nodeType}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "workflowNode",
    position: { x, y },
    data: { label, nodeType, ...defaultConfig, ...config },
  };
}

function makeEdge(source: WorkflowNode, target: WorkflowNode, sourceHandle?: string): WorkflowEdge {
  return {
    id: `e-${source.id}-${target.id}${sourceHandle ? `-${sourceHandle}` : ""}`,
    source: source.id,
    target: target.id,
    sourceHandle: sourceHandle || null,
  };
}

// ── Template Definitions ──

const leadCaptureFlow: WorkflowTemplate = {
  id: "lead-capture",
  name: "Lead Capture & Qualification",
  description: "Capture leads from forms, score them, route hot leads for immediate follow-up, and save all to CRM.",
  keywords: ["lead capture", "lead qualification", "form lead", "capture and qualify"],
  nodes: [],
  edges: [],
};
// Build nodes/edges lazily to avoid ID collision
function buildLeadCaptureFlow(): WorkflowTemplate {
  const intake = makeNode("lead-intake", "Lead Intake", 50, 200);
  const scoring = makeNode("lead-scoring", "Lead Scoring", 350, 200);
  const router = makeNode("lead-router", "Lead Router", 650, 200);
  const discord = makeNode("discord", "Discord Alert (Hot)", 950, 50, {
    content: "🔥 Hot lead: {{name}} from {{company}} — Score: {{score}}",
  });
  const sheets = makeNode("google-sheets", "Save to CRM", 950, 200, {
    sheetName: "Leads",
  });
  const sheetsCold = makeNode("google-sheets", "Archive (Cold)", 950, 350, {
    sheetName: "Cold Leads",
  });

  return {
    ...leadCaptureFlow,
    nodes: [intake, scoring, router, discord, sheets, sheetsCold],
    edges: [
      makeEdge(intake, scoring),
      makeEdge(scoring, router),
      makeEdge(router, discord, "hot"),
      makeEdge(router, sheets, "warm"),
      makeEdge(router, sheetsCold, "cold"),
    ],
  };
}

const webhookRelay: WorkflowTemplate = {
  id: "webhook-relay",
  name: "Webhook to Discord Relay",
  description: "Receive data via webhook and forward it to a Discord channel.",
  keywords: ["webhook relay", "forward to discord", "webhook to discord", "relay webhook"],
  nodes: [],
  edges: [],
};

function buildWebhookRelay(): WorkflowTemplate {
  const webhook = makeNode("webhook", "Webhook Trigger", 50, 200);
  const transform = makeNode("transform", "Format Data", 350, 200);
  const discord = makeNode("discord", "Send to Discord", 650, 200, {
    content: "📡 New webhook data received:\n{{body}}",
  });

  return {
    ...webhookRelay,
    nodes: [webhook, transform, discord],
    edges: [
      makeEdge(webhook, transform),
      makeEdge(transform, discord),
    ],
  };
}

const crmSync: WorkflowTemplate = {
  id: "crm-sync",
  name: "CRM Sync with Notifications",
  description: "Capture leads, save to Google Sheets, and send team notifications.",
  keywords: ["crm sync", "save and notify", "sheets and notify", "lead save notification"],
  nodes: [],
  edges: [],
};

function buildCrmSync(): WorkflowTemplate {
  const intake = makeNode("lead-intake", "Lead Intake", 50, 200);
  const sheets = makeNode("google-sheets", "Save to Sheets", 350, 200, {
    sheetName: "CRM Leads",
  });
  const notify = makeNode("notification", "Team Notification", 650, 200, {
    message: "New lead saved: {{name}} ({{email}})",
    triggerOn: "always",
  });

  return {
    ...crmSync,
    nodes: [intake, sheets, notify],
    edges: [
      makeEdge(intake, sheets),
      makeEdge(sheets, notify),
    ],
  };
}

const delayedFollowUp: WorkflowTemplate = {
  id: "delayed-followup",
  name: "Delayed Follow-Up",
  description: "Capture a lead, wait, then send a follow-up notification.",
  keywords: ["delayed follow up", "wait and notify", "delay notification", "follow up"],
  nodes: [],
  edges: [],
};

function buildDelayedFollowUp(): WorkflowTemplate {
  const intake = makeNode("lead-intake", "Lead Intake", 50, 200);
  const delay = makeNode("delay", "Wait 5 Minutes", 350, 200, {
    duration: 5,
    timeUnit: "minutes",
  });
  const notify = makeNode("discord", "Follow-Up Alert", 650, 200, {
    content: "⏰ Follow up with lead: {{name}} ({{email}})",
  });

  return {
    ...delayedFollowUp,
    nodes: [intake, delay, notify],
    edges: [
      makeEdge(intake, delay),
      makeEdge(delay, notify),
    ],
  };
}

// ── All Templates ──

const templateBuilders: (() => WorkflowTemplate)[] = [
  buildLeadCaptureFlow,
  buildWebhookRelay,
  buildCrmSync,
  buildDelayedFollowUp,
];

/**
 * Find the best matching template for a given prompt.
 * Returns null if no template matches well enough.
 * Uses token-based matching with fuzzy tolerance.
 */
export function findMatchingTemplate(prompt: string): WorkflowTemplate | null {
  const normalized = prompt.toLowerCase().trim();
  const promptTokens = normalized.split(/\s+/).filter(Boolean);
  let bestMatch: { template: WorkflowTemplate; score: number } | null = null;

  for (const builder of templateBuilders) {
    const template = builder();
    let score = 0;
    for (const keyword of template.keywords) {
      const k = keyword.toLowerCase();
      // Exact substring match
      if (normalized.includes(k)) {
        score += k.length;
      } else {
        // Token-level match: check if keyword tokens appear in prompt
        const keywordTokens = k.split(/\s+/).filter(Boolean);
        let matched = 0;
        for (const kt of keywordTokens) {
          if (promptTokens.some(pt => pt.includes(kt) || kt.includes(pt))) {
            matched++;
          }
        }
        if (matched === keywordTokens.length && keywordTokens.length > 0) {
          score += k.length * 0.7; // Partial credit for token match
        } else if (matched > 0) {
          score += (matched / keywordTokens.length) * k.length * 0.4;
        }
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { template, score };
    }
  }

  // Lower threshold to be more forgiving
  return bestMatch && bestMatch.score >= 4 ? bestMatch.template : null;
}

/**
 * Get all available templates (for browsing).
 */
export function getAllTemplates(): WorkflowTemplate[] {
  return templateBuilders.map(b => b());
}
