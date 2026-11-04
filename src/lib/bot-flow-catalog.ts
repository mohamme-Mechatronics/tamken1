import ALL from '@/lib/bot-texts.json';

export type BotFlowText = { k: string; m: string; t: string; s: string; o: string; b?: string; d?: string };
export const BOT_FLOW_TEXTS: BotFlowText[] = ALL;
export const BOT_FLOW_KEYS = new Set(BOT_FLOW_TEXTS.map((r) => r.k));

// Match against the workflow's exact originals, while preserving the current brand/contact in every default.
export const botFlowDefault = (text: string) => text
  .replace(/أكتس|اكتس|ACTES/gi, 'تمكين')
  .replace(/www\.actesgroup\.com/gi, 'wa.me/967777687107')
  .replace(/(?:967)?(?:770229994|773590979)/g, '777687107');

export function activeBotTextEdits<T extends { key: string; original: string }>(rows: T[]) {
  return rows.filter((r) => BOT_FLOW_TEXTS.some((text) => text.k === r.key && text.o === r.original));
}