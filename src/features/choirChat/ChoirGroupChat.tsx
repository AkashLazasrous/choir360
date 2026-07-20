import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Loader2, SendHorizontal, SmilePlus } from 'lucide-react';
import type { ChoirChatMessage, Member } from '../../types';
import { deleteTenantRecords, isFirebaseConfigured } from '../../services/firebase';
import { expiredChatMessageIds, visibleChatMessages } from '../../utils/choirChat';
import { CHAT_EMOJI_GROUPS } from './emojiPalette';

type ChoirGroupChatProps = {
  messages: ChoirChatMessage[];
  members: Member[];
  currentUserId: string;
  currentMember: Member | null;
  parishName: string;
  isLive: boolean;
  syncError: string | null;
  onSend: (text: string) => Promise<{ ok: boolean; error?: string }>;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function Avatar({
  name,
  photoUrl,
  size = 'md',
}: {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-9 w-9 text-[12px]';
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={`${dim} shrink-0 rounded-full object-cover ring-2 ring-black/5`}
      />
    );
  }
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-[#128c7e] font-semibold text-white ring-2 ring-black/5`}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return '';
  }
}

/**
 * Parish WhatsApp-style group chat. Messages sync live and hard-delete after 24h.
 */
export const ChoirGroupChat: React.FC<ChoirGroupChatProps> = ({
  messages,
  members,
  currentUserId,
  currentMember,
  parishName,
  isLive,
  syncError,
  onSend,
}) => {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiGroup, setEmojiGroup] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiPanelRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => visibleChatMessages(messages), [messages]);
  const memberById = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const purgeExpired = useEffectEvent(async () => {
    if (!isFirebaseConfigured) return;
    const ids = expiredChatMessageIds(messages);
    if (ids.length === 0) return;
    try {
      await deleteTenantRecords('choirChatMessages', ids);
    } catch {
      /* another client may win the race */
    }
  });

  useEffect(() => {
    void purgeExpired();
    const timer = window.setInterval(() => void purgeExpired(), 60_000);
    return () => window.clearInterval(timer);
  }, [messages, purgeExpired]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [visible.length]);

  useEffect(() => {
    if (!emojiOpen) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (emojiPanelRef.current?.contains(target)) return;
      if ((event.target as HTMLElement | null)?.closest?.('[data-choir-emoji-toggle]')) return;
      setEmojiOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [emojiOpen]);

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) {
      setDraft((prev) => (prev + emoji).slice(0, 2000));
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`.slice(0, 2000);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = Math.min(start + emoji.length, next.length);
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError(null);
    const result = await onSend(text);
    setSending(false);
    if (!result.ok) {
      setSendError(result.error ?? 'Could not send message.');
      return;
    }
    setDraft('');
  };

  const mePhoto = currentMember?.photoUrl ?? '';

  return (
    <div className="choir-chat-surface website-light-surface font-apple flex h-[min(72vh,720px)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-[#e5ddd5] text-[#111b21] shadow-[0_12px_40px_rgba(0,0,0,0.08)] lg:h-[min(78vh,780px)]">
      <header className="flex items-center gap-3 border-b border-black/10 bg-[#075e54] px-4 py-3 !text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-[13px] font-semibold !text-white">
          {initials(parishName || 'Choir')}
        </div>
        <div className="min-w-0 flex-1 !text-white">
          <h2 className="truncate text-[16px] font-semibold tracking-[-0.02em] !text-white">Choir group</h2>
          <p className="truncate text-[12px] !text-white/80">
            {parishName || 'Parish choir'} · messages vanish after 24 hours
            {isLive ? ' · live' : ''}
          </p>
        </div>
      </header>

      <div
        className="relative flex-1 space-y-2 overflow-y-auto px-3 py-4 text-[#111b21] sm:px-4"
        style={{
          backgroundImage:
            'linear-gradient(rgba(229,221,213,0.92), rgba(229,221,213,0.92)), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23c4b8a8\' fill-opacity=\'0.35\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      >
        {visible.length === 0 ? (
          <div className="choir-chat-empty mx-auto mt-10 max-w-sm rounded-xl bg-white px-4 py-3 text-center text-[13px] font-medium text-[#1f2937] shadow-sm">
            No messages yet. Say hello to your choir — chats auto-delete after one day.
          </div>
        ) : (
          visible.map((message) => {
            const mine = message.senderId === currentUserId;
            const member = memberById.get(message.senderId);
            const photo = member?.photoUrl || message.senderPhotoUrl;
            const name = member
              ? `${member.firstName} ${member.lastName}`.trim()
              : message.senderName;
            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
              >
                {!mine && <Avatar name={name} photoUrl={photo} size="sm" />}
                <div
                  className={
                    'choir-chat-bubble max-w-[min(78%,28rem)] rounded-2xl px-3 py-2 text-[#111b21] shadow-sm ' +
                    (mine
                      ? 'rounded-br-md bg-[#dcf8c6]'
                      : 'rounded-bl-md bg-white')
                  }
                >
                  {!mine && (
                    <p className="choir-chat-bubble-name mb-0.5 text-[12px] font-semibold text-[#075e54]">{name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words text-[14.5px] leading-snug text-[#111b21]">
                    {message.text}
                  </p>
                  <p className={`choir-chat-bubble-time mt-1 text-[10px] text-[#667781] ${mine ? 'text-right' : ''}`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
                {mine && <Avatar name={name || 'You'} photoUrl={mePhoto || photo} size="sm" />}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {(syncError || sendError) && (
        <p className="bg-[#fff3cd] px-4 py-2 text-[12px] text-[#856404]">
          {sendError || syncError}
        </p>
      )}

      <footer className="relative border-t border-black/10 bg-[#f0f2f5] px-3 py-2.5">
        {emojiOpen && (
          <div
            ref={emojiPanelRef}
            className="absolute bottom-full left-2 right-2 z-20 mb-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:left-auto sm:right-14 sm:w-[min(22rem,calc(100vw-2rem))]"
            role="dialog"
            aria-label="Emoji picker"
          >
            <div className="flex gap-1 overflow-x-auto border-b border-black/6 px-2 py-2">
              {CHAT_EMOJI_GROUPS.map((group, index) => (
                <button
                  key={group.label}
                  type="button"
                  onClick={() => setEmojiGroup(index)}
                  className={
                    'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ' +
                    (emojiGroup === index
                      ? 'bg-[#128c7e] text-white'
                      : 'bg-[#f0f2f5] text-[#3a3a3c] hover:bg-[#e5e7eb]')
                  }
                >
                  {group.label}
                </button>
              ))}
            </div>
            <div className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto p-2 sm:grid-cols-10">
              {(CHAT_EMOJI_GROUPS[emojiGroup]?.emojis ?? []).map((emoji) => (
                <button
                  key={`${emojiGroup}-${emoji}`}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="flex h-9 w-full items-center justify-center rounded-lg text-[20px] transition hover:bg-[#f0f2f5] active:scale-95"
                  aria-label={`Insert ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Avatar
            name={
              currentMember
                ? `${currentMember.firstName} ${currentMember.lastName}`.trim()
                : 'You'
            }
            photoUrl={mePhoto}
          />
          <label className="sr-only" htmlFor="choir-chat-input">
            Message
          </label>
          <div className="relative flex min-h-[44px] flex-1 items-end rounded-2xl bg-white ring-1 ring-black/5">
            <button
              type="button"
              data-choir-emoji-toggle
              onClick={() => setEmojiOpen((open) => !open)}
              className={
                'mb-1 ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ' +
                (emojiOpen ? 'bg-[#d1f4ee] text-[#075e54]' : 'text-[#667781] hover:bg-[#f0f2f5]')
              }
              aria-label="Add emoji"
              aria-expanded={emojiOpen}
            >
              <SmilePlus className="h-5 w-5" />
            </button>
            <textarea
              id="choir-chat-input"
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={2000}
              placeholder="Type a message"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  setEmojiOpen(false);
                  void handleSend();
                }
              }}
              className="choir-chat-input max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border-0 bg-transparent py-2.5 pr-3 pl-1 text-[15px] text-[#111b21] outline-none placeholder:text-[#667781]"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setEmojiOpen(false);
              void handleSend();
            }}
            disabled={!draft.trim() || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#128c7e] text-white transition enabled:hover:bg-[#0e7a6e] enabled:active:scale-95 disabled:opacity-40"
            aria-label="Send message"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChoirGroupChat;
