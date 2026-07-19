import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  CHAT_TTL_MS,
  chatExpiresAtMs,
  expiredChatMessageIds,
  isChatMessageExpired,
  visibleChatMessages,
} from './choirChat';
import type { ChoirChatMessage } from '../types';

function msg(partial: Partial<ChoirChatMessage> & Pick<ChoirChatMessage, 'id' | 'expiresAtMs' | 'createdAt'>): ChoirChatMessage {
  return {
    text: 'hi',
    senderId: 'u1',
    senderName: 'Test',
    senderPhotoUrl: '',
    ...partial,
  } as ChoirChatMessage;
}

describe('choirChat TTL helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets expiry 24h after send', () => {
    const now = 1_700_000_000_000;
    expect(chatExpiresAtMs(now)).toBe(now + CHAT_TTL_MS);
  });

  it('hides expired messages and sorts by createdAt', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-20T12:00:00.000Z'));
    const now = Date.now();
    const rows = visibleChatMessages([
      msg({ id: 'b', createdAt: '2026-07-20T11:00:00.000Z', expiresAtMs: now + 1000 }),
      msg({ id: 'a', createdAt: '2026-07-20T10:00:00.000Z', expiresAtMs: now + 1000 }),
      msg({ id: 'old', createdAt: '2026-07-19T10:00:00.000Z', expiresAtMs: now - 1 }),
    ]);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('flags expired ids for purge', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-20T12:00:00.000Z'));
    const now = Date.now();
    expect(isChatMessageExpired({ expiresAtMs: now - 1 })).toBe(true);
    expect(
      expiredChatMessageIds([
        msg({ id: 'keep', createdAt: '2026-07-20T11:00:00.000Z', expiresAtMs: now + 1 }),
        msg({ id: 'gone', createdAt: '2026-07-19T11:00:00.000Z', expiresAtMs: now - 1 }),
      ]),
    ).toEqual(['gone']);
  });
});
