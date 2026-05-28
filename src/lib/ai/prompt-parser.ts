// AI Prompt Parser — keyword-based intent extraction from natural language
// No LLM calls. Deterministic pattern matching with fuzzy/typo tolerance.

export interface ParsedIntent {
  nodeType: string;
  label: string;
  params: Record<string, any>;
  confidence: number; // 0-1
}

interface PatternRule {
  keywords: string[];
  nodeType: string;
  label: string;
  category: "trigger" | "action" | "logic" | "ai";
  extractParams?: (prompt: string) => Record<string, any>;
}

// ── Fuzzy matching helpers ──

/** Simple Levenshtein distance for typo tolerance */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

/** Check if a word fuzzy-matches a keyword token (tolerates 1-2 char typos) */
function fuzzyTokenMatch(word: string, keywordToken: string): boolean {
  if (word === keywordToken) return true;
  if (word.length < 3 || keywordToken.length < 3) return false;
  const dist = levenshtein(word, keywordToken);
  const maxLen = Math.max(word.length, keywordToken.length);
  // Allow 1 edit for short words, 2 for longer words
  const threshold = maxLen >= 6 ? 2 : 1;
  return dist <= threshold;
}

// ── Synonym / alias mapping ──
// Maps common synonyms and shorthand to canonical keywords
const synonymMap: Record<string, string[]> = {
  "sheet": ["sheets", "spreadsheet", "excel", "gsheet", "google sheet", "google sheets"],
  "sheets": ["sheet", "spreadsheet", "excel", "gsheet", "google sheet"],
  "google sheets": ["sheet", "sheets", "spreadsheet", "save to sheet", "save to sheets", "gsheet"],
  "save to sheet": ["sheets", "google sheets", "spreadsheet", "save to crm"],
  "notify": ["notification", "alert", "send alert", "send notification", "message", "notify team"],
  "notification": ["notify", "alert", "send alert", "message"],
  "alert": ["notify", "notification", "send notification", "send alert"],
  "discord": ["send discord", "notify discord", "post to discord", "discord alert", "discord message", "discord notification"],
  "score": ["scoring", "qualify", "qualification", "rank", "ranking", "rate"],
  "scoring": ["score", "qualify", "qualification", "rank", "ranking", "rate"],
  "route": ["routing", "direct", "assign", "categorize", "split", "branch", "separate", "divide", "router"],
  "routing": ["route", "direct", "assign", "categorize", "split", "branch", "router"],
  "lead": ["leads", "prospect", "prospects", "contact", "contacts"],
  "webhook": ["hook", "api trigger", "incoming request"],
  "delay": ["wait", "pause", "sleep", "hold", "wait before"],
  "email": ["send email", "email them", "mail"],
  "slack": ["send slack", "notify slack", "post to slack", "slack message"],
  "log": ["debug", "print", "console"],
  "crm": ["save to crm", "save lead", "save data"],
  "condition": ["if", "check if", "verify", "conditional", "when"],
  "transform": ["convert", "map", "reshape", "format data", "format"],
  "classify": ["categorize", "tag", "label"],
  "generate": ["ai generate", "create content", "write", "draft"],
  "analyze": ["analysis", "sentiment", "extract insights"],
};

/**
 * Check if the prompt contains a match for a keyword, using:
 * 1. Exact substring match (original behavior)
 * 2. Bidirectional: keyword contains prompt tokens or prompt contains keyword tokens
 * 3. Fuzzy token matching for typos
 * 4. Synonym expansion
 */
