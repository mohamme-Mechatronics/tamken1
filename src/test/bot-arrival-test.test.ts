import { describe, expect, it } from 'vitest';
import { confirmsArrival } from '@/lib/bot-arrival-test';

describe('bot message read-back confirmation', () => {
  it('confirms only the exact saved bot text message', () => {
    expect(confirmsArrival('test-123', { text: 'test-123', direction: 'bot', kind: 'text' })).toBe(true);
  });
  it('does not confirm an absent message', () => {
    expect(confirmsArrival('test-123', null)).toBe(false);
  });
  it('does not confirm a different message', () => {
    expect(confirmsArrival('test-123', { text: 'test-456', direction: 'bot', kind: 'text' })).toBe(false);
  });
  it('does not confirm an incoming customer message as a bot reply', () => {
    expect(confirmsArrival('test-123', { text: 'test-123', direction: 'customer', kind: 'text' })).toBe(false);
  });
});