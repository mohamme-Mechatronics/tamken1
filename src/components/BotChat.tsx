import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, CircleAlert, Send, User } from "lucide-react";
import { chatWithBot } from "@/lib/bot-chat.functions";
import { WaText } from "@/components/WaText";

type Msg = { id: string; from: "user" | "bot" | "error"; text: string; at: number };

const fmt = (t: number) => new Date(t).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });

export function BotChat({ pw }: { pw: string }) {
  const ask = useServerFn(chatWithBot);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [waiting, setWaiting] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = box.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs.length, waiting]);

  const add = (from: Msg["from"], t: string) => setMsgs((m) => [...m, { id: crypto.randomUUID(), from, text: t, at: Date.now() }]);

  const submit = async () => {
    const t = text.trim(); if (!t || waiting) return;
    add("user", t); setText("");
    if (!navigator.onLine) { add("error", "لا يوجد إنترنت — لم تُرسل الرسالة."); return; }
    setWaiting(true);
    try {
      const r = await ask({ data: { pw, message: t } });
      if (r.ok) add("bot", r.reply); else add("error", r.error);
    } catch (e) {
      add("error", e instanceof Error ? e.message : "تعذّر الإرسال");
    } finally { setWaiting(false); }
  };

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[420px] flex-col lg:h-full">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></span>
        <div className="leading-tight">
          <div className="text-sm font-bold">محادثة البوت</div>
          <div className="text-[11px] text-muted-foreground">{waiting ? "يكتب الآن…" : "الرسائل تُرسل مباشرة إلى n8n"}</div>
        </div>
      </div>
      <div ref={box} data-scroll className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted/40 p-3 text-sm">
        {msgs.length === 0 && !waiting && <p className="mt-10 text-center text-xs text-muted-foreground">اكتب رسالة لبدء المحادثة مع البوت.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.from === "user" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[85%] break-words rounded-2xl px-3 py-2 shadow-sm ${m.from === "user" ? "rounded-tr-sm bg-primary text-primary-foreground" : m.from === "bot" ? "rounded-tl-sm bg-card text-card-foreground" : "rounded-tl-sm border border-destructive/40 bg-destructive/10 text-destructive"}`}>
              {m.from === "error" ? <p role="alert" className="flex items-start gap-1.5"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{m.text}</p> : <WaText text={m.text} />}
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                {m.from === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}<span>{fmt(m.at)}</span>
              </div>
            </div>
          </div>
        ))}
        {waiting && (
          <div className="flex justify-end" aria-live="polite">
            <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-card px-3 py-3 shadow-sm">
              {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />)}
            </div>
          </div>
        )}
      </div>
      <form className="flex items-end gap-2 border-t border-border p-2" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} placeholder="اكتب رسالتك…" aria-label="رسالة للبوت"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
          className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <button disabled={waiting || !text.trim()} aria-label="إرسال للبوت" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
          <Send className="h-4 w-4 -scale-x-100" />
        </button>
      </form>
    </div>
  );
}
