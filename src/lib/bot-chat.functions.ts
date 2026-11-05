import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { BOT_CHAT_WEBHOOK_URL, extractBotReply } from "@/lib/bot-chat-reply";

export type BotChatResult = { ok: true; reply: string } | { ok: false; error: string; status: number | null };

export const chatWithBot = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ pw: z.string(), message: z.string().trim().min(1).max(4000) }).parse(data))
  .handler(async ({ data }): Promise<BotChatResult> => {
    if (!process.env["DASHBOARD_PASSWORD"] || data.pw !== process.env["DASHBOARD_PASSWORD"]) throw new Error("كلمة المرور غير صحيحة");
    let res: Response;
    try {
      res = await fetch(BOT_CHAT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json, text/plain, */*" },
        body: JSON.stringify({ message: data.message }),
        signal: AbortSignal.timeout(90000),
      });
    } catch (e) {
      console.error("n8n chat webhook unreachable", e);
      return { ok: false, status: null, error: "تعذّر الوصول إلى البوت (n8n) أو تأخر الرد كثيراً." };
    }
    const body = await res.text();
    if (!res.ok) {
      console.error(`n8n chat webhook failed [${res.status}]: ${body.slice(0, 500)}`);
      return { ok: false, status: res.status, error: `رفض n8n الطلب (رمز ${res.status}). ${body.slice(0, 200)}`.trim() };
    }
    const reply = extractBotReply(body);
    if (!reply) return { ok: false, status: res.status, error: "وصلت الرسالة إلى n8n لكنه أعاد رداً فارغاً — أضف عقدة «Respond to Webhook» في نهاية المسار." };
    return { ok: true, reply };
  });