function fuzzyKeywordMatch(prompt: string, keyword: string): number {
  const p = prompt.toLowerCase().trim();
  const k = keyword.toLowerCase().trim();

  // 1. Exact substring (fast path, highest confidence)
  if (p.includes(k)) return 0.5 + k.length / 20;

  // 2. Split into tokens for word-level matching
  const promptTokens = p.split(/\s+/).filter(Boolean);
  const keywordTokens = k.split(/\s+/).filter(Boolean);

  // 3. Check if all keyword tokens appear (fuzzy) in the prompt
  let matchedTokens = 0;
  for (const kt of keywordTokens) {
    for (const pt of promptTokens) {
      if (fuzzyTokenMatch(pt, kt)) {
        matchedTokens++;
        break;
      }
    }
  }

  if (matchedTokens === keywordTokens.length && keywordTokens.length > 0) {
    return 0.4 + (matchedTokens / keywordTokens.length) * 0.3;
  }

  // 4. Check if prompt tokens appear in keyword (bidirectional)
  let reverseMatches = 0;
  for (const pt of promptTokens) {
    if (pt.length < 3) continue;
    for (const kt of keywordTokens) {
      if (fuzzyTokenMatch(pt, kt)) {
        reverseMatches++;
        break;
      }
    }
  }

  if (reverseMatches > 0 && promptTokens.filter(t => t.length >= 3).length > 0) {
    const ratio = reverseMatches / Math.max(promptTokens.filter(t => t.length >= 3).length, 1);
    if (ratio >= 0.5) return 0.3 + ratio * 0.2;
  }

  // 5. Check synonyms — see if any synonym of the keyword matches the prompt
  const synonyms = synonymMap[k] || [];
  for (const syn of synonyms) {
    if (p.includes(syn)) return 0.4;
    // Also check fuzzy on synonym tokens
    const synTokens = syn.split(/\s+/).filter(Boolean);
    let synMatched = 0;
    for (const st of synTokens) {
      for (const pt of promptTokens) {
        if (fuzzyTokenMatch(pt, st)) {
          synMatched++;
          break;
        }
      }
    }
    if (synMatched === synTokens.length && synTokens.length > 0) {
      return 0.35;
    }
  }

  // 6. Check if the prompt token is a key in synonymMap and the keyword is a value
  for (const pt of promptTokens) {
    const aliases = synonymMap[pt] || [];
    if (aliases.some(a => k.includes(a) || a.includes(k))) return 0.35;
    // Also check fuzzy against aliases
    for (const alias of aliases) {
      if (fuzzyTokenMatch(pt, alias) || k.includes(alias) || alias.includes(k)) {
        return 0.3;
      }
    }
  }

  return 0;
}

