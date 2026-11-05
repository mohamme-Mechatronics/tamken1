import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { SUPPORT_KB } from "@/lib/support-kb";

// Free-text answers for the WhatsApp/Telegram bot (called from the n8n State Machine
// when the customer types a question instead of picking a menu option).
// Reply shape the bot expects: { handled, reply, escalated?: { reason } }.
const Body = z.object({
  phone: z.string().max(40).nullish(),
  text: z.string().min(1).max(2000),
  message_id: z.string().max(200).nullish(),
});

const SCHEMA = {
  name: "agent_reply",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["reply", "escalate", "reason"],
    properties: {
      reply: { type: "string", description: "الرد للعميل" },
      escalate: { type: "boolean", description: "هل يحتاج موظفاً" },
      reason: { type: "string", description: "سبب التحويل لموظف أو نص فارغ" },
    },
  },
};

function instructions(catalog: string) {
  return `أنت مساعد مبيعات ودعم لشركة تمكين لأنظمة الطاقة وحلولها في اليمن. ترد على العميل عبر واتساب بالعربية البسيطة باسم تمكين فقط، ولا تذكر أنك ذكاء اصطناعي ولا تذكر أي شركة أخرى.
- أجب باختصار (حتى 600 حرف) وبدقة، ولا تستخدم Markdown عدا *نجمة* للعنوان.
- الأسعار: استخدم فقط الأسعار الموجودة في القائمة أدناه بالدولار، ولا تخترع سعراً أو منتجاً غير موجود. إن لم تجد الصنف قل إن الموظف سيؤكد السعر واجعل escalate=true.
- اختم دائماً بجملة قصيرة: "اكتب *قائمة* للعودة إلى الخيارات" .
- اجعل escalate=true عند: طلب شراء/حجز/زيارة/تركيب، شكوى، تفاوض على السعر، أو سؤال لا تعرف جوابه بثقة، واكتب السبب في reason.
- رقم خدمة العملاء: 777687107.
قائمة الأصناف والأسعار:
${catalog}
المعرفة الفنية:
${SUPPORT_KB}`;
}

export const Route = createFileRoute("/api/public/bot-agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const got = Buffer.from(request.headers.get("x-bot-secret") ?? "");
        const exp = Buffer.from(process.env["BOT_INGEST_SECRET"] ?? "");
        if (!exp.length || got.length !== exp.length || !timingSafeEqual(got, exp)) {
          return new Response("Unauthorized", { status: 401 });
        }
        const p = Body.safeParse(await request.json().catch(() => null));
        if (!p.success) return new Response(p.error.message, { status: 400 });

        const { supabaseAdmin } = await import("@/lib/db.server");
        const { data: items } = await supabaseAdmin
          .from("catalog_items").select("name,unit,price,category").eq("active", true).order("sort");
        const catalog = (items ?? [])
          .map((r: { name: string; unit: string | null; price: number | null }) =>
            `- ${r.name}${r.price != null ? ` — ${Number(r.price)}$` : ""}${r.unit ? ` / ${r.unit}` : ""}`)
          .join("\n");

        const { askAI, AiError } = await import("@/lib/ai.server");
        try {
          const txt = await askAI({ instructions: instructions(catalog), input: p.data.text, schema: SCHEMA });
          const j = JSON.parse(txt) as { reply: string; escalate: boolean; reason: string };
          if (!j.reply?.trim()) return Response.json({ handled: false });
          return Response.json({
            handled: true,
            reply: j.reply.trim(),
            escalated: j.escalate ? { reason: j.reason || "سؤال يحتاج موظف" } : null,
          });
        } catch (e) {
          const status = e instanceof AiError ? e.status : 500;
          console.error("bot-agent failed", status, e);
          // handled:false keeps the bot's normal menu reply.
          return Response.json({ handled: false });
        }
      },
    },
  },
});
