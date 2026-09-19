'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Send, Users, Shield, Trophy, Swords, AtSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { getSocket, joinRoom, sendTyping, usePresence } from '@/lib/realtime';
import { Avatar } from '@/components/ui';

export interface RoomRef {
  kind: string;
  scopeId: string;
}

interface RoomViewProps {
  room: RoomRef;
  myId?: string;
  /** Mobile: go back to the list. */
  onBack: () => void;
  /** Called after the read cursor moved so the list can clear its badge. */
  onRead?: (room: RoomRef) => void;
  /** Called on every new message (mine included) to refresh the list preview. */
  onMessage?: (room: RoomRef, message: any) => void;
}

const PAGE = 40;
const TYPING_TTL = 3000;

const nameOf = (o: any): string => o?.displayName || o?.username || '';

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Icon used as the room avatar fallback, per room kind. */
export function RoomKindIcon({ kind, size = 18 }: { kind: string; size?: number }) {
  if (kind === 'tournament') return <Trophy size={size} />;
  if (kind === 'draft_team') return <Swords size={size} />;
  return <Shield size={size} />;
}

/** Room avatar: scope image when set, else a kind icon on a coloured disc. */
export function RoomAvatar({ room, className = 'h-11 w-11' }: { room: any; className?: string }) {
  return (
    <div className={`relative shrink-0 rounded-full ${className}`}>
      {room?.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc(room.avatar, 96)}
          alt={room.title || ''}
          referrerPolicy="no-referrer"
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-meta-5/15 text-meta-5 dark:bg-meta-5/20">
          <RoomKindIcon kind={room?.kind} />
        </div>
      )}
    </div>
  );
}