// Pattern rules — order matters: first match wins per category
const patternRules: PatternRule[] = [
  // ── Triggers ──
  {
    keywords: ["form submit", "form submission", "fills out form", "submits a form", "form data", "lead submits", "lead comes in", "new lead", "lead intake", "lead capture", "captures lead"],
    nodeType: "lead-intake",
    label: "Lead Intake",
    category: "trigger",
  },
  {
    keywords: ["webhook", "http request comes in", "external trigger", "api call comes in", "receives a request", "incoming request"],
    nodeType: "webhook",
    label: "Webhook Trigger",
    category: "trigger",
  },
  {
    keywords: ["schedule", "every hour", "every day", "daily", "hourly", "cron", "recurring", "timed", "periodic"],
    nodeType: "schedule",
    label: "Schedule",
    category: "trigger",
  },
  {
    keywords: ["email arrives", "new email", "email trigger", "when i receive email", "incoming email"],
    nodeType: "email-trigger",
    label: "Email Trigger",
    category: "trigger",
  },
  {
    keywords: ["api trigger", "manual trigger", "button click", "manually trigger", "run manually"],
    nodeType: "api-trigger",
    label: "API Trigger",
    category: "trigger",
  },

  // ── Processing / Logic ──
  {
    keywords: ["score", "scoring", "qualify", "qualification", "rank", "ranking", "rate the lead", "lead score", "hot or cold", "hot/warm/cold"],
    nodeType: "lead-scoring",
    label: "Lead Scoring",
    category: "logic",
  },
  {
    keywords: ["route", "routing", "direct to", "assign to", "categorize", "split", "branch", "if hot then", "hot leads go to", "separate", "divide"],
    nodeType: "lead-router",
    label: "Lead Router",
    category: "logic",
  },
  {
    keywords: ["delay", "wait", "pause", "sleep", "wait before", "hold"],
    nodeType: "delay",
    label: "Delay",
    category: "logic",
    extractParams: (prompt) => {
      const durationMatch = prompt.match(/(\d+)\s*(second|minute|hour)s?/i);
      if (durationMatch) {
        const num = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        if (unit === "hour") return { duration: Math.min(num * 60, 300), timeUnit: "minutes" };
        if (unit === "minute") return { duration: Math.min(num, 300), timeUnit: "minutes" };
        return { duration: Math.min(num, 300), timeUnit: "seconds" };
      }
      return { duration: 5, timeUnit: "seconds" };
    },
  },
  {
    keywords: ["log", "debug", "print", "console"],
    nodeType: "log",
    label: "Log",
    category: "logic",
  },
  {
    keywords: ["transform", "convert", "map", "reshape", "format data"],
    nodeType: "transform",
    label: "Transform",
    category: "logic",
  },
  {
    keywords: ["condition", "if ", "check if", "verify", "conditional"],
    nodeType: "condition",
    label: "Condition",
    category: "logic",
  },

  // ── Actions ──
  {
    keywords: ["discord", "send discord", "notify discord", "post to discord", "discord alert", "discord notification", "discord message"],
    nodeType: "discord",
    label: "Discord Message",
    category: "action",
  },
  {
    keywords: ["google sheet", "google sheets", "save to sheet", "spreadsheet", "sheets crm", "append to sheet", "save to crm", "save to google"],
    nodeType: "google-sheets",
    label: "Google Sheets CRM",
    category: "action",
  },
  {
    keywords: ["notify", "notification", "alert", "send alert", "send notification"],
    nodeType: "notification",
    label: "Notification",
    category: "action",
  },
  {
    keywords: ["send email", "email them", "email the lead", "send an email", "email notification"],
    nodeType: "send-email",
    label: "Send Email",
    category: "action",
  },
  {
    keywords: ["slack", "send slack", "notify slack", "post to slack", "slack message"],
    nodeType: "slack",
    label: "Slack Message",
    category: "action",
  },
  {
    keywords: ["create task", "assign task", "add task", "todo"],
    nodeType: "task",
    label: "Create Task",
    category: "action",
  },
  {
    keywords: ["http request", "api call", "fetch", "http call", "call api", "external api", "webhook call"],
    nodeType: "http",
    label: "HTTP Request",
    category: "action",
    extractParams: (prompt) => {
      const urlMatch = prompt.match(/https?:\/\/[^\s"']+/i);
      if (urlMatch) return { url: urlMatch[0], method: "POST" };
      return {};
    },
  },

  // ── AI Nodes ──
  {
    keywords: ["classify", "categorize", "tag", "label"],
    nodeType: "classify",
    label: "Classify",
    category: "ai",
  },
  {
    keywords: ["generate", "ai generate", "create content", "write", "draft"],
    nodeType: "generate",
    label: "Generate",
    category: "ai",
  },
  {
    keywords: ["analyze", "analysis", "sentiment", "extract insights"],
    nodeType: "analyze",
    label: "Analyze",
    category: "ai",
  },
  {
    keywords: ["chat", "conversation", "respond", "reply"],
    nodeType: "chat",
    label: "Chat",
    category: "ai",
  },
];

// Category priority for ordering nodes in the graph
const categoryPriority: Record<string, number> = {
  trigger: 0,
  logic: 1,
  ai: 2,
  action: 3,
};

/**
 * Parse a natural language prompt into an ordered list of intents.
 */
export function parseIntents(prompt: string): ParsedIntent[] {
  const normalized = prompt.toLowerCase().trim();
  const matched: ParsedIntent[] = [];
  const seenNodeTypes = new Set<string>();

  for (const rule of patternRules) {
    // Check if any keyword matches (with fuzzy matching)
    let bestConfidence = 0;
    for (const keyword of rule.keywords) {
      const confidence = fuzzyKeywordMatch(normalized, keyword);
      bestConfidence = Math.max(bestConfidence, confidence);
    }

    if (bestConfidence > 0 && !seenNodeTypes.has(rule.nodeType)) {
      seenNodeTypes.add(rule.nodeType);
      const params = rule.extractParams ? rule.extractParams(normalized) : {};
      matched.push({
        nodeType: rule.nodeType,
        label: rule.label,
        params,
        confidence: Math.min(bestConfidence, 1),
      });
    }
  }

  // Sort by category priority (trigger → logic → ai → action)
  matched.sort((a, b) => {
    const catA = getPatternCategory(a.nodeType);
    const catB = getPatternCategory(b.nodeType);
    return (categoryPriority[catA] ?? 9) - (categoryPriority[catB] ?? 9);
  });

  return matched;
}

function getPatternCategory(nodeType: string): string {
  for (const rule of patternRules) {
    if (rule.nodeType === nodeType) return rule.category;
  }
  return "logic";
}

/**
 * Extract a workflow name suggestion from the prompt.
 */
export function extractWorkflowName(prompt: string): string {
  // Take first 50 chars, capitalize first letter, clean up
  const cleaned = prompt
    .replace(/[.!?]+$/, "")
    .trim();

  if (cleaned.length <= 50) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Try to cut at a word boundary
  const truncated = cleaned.substring(0, 50);
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.substring(0, lastSpace > 20 ? lastSpace : 50).charAt(0).toUpperCase() +
    truncated.substring(0, lastSpace > 20 ? lastSpace : 50).slice(1) + "...";
}

/**
 * Extract a workflow description from the prompt.
 */
export function extractWorkflowDescription(prompt: string): string {
  if (prompt.length <= 200) return prompt;
  return prompt.substring(0, 197) + "...";
}
