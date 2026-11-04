import { describe, expect, it } from 'vitest';
import { activeBotTextEdits, BOT_FLOW_TEXTS } from '@/lib/bot-flow-catalog';

describe('workflow inventory synchronization', () => {
  it('retains overrides only for the exact current workflow original', () => {
    const row = BOT_FLOW_TEXTS[0];
    if (!row) throw new Error('Inventory missing');
    const current = { key: row.k, original: row.o };
    expect(activeBotTextEdits([current, { key: row.k, original: 'stale original' }, { key: 'removed', original: row.o }])).toEqual([current]);
  });
  it('assigns each editable fragment a unique key', () => {
    expect(new Set(BOT_FLOW_TEXTS.map((r) => r.k)).size).toBe(BOT_FLOW_TEXTS.length);
  });
});