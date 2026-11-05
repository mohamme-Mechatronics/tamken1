import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

// HTML -> PDF for the bot's quotes and PVsyst studies. The n8n workflow posts the same
// multipart form Gotenberg expects (files=index.html [+ footer.html], printBackground, ...);
// we forward it to a Gotenberg Chromium server and stream the PDF back.
// GOTENBERG_URL (optional secret) points at a private Gotenberg; default is the public demo.
const DEFAULT_GOTENBERG = "https://demo.gotenberg.dev";

export const Route = createFileRoute("/api/public/bot-pdf")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const got = Buffer.from(request.headers.get("x-bot-secret") ?? "");
        const exp = Buffer.from(process.env["BOT_INGEST_SECRET"] ?? "");
        if (!exp.length || got.length !== exp.length || !timingSafeEqual(got, exp)) {
          return new Response("Unauthorized", { status: 401 });
        }
        const ct = request.headers.get("content-type") ?? "";
        if (!ct.toLowerCase().startsWith("multipart/form-data")) {
          return new Response("Expected multipart/form-data", { status: 400 });
        }
        const base = (process.env["GOTENBERG_URL"] || DEFAULT_GOTENBERG).replace(/\/+$/, "");
        const headers: Record<string, string> = { "content-type": ct };
        const fname = request.headers.get("gotenberg-output-filename");
        if (fname) headers["Gotenberg-Output-Filename"] = fname;
        const body = await request.arrayBuffer();
        const res = await fetch(`${base}/forms/chromium/convert/html`, { method: "POST", headers, body });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          console.error(`bot-pdf: Gotenberg ${res.status}: ${t.slice(0, 500)}`);
          return new Response(`PDF service failed [${res.status}]: ${t.slice(0, 300)}`, { status: 502 });
        }
        const out = new Headers({ "content-type": res.headers.get("content-type") ?? "application/pdf" });
        const cd = res.headers.get("content-disposition");
        if (cd) out.set("content-disposition", cd);
        return new Response(res.body, { status: 200, headers: out });
      },
    },
  },
});
