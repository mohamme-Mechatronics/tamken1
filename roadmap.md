# Roadmap

- [x] Add receiver simulation in Connection Settings: POST test bot message, display exact read-back/time/status, clean temporary data; verified desktop/mobile and four tests.
- [ ] Send the practical test from n8n itself — blocked: n8n connection declined; no safe test webhook exists in uploaded workflow.

- [x] Replace the dashboard's previous editable bot path with the uploaded Tamkeen v51 inventory; verify pump section and saved edits read back after reload.
- [ ] Enable live n8n consumption of BOT_TEXTS/BOT_STEPS for uploaded v51 — blocked: no connected n8n service is available; uploaded workflow lacks the text/step overlay.

- [x] Delete «يحتاج مخطط» from the chat filter bar
- [x] Move «يحتاج موظف» next to «الكل» in the chat filter bar
- [x] Publish so the filter-bar changes reach the public site
- [x] Reports tab: PVsyst/SLD requests from the bot, per-system PDF files, open + send to customer
- [x] Switch the live bot to send PVsyst/SLD as requests — saved in n8n, request lands in Reports as pending
- [x] Editable kWh price (default 290) + app home/business picks copied exactly from the bot
- [x] Bot reads kWh price from the app
- [x] Edit quote items (qty, swap, price, delete) after closing the price card — this copy only
- [x] Three choices (less / recommended / more independence) in app and bot home path
- [x] Bot: three choices for large business systems
- [x] Business three choices = the very next size (app)
- [x] App: pick inverter size + single/three phase for business, like the bot
- [x] Bot: inverter size → phase → three choices (very next size) for business
- [x] App: always ask inverter size first for business, even if only one size
- [x] Bot: always ask inverter size first (residential path asks capacity before the bill)
- [x] Connect n8n in the new workspace (linked: حمود's n8n)
- [x] Restore bot password secret (BOT_INGEST_SECRET) — needs publish to take effect
- [x] Fix duplicate bot replies — guard live: same message accepted once, second copy rejected
- [x] Restore catalog into the dashboard (45 items + 30 datasheet PDFs, kWh price 290)
- [x] Connect n8n in the new workspace
- [x] Datasheets + full data snapshot (data/) stored inside the project and loaded into the database
- [x] Connect n8n in the new workspace (linked: سفيان's n8n, gateway, 43 workflows visible)
- [x] Desktop/PWA opens fully offline: start page cached on first visit, every screen's data copied to the device (verified: offline reload shows the app)
- [ ] Offline check while logged in (all chats/orders visible with internet off) — needs the dashboard password to sign in for the test
- [x] PVsyst: customer picks city/tilt/direction in bot; report popup in dashboard; PVsyst logo + ACTES corner logo
- [x] إصلاح تكرار رسائل البوت (بانتظار تجربة رسالة حقيقية)
- [ ] دليل أكتس PDF v2 (المصدر في /mnt/documents/.lovable/guide)
- [x] ربط n8n من جديد بعد نقل المشروع
- [x] إضافة خطوات في «المسار»

- [x] إعدادات الاتصال: رابط خادم البوت مركزي
- [x] استضافة الواجهة على Vercel مع بقاء الخادم في Lovable
- [x] سؤال إلغاء Backend: أُجيب (لا يُلغى، Vercel يعتمد عليه)

- [x] Bot chat tab: send user message to n8n production webhook as {"message"}, wait for reply, show it; publish
- [x] Edit bot workflow file so webhook 9522a34f… replies to the dashboard chat (Respond to Webhook) and links to the dashboard (v52 file + bot memory endpoint)
- [ ] Import v52 into n8n and activate — needs the user (no n8n access)
- [ ] Bot AI answers (/api/public/bot-agent) and quote/study PDF maker (/api/public/bot-pdf) missing in dashboard — awaiting user decision

- [ ] Bot v53 from original v51 file: all links → tamken1, media hosted on the new site, new Tamken logo/images, Telegram token filled, ready to import
- [ ] Add missing bot services: AI answers (bot-agent) and PDF maker (bot-pdf)
