import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { CheckCircle2, CircleAlert, LoaderCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { testBotMessageArrival } from '@/lib/bot-arrival.functions';
import type { ArrivalResult } from '@/lib/bot-arrival-test';

export function BotArrivalTest({ pw }: { pw: string }) {
  const test = useServerFn(testBotMessageArrival);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ArrivalResult | null>(null);
  const [error, setError] = useState('');
  const run = async () => {
    setBusy(true); setResult(null); setError('');
    try { setResult(await test({ data: { pw } })); }
    catch { setError('تعذر إجراء الاختبار. حاول مجدداً.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3 border-t border-border pt-3">
    <h3 className="font-bold">اختبار وصول رسائل البوت</h3>
    <p className="text-sm text-muted-foreground">البوت الفعلي: غير مختبَر — لم يتم ربط n8n.</p>
    <Button disabled={busy} onClick={run} variant="outline" className="w-full">
      {busy ? <LoaderCircle className="animate-spin" /> : <Send />}
      {busy ? 'جارٍ إرسال الرسالة والتحقق…' : 'إرسال رسالة اختبار للاستقبال'}
    </Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {result && <div role="status" className="space-y-2 text-sm break-words">
      <p className={`flex items-start gap-2 font-semibold ${result.ok ? 'text-primary' : 'text-destructive'}`}>
        {result.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <CircleAlert className="h-4 w-4 shrink-0" />}{result.message}
      </p>
      <p>نوع الاختبار: محاكاة إرسال إلى استقبال الإدارة، وليس من n8n.</p>
      <p>الرسالة المرسلة: {result.sentText}</p>
      <p>الرسالة المقروءة: {result.receivedText ?? 'لم تُقرأ رسالة'}</p>
      {result.receivedAt && <p>وقت الوصول: {new Date(result.receivedAt).toLocaleString('ar-YE')}</p>}
      {result.httpStatus !== null && <p>رمز الاستقبال: {result.httpStatus}</p>}
      <p>{result.cleanedUp ? 'حُذفت بيانات الاختبار المؤقتة.' : 'تعذر حذف بيانات الاختبار المؤقتة.'}</p>
    </div>}
  </section>;
}