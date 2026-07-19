import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Loader2, SendHorizontal } from 'lucide-react';
import type { ChoirChatMessage, Member } from '../../types';
import { deleteTenantRecords, isFirebaseConfigured } from '../../services/firebase';
import { expiredChatMessageIds, visibleChatMessages } from '../../utils/choirChat';

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
  const bottomRef = useRef<HTMLDivElement>(null);

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
    <div className="font-apple flex h-[min(72vh,720px)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-[#e5ddd5] shadow-[0_12px_40px_rgba(0,0,0,0.08)] lg:h-[min(78vh,780px)]">
      <header className="flex items-center gap-3 border-b border-black/10 bg-[#075e54] px-4 py-3 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-[13px] font-semibold">
          {initials(parishName || 'Choir')}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[16px] font-semibold tracking-[-0.02em]">Choir group</h2>
          <p className="truncate text-[12px] text-white/75">
            {parishName || 'Parish choir'} · messages vanish after 24 hours
            {isLive ? ' · live' : ''}
          </p>
        </div>
      </header>

      <div
        className="relative flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-4"
        style={{
          backgroundImage:
            'linear-gradient(rgba(229,221,213,0.92), rgba(229,221,213,0.92)), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23c4b8a8\' fill-opacity=\'0.35\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      >
        {visible.length === 0 ? (
          <div className="mx-auto mt-10 max-w-sm rounded-xl bg-white/90 px-4 py-3 text-center text-[13px] text-[#3a3a3c] shadow-sm">
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
                    'max-w-[min(78%,28rem)] rounded-2xl px-3 py-2 shadow-sm ' +
                    (mine
                      ? 'rounded-br-md bg-[#dcf8c6] text-[#111b21]'
                      : 'rounded-bl-md bg-white text-[#111b21]')
                  }
                >
                  {!mine && (
                    <p className="mb-0.5 text-[12px] font-semibold text-[#075e54]">{name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words text-[14.5px] leading-snug">
                    {message.text}
                  </p>
                  <p className={`mt-1 text-[10px] text-[#667781] ${mine ? 'text-right' : ''}`}>
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

      <footer className="flex items-end gap-2 border-t border-black/10 bg-[#f0f2f5] px-3 py-2.5">
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
        <textarea
          id="choir-chat-input"
          rows={1}
          value={draft}
          maxLength={2000}
          placeholder="Type a message"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border-0 bg-white px-4 py-2.5 text-[15px] text-[#111b21] outline-none ring-1 ring-black/5 placeholder:text-[#8696a0]"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!draft.trim() || sending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#128c7e] text-white transition enabled:hover:bg-[#0e7a6e] enabled:active:scale-95 disabled:opacity-40"
          aria-label="Send message"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
        </button>
      </footer>
    </div>
  );
};

export default ChoirGroupChat;
