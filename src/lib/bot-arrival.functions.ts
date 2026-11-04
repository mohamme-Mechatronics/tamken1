import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { confirmsArrival, type ArrivalResult } from '@/lib/bot-arrival-test';

export const testBotMessageArrival = createServerFn({ method: 'POST' })
  .inputValidator((data) => z.object({ pw: z.string() }).parse(data))
  .handler(async ({ data }): Promise<ArrivalResult> => {
    if (!process.env['DASHBOARD_PASSWORD'] || data.pw !== process.env['DASHBOARD_PASSWORD']) throw new Error('كلمة المرور غير صحيحة');
    const requestId = crypto.randomUUID();
    // Not a reachable telephone number. The temporary customer is removed after read-back.
    const phone = '999' + requestId.replace(/-/g, '').split('').map((c) => parseInt(c, 16) % 10).join('').slice(0, 27);
    const sentText = `رسالة اختبار استقبال تمكين — ${requestId}`;
    const result: ArrivalResult = { ok: false, mode: 'receiver', message: '', sentText, receivedText: null, receivedAt: null, requestId, httpStatus: null, cleanedUp: false };
    const secret = process.env['BOT_INGEST_SECRET'];
    if (!secret) return { ...result, message: 'مفتاح استقبال البوت غير متاح؛ لم تُرسل الرسالة.' };
    const { supabaseAdmin } = await import('@/lib/db.server');
    try {
      const response = await fetch(new URL('/api/public/bot-message', getRequest().url), {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-bot-secret': secret },
        body: JSON.stringify({ phone, name: 'اختبار استقبال مؤقت', direction: 'bot', kind: 'text', text: sentText }),
        signal: AbortSignal.timeout(15000), redirect: 'error',
      });
      result.httpStatus = response.status;
      if (!response.ok) {
        result.message = `لم يقبل استقبال الإدارة الرسالة (رمز ${response.status}).`;
      } else {
        const { data: customer, error: customerError } = await supabaseAdmin.from('customers').select('id').eq('phone', phone).maybeSingle();
        if (customerError) throw customerError;
        if (customer) {
          const { data: message, error } = await supabaseAdmin.from('messages').select('text,direction,kind,created_at').eq('customer_id', customer.id).eq('text', sentText).maybeSingle();
          if (error) throw error;
          result.ok = confirmsArrival(sentText, message);
          result.receivedText = message?.text ?? null;
          result.receivedAt = message?.created_at ?? null;
        }
        result.message = result.ok ? 'وصلت الرسالة إلى الإدارة وتأكدنا من حفظها وقراءتها.' : 'قُبل الطلب، لكن لم نتأكد من حفظ الرسالة؛ الاختبار غير ناجح.';
      }
    } catch {
      result.ok = false;
      result.message = 'تعذر إكمال اختبار الاستقبال؛ لم يتم تأكيد وصول الرسالة.';
    } finally {
      const { error } = await supabaseAdmin.from('customers').delete().eq('phone', phone).eq('name', 'اختبار استقبال مؤقت');
      result.cleanedUp = !error;
    }
    return result;
  });