/** Highlights `@username` handles of known members inside a message body. */
function MessageBody({ body, members }: { body: string; members: any[] }) {
  const parts = useMemo(() => {
    const names = new Set(members.map((m) => (m?.username || '').toLowerCase()).filter(Boolean));
    if (!names.size) return [{ text: body, mention: false }];
    const out: { text: string; mention: boolean }[] = [];
    const re = /(^|[^\w@.])(@[\w.-]{2,32})/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(body))) {
      const handle = match[2].replace(/[.-]+$/, '');
      const start = match.index + match[1].length;
      if (!names.has(handle.slice(1).toLowerCase())) continue;
      if (start > last) out.push({ text: body.slice(last, start), mention: false });
      out.push({ text: handle, mention: true });
      last = start + handle.length;
    }
    if (last < body.length) out.push({ text: body.slice(last), mention: false });
    return out;
  }, [body, members]);
  return (
    <>
      {parts.map((p, i) =>
        p.mention ? (
          <span key={i} className="rounded bg-white/20 px-1 font-semibold dark:bg-primary/20">
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

export default function RoomView({ room, myId, onBack, onRead, onMessage }: RoomViewProps) {
  const t = useT();
  const [data, setData] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState('');
  const [membersOpen, setMembersOpen] = useState(false);
  const [typing, setTyping] = useState<Record<string, number>>({});
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const membersRef = useRef<HTMLDivElement | null>(null);
  const lastTypingSentRef = useRef(0);
  const online = usePresence((s) => s.online);
  const connected = usePresence((s) => s.connected);
  const roomKey = `${room.kind}:${room.scopeId}`;
  const threadId: string | null = data?.thread?.id ?? null;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const markRead = useCallback(() => {
    api.messages
      .markRoomRead(room.kind, room.scopeId)
      .then(() => onRead?.(room))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomKey, onRead]);

  // Load the room (header, members, newest page) whenever the target changes.
  useEffect(() => {
    let cancelled = false;
    setData(null);
    setMessages([]);
    setHasMore(false);
    setTyping({});
    setMembersOpen(false);
    setText('');
    (async () => {
      try {
        const res: any = await api.messages.room(room.kind, room.scopeId, { limit: PAGE });
        if (cancelled || !res) return;
        setData(res);
        setMessages(res.messages || []);
        setHasMore(!!res.hasMore);
        scrollToBottom();
        markRead();
        if (res.thread?.id) joinRoom(res.thread.id);
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || t('common.error'));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomKey, scrollToBottom, markRead]);

  // Re-join the socket.io room after a reconnect.
  useEffect(() => {
    if (connected && threadId) joinRoom(threadId);
  }, [connected, threadId]);

  // Move the read cursor when the tab regains focus while the room is open.
  useEffect(() => {
    const onFocus = () => markRead();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [markRead]);

  // Live events for this room: new messages and typing indicators.
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onMsg = (payload: any) => {
      const message = payload?.message;
      if (!message) return;
      if (payload.kind !== room.kind || payload.scopeId !== room.scopeId) return;
      if (message.senderId === myId) return; // shown optimistically
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, { ...message, mine: false }],
      );
      setTyping((prev) => {
        if (!prev[message.senderId]) return prev;
        const next = { ...prev };
        delete next[message.senderId];
        return next;
      });
      scrollToBottom();
      if (document.hasFocus()) markRead();
    };
    const onTyping = (payload: any) => {
      if (!payload?.threadId || payload.threadId !== threadId) return;
      if (!payload.userId || payload.userId === myId) return;
      setTyping((prev) => {
        const next = { ...prev };
        if (payload.typing === false) delete next[payload.userId];
        else next[payload.userId] = Date.now();
        return next;
      });
    };
    s.on('message:new', onMsg);
    s.on('room:typing', onTyping);
    return () => {
      s.off('message:new', onMsg);
      s.off('room:typing', onTyping);
    };
  }, [connected, room.kind, room.scopeId, threadId, myId, scrollToBottom, markRead]);

  // Expire stale typing indicators.
  useEffect(() => {
    const ids = Object.keys(typing);
    if (!ids.length) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setTyping((prev) => {
        const next: Record<string, number> = {};
        let changed = false;
        for (const [id, at] of Object.entries(prev)) {
          if (now - at < TYPING_TTL) next[id] = at;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [typing]);

  // Close the members popover on outside click.
  useEffect(() => {
    if (!membersOpen) return;
    const onDown = (e: MouseEvent) => {
      if (membersRef.current && !membersRef.current.contains(e.target as Node))
        setMembersOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [membersOpen]);

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore || !messages.length) return;
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    setLoadingOlder(true);
    try {
      const res: any = await api.messages.room(room.kind, room.scopeId, {
        before: messages[0].createdAt,
        limit: PAGE,
      });
      const older: any[] = res?.messages || [];
      setHasMore(!!res?.hasMore);
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        return [...older.filter((m) => !known.has(m.id)), ...prev];
      });
      // Keep the viewport anchored on the message that was at the top.
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasMore, messages, room.kind, room.scopeId, t]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el && el.scrollTop < 40) void loadOlder();
  }, [loadOlder]);

  const members: any[] = useMemo(() => data?.members || [], [data]);

  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return members
      .filter((m) => m?.id !== myId && m?.username)
      .filter(
        (m) =>
          !q ||
          m.username.toLowerCase().includes(q) ||
          (m.displayName || '').toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [mentionQuery, members, myId]);

  /** Detect an "@handle" being typed right before the caret. */
  const updateMentionQuery = useCallback((value: string, caret: number) => {
    const before = value.slice(0, caret);
    const match = /(^|\s)@([\w.-]*)$/.exec(before);
    setMentionQuery(match ? match[2] : null);
    setMentionIndex(0);
  }, []);

  const applyMention = useCallback(
    (member: any) => {
      const input = inputRef.current;
      const caret = input?.selectionStart ?? text.length;
      const before = text.slice(0, caret).replace(/@[\w.-]*$/, `@${member.username} `);
      const next = before + text.slice(caret);
      setText(next);
      setMentionQuery(null);
      requestAnimationFrame(() => {
        input?.focus();
        input?.setSelectionRange(before.length, before.length);
      });
    },
    [text],
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);
    updateMentionQuery(value, e.target.selectionStart ?? value.length);
    if (threadId && value.trim()) {
      const now = Date.now();
      if (now - lastTypingSentRef.current > 1500) {
        lastTypingSentRef.current = now;
        sendTyping(threadId, true);
      }
    }
  };

  const send = useCallback(async () => {
    const body = text.trim();
    if (!body) return;
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const me = members.find((m) => m?.id === myId) ?? null;
    const optimistic = {
      id: tempId,
      body,
      senderId: myId,
      mine: true,
      sender: me,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setText('');
    setMentionQuery(null);
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();
    if (threadId) sendTyping(threadId, false);
    try {
      const res: any = await api.messages.postRoom(room.kind, room.scopeId, body);
      const message = res?.message;
      if (message)
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...message, mine: true } : m)));
      onMessage?.(room, message ?? optimistic);
    } catch (e: any) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)));
      toast.error(e?.message || t('common.error'));
    }
  }, [text, members, myId, threadId, room, scrollToBottom, onMessage, t]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionQuery !== null && mentionCandidates.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionCandidates.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionCandidates.length) % mentionCandidates.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyMention(mentionCandidates[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        return;
      }
    }
  };

  const fmtTime = (v: any) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const dayLabel = (d: Date) => {
    const now = new Date();
    if (sameDay(d, now)) return t('messages.today');
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameDay(d, yesterday)) return t('messages.yesterday');
    return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const typingNames = Object.keys(typing)
    .map((id) => nameOf(members.find((m) => m?.id === id)))
    .filter(Boolean);

  const thread = data?.thread;
  const memberCount = thread?.memberCount ?? members.length;

  return (
    <>
      {/* Header */}
      <div className="sticky flex items-center justify-between border-b border-stroke px-6 py-4.5 dark:border-strokedark">
        <div className="flex min-w-0 items-center">
          <button
            type="button"
            onClick={onBack}
            className="mr-3 rounded-md p-1.5 text-body hover:bg-gray-2 dark:text-bodydark dark:hover:bg-meta-4 xl:hidden"
            aria-label={t('messages.title')}
          >
            <ArrowLeft size={18} />
          </button>
          <RoomAvatar room={thread ?? room} className="mr-4.5 h-13 w-13" />
          <div className="min-w-0">
            <h5 className="truncate font-medium text-black dark:text-white">
              {thread?.title || t(`messages.room.kind.${room.kind}`)}
            </h5>
            <p className="truncate text-sm font-medium text-body dark:text-bodydark">
              {t(`messages.room.kind.${room.kind}`)}
              {' · '}
              {t('messages.room.members', { count: memberCount })}
            </p>
          </div>
        </div>

        {/* Members popover */}
        <div className="relative shrink-0" ref={membersRef}>
          <button
            type="button"
            onClick={() => setMembersOpen((o) => !o)}
            aria-label={t('messages.room.membersTitle')}
            aria-expanded={membersOpen}
            className="flex items-center gap-1 rounded-md border border-stroke px-2.5 py-1.5 text-sm text-body hover:bg-gray-2 dark:border-strokedark dark:text-bodydark dark:hover:bg-meta-4"
          >
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((m) => (
                <Avatar
                  key={m.id}
                  name={nameOf(m)}
                  src={m?.avatar ? avatarSrc(m.avatar, 48) : undefined}
                  size="sm"
                  className="rounded-full ring-2 ring-white dark:ring-boxdark"
                />
              ))}
            </div>
            <Users size={16} className="ml-1" />
            <span className="hidden sm:inline">{memberCount}</span>
          </button>
          {membersOpen && (
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke px-4 py-2.5 text-sm font-medium text-black dark:border-strokedark dark:text-white">
                {t('messages.room.membersTitle')} ({memberCount})
              </div>
              <ul className="max-h-72 overflow-y-auto py-1">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-2">
                    <Avatar
                      name={nameOf(m)}
                      src={m?.avatar ? avatarSrc(m.avatar, 48) : undefined}
                      size="sm"
                      online={online.has(m.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-black dark:text-white">
                        {nameOf(m)}
                        {m.id === myId && (
                          <span className="ml-1 text-xs text-body dark:text-bodydark">
                            ({t('messages.room.you')})
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-body dark:text-bodydark">@{m.username}</p>
                    </div>
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        online.has(m.id) ? 'bg-success' : 'bg-bodydark2/40'
                      }`}
                      title={online.has(m.id) ? t('messages.room.online') : t('messages.room.offline')}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="no-scrollbar max-h-full flex-1 space-y-3.5 overflow-auto px-6 py-7.5"
      >
        {!data ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stroke border-t-primary dark:border-strokedark dark:border-t-primary" />
          </div>
        ) : (
          <>
            {loadingOlder && (
              <div className="flex justify-center py-1">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-stroke border-t-primary dark:border-strokedark" />
              </div>
            )}
            {!loadingOlder && hasMore && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadOlder()}
                  className="rounded-full border border-stroke px-3 py-1 text-xs text-body hover:bg-gray-2 dark:border-strokedark dark:text-bodydark dark:hover:bg-meta-4"
                >
                  {t('messages.room.loadOlder')}
                </button>
              </div>
            )}
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-bodydark2">
                <AtSign size={28} className="opacity-50" />
                {t('messages.room.empty')}
              </div>
            )}
            {messages.map((m, i) => {
              const date = new Date(m.createdAt);
              const prev = i > 0 ? new Date(messages[i - 1].createdAt) : null;
              const showDay = !prev || !sameDay(prev, date);
              const sender = m.sender ?? members.find((x) => x?.id === m.senderId) ?? null;
              const mine = m.mine || m.senderId === myId;
              return (
                <div key={m.id}>
                  {showDay && (
                    <div className="my-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-stroke dark:bg-strokedark" />
                      <span className="rounded-full bg-gray-2 px-3 py-0.5 text-xs font-medium text-body dark:bg-boxdark-2 dark:text-bodydark">
                        {dayLabel(date)}
                      </span>
                      <div className="h-px flex-1 bg-stroke dark:bg-strokedark" />
                    </div>
                  )}
                  {mine ? (
                    <div className="ml-auto max-w-[31.25rem]">
                      <div
                        className={`mb-1.5 rounded-2xl rounded-br-none bg-primary px-5 py-3 ${
                          m.status === 'pending' ? 'opacity-80' : ''
                        } ${m.status === 'failed' ? 'ring-2 ring-danger' : ''}`}
                      >
                        <p className="whitespace-pre-wrap break-words font-medium text-white">
                          <MessageBody body={m.body} members={members} />
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-1 text-xs font-medium text-body dark:text-bodydark">
                        {m.status === 'failed' ? (
                          <span className="font-bold text-danger">{t('messages.room.failed')}</span>
                        ) : (
                          fmtTime(m.createdAt)
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex max-w-[31.25rem] items-end gap-2.5">
                      <Avatar
                        name={nameOf(sender) || '?'}
                        src={sender?.avatar ? avatarSrc(sender.avatar, 48) : undefined}
                        size="sm"
                        className="mb-5 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="mb-1 text-sm font-medium text-black dark:text-white">
                          {nameOf(sender) || t('messages.room.unknownMember')}
                        </p>
                        <div className="mb-1.5 rounded-2xl rounded-tl-none bg-gray px-5 py-3 dark:bg-boxdark-2">
                          <p className="whitespace-pre-wrap break-words font-medium text-black dark:text-white">
                            <MessageBody body={m.body} members={members} />
                          </p>
                        </div>
                        <p className="text-xs font-medium text-body dark:text-bodydark">
                          {fmtTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-stroke bg-white px-6 py-4 dark:border-strokedark dark:bg-boxdark">
        <p className="mb-1.5 h-4 truncate text-xs italic text-body dark:text-bodydark" aria-live="polite">
          {typingNames.length === 1
            ? t('messages.room.typingOne', { name: typingNames[0] })
            : typingNames.length > 1
              ? t('messages.room.typingMany', { count: typingNames.length })
              : ''}
        </p>
        <form
          className="flex items-center justify-between space-x-4.5"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="relative w-full">
            {mentionQuery !== null && mentionCandidates.length > 0 && (
              <ul
                role="listbox"
                className="absolute bottom-full left-0 z-20 mb-2 w-72 overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
              >
                {mentionCandidates.map((m, i) => (
                  <li
                    key={m.id}
                    role="option"
                    aria-selected={i === mentionIndex}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyMention(m);
                    }}
                    onMouseEnter={() => setMentionIndex(i)}
                    className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
                      i === mentionIndex ? 'bg-gray-2 dark:bg-meta-4' : ''
                    }`}
                  >
                    <Avatar
                      name={nameOf(m)}
                      src={m?.avatar ? avatarSrc(m.avatar, 48) : undefined}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-black dark:text-white">
                        {nameOf(m)}
                      </p>
                      <p className="truncate text-xs text-body dark:text-bodydark">@{m.username}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onFocus={markRead}
              onBlur={() => setMentionQuery(null)}
              placeholder={t('messages.room.placeholder')}
              autoComplete="off"
              className="h-13 w-full rounded-md border border-stroke bg-gray pl-5 pr-5 font-medium text-black placeholder-body outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={!text.trim() || !data}
            aria-label={t('messages.send')}
            className="flex h-13 w-13 shrink-0 items-center justify-center rounded-md bg-primary text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}
