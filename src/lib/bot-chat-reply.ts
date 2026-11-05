// Pure helpers for the n8n chat webhook — shared by server and tests, no secrets here.
export const BOT_CHAT_WEBHOOK_URL = "https://tamken.app.n8n.cloud/webhook/9522a34f-2d1f-4926-83ea-b1ac4bf8b2ec";

const REPLY_KEYS = ["reply", "output", "text", "response", "answer", "message", "content", "result", "data"] as const;

/** Pull the bot's reply text out of whatever shape the n8n "Respond to Webhook" node returns. */
export function extractBotReply(value: unknown, depth = 0): string | null {
  if (depth > 5 || value == null) return null;
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return null;
    if ((t.startsWith("{") || t.startsWith("[")) && depth === 0) {
      try { return extractBotReply(JSON.parse(t), depth + 1) ?? t; } catch { return t; }
    }
    return t;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const parts = value.map((v) => extractBotReply(v, depth + 1)).filter((v): v is string => !!v);
    return parts.length ? parts.join("\n\n") : null;
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    for (const k of REPLY_KEYS) {
      if (k in o) { const r = extractBotReply(o[k], depth + 1); if (r) return r; }
    }
    if ("json" in o) return extractBotReply(o["json"], depth + 1);
  }
  return null;
}
