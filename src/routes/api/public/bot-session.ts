import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { z } from "zod";

// The n8n bot's conversation memory: Load/Get Session read it, Upsert Session saves it after each reply.
const Get = z.object({ action: z.literal("get"), phone: z.string().min(3).max(32) });
const Upsert = z.object({ action: z.literal("upsert"), phone: z.string().min(3).max(32) }).catchall(z.union([z.string().max(20000), z.number(), z.boolean(), z.null()]));

export const Route = createFileRoute("/api/public/bot-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const got = Buffer.from(request.headers.get("x-bot-secret") ?? "");
        const exp = Buffer.from(process.env["BOT_INGEST_SECRET"] ?? "");
        if (!exp.length || got.length !== exp.length || !timingSafeEqual(got, exp)) {
          return new Response("Unauthorized", { status: 401 });
        }
        let raw: unknown;
        try { raw = await request.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
        const { supabaseAdmin } = await import("@/lib/db.server");
        const action = (raw as { action?: unknown } | null)?.action;
        if (action === "get") {
          const p = Get.safeParse(raw);
          if (!p.success) return new Response("Bad body", { status: 400 });
          const { data, error } = await supabaseAdmin.from("bot_sessions").select("data").eq("phone", p.data.phone).maybeSingle();
          if (error) return new Response("DB error", { status: 500 });
          return Response.json(data ? { ...(data.data as Record<string, unknown>), phone: p.data.phone } : {});
        }
        if (action === "upsert") {
          const p = Upsert.safeParse(raw);
          if (!p.success) return new Response("Bad body", { status: 400 });
          const { action: _a, ...fields } = p.data;
          const { error } = await supabaseAdmin.from("bot_sessions")
            .upsert({ phone: fields.phone, data: fields, updated_at: new Date().toISOString() }, { onConflict: "phone" });
          if (error) return new Response("DB error", { status: 500 });
          return Response.json(fields);
        }
        return new Response("Unknown action", { status: 400 });
      },
    },
  },
});
