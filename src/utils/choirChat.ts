import type { ChoirChatMessage } from '../types';

/** Messages auto-purge permanently after 24 hours. */
export const CHAT_TTL_MS = 24 * 60 * 60 * 1000;

export function chatExpiresAtMs(fromMs = Date.now()): number {
  return fromMs + CHAT_TTL_MS;
}

export function isChatMessageExpired(message: Pick<ChoirChatMessage, 'expiresAtMs'>): boolean {
  return message.expiresAtMs <= Date.now();
}

/** Newest-last for chat UI; drops expired / soft-deleted. */
export function visibleChatMessages(messages: ChoirChatMessage[]): ChoirChatMessage[] {
  return messages
    .filter((m) => !isChatMessageExpired(m) && m.status !== 'deleted')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function expiredChatMessageIds(messages: ChoirChatMessage[]): string[] {
  return messages.filter(isChatMessageExpired).map((m) => m.id);
}
