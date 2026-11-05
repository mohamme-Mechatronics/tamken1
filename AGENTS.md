<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Bot items, prices and datasheet PDFs live only in `public.catalog_items`, edited from the dashboard and served to n8n via `/api/public/bot-catalog` — one source of truth so quotes and catalogs never diverge.
- PVsyst/SLD files are uploaded once per ready-made system (`preset_reports`, keyed by preset title) and sent by staff from `report_requests`; the bot only files a request, so customers never get an unreviewed report.
- The kWh price lives in `public.app_settings` (key `kwh_price`), edited from the quote screen and sent to n8n inside `/api/public/bot-catalog` — one value for bot and app.
- Quote system picks in `QuoteBuilder` are a literal port of the bot's resNearest/comInvOptions rules; change both together so they never disagree.
- Auto-add item rules live in `catalog_items.auto_rules` and are evaluated by `src/lib/auto-rules.ts` in QuoteBuilder and by its port `ACTES_AUTO_ADD` in the n8n State Machine (fed via `AUTO_RULES` in bot-catalog) — change both together so app and bot quotes match.
- Offline-first: every screen's data query must be wrapped in `offlineQuery` from `src/lib/offline-cache.ts` (it copies each result to the device and reads it back when the internet is missing), and the start page must stay in the service worker's `pages` cache via `saveShell()` in `src/lib/offline-shell.ts` — new screens have to follow the same pattern so the installed desktop app still opens and shows data with no internet.
- PVsyst reports are generated per request by `src/lib/pvsyst-pdf.ts` from numbers in `src/lib/pvsyst-calc.ts` (site weather from PVGIS for the customer's city, tilt and direction; Sanaa reference as fallback) and cached on the request's `file_path`.
- SLD diagrams are generated per request by `src/lib/sld-pdf.ts` from sizing in `src/lib/sld-calc.ts` and cached on the request's `file_path` — no uploaded per-system files needed.
- Bot text editing uses the uploaded workflow's State Machine inventory, regenerated with `scripts/harvest-bot-texts.mjs`; unchanged exact originals retain keys and new originals use deterministic SHA-256 signatures. `bot-flow-catalog` filters stale overrides and normalizes branding/contact defaults; bot-catalog exports only matching overrides. The n8n workflow must consume BOT_TEXTS/BOT_STEPS before final output for edits to affect live replies.
- n8n base URL is the fixed constant `N8N_URL` in `src/lib/server-url-rules.ts` (not editable). The frontend URL lives in app_settings key `frontend_url` (`text_value`); `FrontendRedirect` sends installed PWAs on the default published host there — keep the old host published so old installs follow a move.
- Forced update: each build gets `__APP_VERSION__` (vite define), served by `/api/public/app-version`; `UpdateGate` in __root blocks the app until the service worker pulls the new build (skipped offline, one attempt per version per session).
- Vercel hosts only the static SPA (VERCEL=1 build: nitro off, spa on, scripts/vercel-sw.mjs makes sw.js + app-version.json); vercel.json proxies /_serverFn and /api to the Lovable published host — server secrets stay on Lovable, so publish Lovable and redeploy Vercel from the same code (server-function IDs must match).
- Message-arrival diagnostics authenticate the dashboard password, POST a synthetic bot message through the real ingest endpoint, confirm exact database read-back, and remove temporary data; label this receiver simulation, never n8n end-to-end delivery without a verified n8n execution.
- The «محادثة البوت» tab sends `{"message"}` to the n8n chat webhook (`BOT_CHAT_WEBHOOK_URL` in `src/lib/bot-chat-reply.ts`) through the password-checked `chatWithBot` server function and shows the parsed reply; server-side so it avoids browser CORS and works behind the Vercel proxy.
