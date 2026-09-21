'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, MessageSquare, Shield, Search, CheckCheck, Clock, Users } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { getSocket, refreshChatUnread, usePresence } from '@/lib/realtime';
import { useAuthStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import RoomView, { RoomAvatar, RoomRef } from './RoomView';

const ROOM_KINDS = ['team', 'tournament', 'draft_team'];
const isRoomPayload = (payload: any) => ROOM_KINDS.includes(payload?.kind);
const roomKey = (r: { kind: string; scopeId: string }) => `${r.kind}:${r.scopeId}`;

const initialOf = (o: any): string =>
  (o?.displayName || o?.username || '?').trim().charAt(0).toUpperCase() || '?';

const nameOf = (o: any): string => o?.displayName || o?.username || '';

const isStaff = (role?: string): boolean =>
  role === 'admin' || role === 'moderator';

export default function MessagesInbox() {
  const t = useT();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  // Group rooms (team / tournament / draft team) the user belongs to.
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<RoomRef | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<any | null>(null);
  // Draft conversation opened from a deep link (?to=) with no existing thread.
  const [draftPeer, setDraftPeer] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const handledToRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const myId = useAuthStore((s: any) => s.user?.id);
  const online = usePresence((s) => s.online);
  const connected = usePresence((s) => s.connected);
  const activeIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  const activeRoomRef = useRef<RoomRef | null>(null);
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const loadThreads = useCallback(async () => {
    try {
      const list: any = await api.messages.threads();
      setThreads(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    }
  }, [t]);

  const loadRooms = useCallback(async () => {
    try {
      const list: any = await api.messages.rooms();
      setRooms(Array.isArray(list) ? list : []);
    } catch {
      /* rooms are optional: keep the previous list */
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadThreads(), loadRooms()]);
      setLoading(false);
    })();
  }, [loadThreads, loadRooms]);

  // Tell the server the peer's messages are read (fire-and-forget); this makes
  // the other party's sent messages show blue read receipts.
  const markRead = useCallback((id: string) => {
    if (id) api.messages.markRead(id).catch(() => {});
  }, []);

  const openRoom = useCallback((room: RoomRef) => {
    setActiveRoom({ kind: room.kind, scopeId: room.scopeId });
    setActiveId(null);
    setThread(null);
    setDraftPeer(null);
  }, []);

  // A room's read cursor moved: clear its badge locally and refresh the header.
  const onRoomRead = useCallback((room: RoomRef) => {
    setRooms((prev) =>
      prev.map((r) => (roomKey(r) === roomKey(room) ? { ...r, unread: 0 } : r)),
    );
    refreshChatUnread(0);
  }, []);

  // A message was posted in the open room: refresh its preview in the list.
  const onRoomMessage = useCallback((room: RoomRef, message: any) => {
    setRooms((prev) => {
      const idx = prev.findIndex((r) => roomKey(r) === roomKey(room));
      if (idx === -1) return prev;
      const copy = [...prev];
      const [r] = copy.splice(idx, 1);
      const preview = {
        body: message?.body,
        senderId: message?.senderId,
        createdAt: message?.createdAt,
        sender: message?.sender ?? null,
      };
      return [{ ...r, lastMessage: preview, lastMessageAt: message?.createdAt, unread: 0 }, ...copy];
    });
  }, []);

  const openThread = useCallback(
    async (id: string) => {
      setActiveRoom(null);
      setDraftPeer(null);
      setActiveId(id);
      setThread(null);
      try {
        const data: any = await api.messages.thread(id);
        setThread(data);
        scrollToBottom();
        markRead(id);
      } catch (e: any) {
        toast.error(e?.message || t('common.error'));
      }
    },
    [scrollToBottom, markRead, t],
  );

  // Deep link: /messages?room=<kind>:<scopeId> (e.g. from a mention notification).
  useEffect(() => {
    const room = searchParams.get('room');
    if (!room || loading || handledToRef.current) return;
    const [kind, scopeId] = room.split(':');
    if (!ROOM_KINDS.includes(kind) || !scopeId) return;
    handledToRef.current = true;
    openRoom({ kind, scopeId });
    router.replace('/dashboard/messages');
  }, [searchParams, loading, openRoom, router]);

  // Deep link: /messages?to=<userId>&name=<name>. Open the existing thread with
  // that user, or start a draft conversation when none exists yet.
  useEffect(() => {
    const to = searchParams.get('to');
    if (!to || loading || handledToRef.current) return;
    handledToRef.current = true;
    setActiveRoom(null);
    const existing = threads.find((th) => th.other?.id === to);
    if (existing) {
      openThread(existing.id);
    } else {
      setDraftPeer({ id: to, name: searchParams.get('name') || '' });
      setActiveId(null);
      setThread(null);
    }
    router.replace('/dashboard/messages');
  }, [searchParams, loading, threads, openThread, router]);

  const send = useCallback(async () => {
    const body = text.trim();
    if (!body) return;

    // Optimistic message shown instantly with a "pending" (clock) state.
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimistic = {
      id: tempId,
      body,
      senderId: myId,
      mine: true,
      readAt: null,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setText('');

    // First message of a draft conversation: create the thread.
    if (!activeId && draftPeer) {
      setThread({
        id: null,
        other: { id: draftPeer.id, displayName: draftPeer.name },
        messages: [optimistic],
      });
      scrollToBottom();
      try {
        const created: any = await api.messages.startThread({ userId: draftPeer.id, body });
        setThread(created);
        setActiveId(created?.id ?? null);
        setDraftPeer(null);
        loadThreads();
      } catch (e: any) {
        setThread((prev: any) =>
          prev
            ? { ...prev, messages: (prev.messages || []).map((m: any) => (m.id === tempId ? { ...m, status: 'failed' } : m)) }
            : prev,
        );
        toast.error(e?.message || t('common.error'));
      }
      return;
    }

    if (!activeId) return;
    const currentId = activeId;
    setThread((prev: any) => (prev ? { ...prev, messages: [...(prev.messages || []), optimistic] } : prev));
    scrollToBottom();
    try {
      const updated: any = await api.messages.reply(currentId, body);
      // Swap the optimistic list for the authoritative one (correct ids + ticks).
      setThread((prev: any) => (prev && prev.id === updated.id ? updated : prev));
      loadThreads();
    } catch (e: any) {
      setThread((prev: any) =>
        prev
          ? { ...prev, messages: (prev.messages || []).map((m: any) => (m.id === tempId ? { ...m, status: 'failed' } : m)) }
          : prev,
      );
      toast.error(e?.message || t('common.error'));
    }
  }, [text, activeId, draftPeer, myId, scrollToBottom, loadThreads, t]);

  // Live message reception (WebSocket).
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onMsg = (payload: any) => {
      const threadId = payload?.threadId;
      const message = payload?.message;
      if (!threadId || !message) return;

      // Group room message: update the room row (preview + unread badge). The
      // open room appends the message itself (RoomView).
      if (isRoomPayload(payload)) {
        const key = `${payload.kind}:${payload.scopeId}`;
        const current = activeRoomRef.current;
        const isOpen = !!current && roomKey(current) === key;
        setRooms((prev) => {
          const idx = prev.findIndex((r) => roomKey(r) === key);
          if (idx === -1) {
            loadRooms();
            return prev;
          }
          const copy = [...prev];
          const [r] = copy.splice(idx, 1);
          const preview = {
            body: message.body,
            senderId: message.senderId,
            createdAt: message.createdAt,
            sender: message.sender ?? null,
          };
          const unread =
            message.senderId === myId || (isOpen && document.hasFocus())
              ? 0
              : (r.unread || 0) + 1;
          return [{ ...r, lastMessage: preview, lastMessageAt: message.createdAt, unread }, ...copy];
        });
        return;
      }

      // Ignore my own echo — outgoing messages are shown optimistically.
      if (message.senderId === myId) return;

      if (threadId === activeIdRef.current) {
        setThread((prev: any) => {
          if (!prev) return prev;
          if ((prev.messages || []).some((m: any) => m.id === message.id)) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), { ...message, mine: false }],
          };
        });
        scrollToBottom();
        // I'm looking at this thread → mark read so the sender sees blue ticks.
        markRead(threadId);
      }

      setThreads((prev: any[]) => {
        const idx = prev.findIndex((th) => th.id === threadId);
        const preview = {
          body: message.body,
          senderId: message.senderId,
          createdAt: message.createdAt,
        };
        if (idx === -1) {
          loadThreads();
          return prev;
        }
        const copy = [...prev];
        const [th] = copy.splice(idx, 1);
        const unread = threadId === activeIdRef.current ? 0 : (th.unread || 0) + 1;
        return [{ ...th, lastMessage: preview, lastMessageAt: message.createdAt, unread }, ...copy];
      });
    };

    // Read receipts: the peer read the thread → turn my sent ticks blue.
    const onRead = (payload: any) => {
      const { threadId, readAt } = payload || {};
      if (!threadId || threadId !== activeIdRef.current) return;
      setThread((prev: any) =>
        prev
          ? {
              ...prev,
              messages: (prev.messages || []).map((m: any) =>
                m.mine && !m.readAt ? { ...m, readAt: readAt || new Date().toISOString() } : m,
              ),
            }
          : prev,
      );
    };

    s.on('message:new', onMsg);
    s.on('message:read', onRead);
    return () => {
      s.off('message:new', onMsg);
      s.off('message:read', onRead);
    };
  }, [connected, myId, scrollToBottom, loadThreads, loadRooms, markRead]);

  // Opening a direct thread clears its unread badge in the list.
  useEffect(() => {
    if (!activeId) return;
    setThreads((prev) =>
      prev.map((th) => (th.id === activeId && th.unread ? { ...th, unread: 0 } : th)),
    );
  }, [activeId]);

  const other = thread?.other;
  // Peer shown in the conversation header: the thread's peer, or the draft target.
  const headerPeer = other ?? (draftPeer ? { id: draftPeer.id, displayName: draftPeer.name } : null);
  // Right panel is open for an active thread, a draft conversation or a room.
  const panelOpen = !!activeId || !!draftPeer || !!activeRoom;

  // Client-side filter of the thread list (search box).
  const q = search.trim().toLowerCase();
  const visibleThreads = q
    ? threads.filter((th) => {
        const o = th.other;
        return (
          nameOf(o).toLowerCase().includes(q) ||
          (th.subject || '').toLowerCase().includes(q) ||
          (th.lastMessage?.body || '').toLowerCase().includes(q)
        );
      })
    : threads;
  const visibleRooms = q
    ? rooms.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(q) ||
          (r.lastMessage?.body || '').toLowerCase().includes(q),
      )
    : rooms;
  const roomsUnread = rooms.reduce((n, r) => n + (r.unread || 0), 0);
  const threadsUnread = threads.reduce((n, th) => n + (th.unread || 0), 0);

  const closePanel = () => {
    setActiveId(null);
    setThread(null);
    setDraftPeer(null);
    setActiveRoom(null);
  };

  const fmtTime = (v: any) => {
    const d = new Date(v);
    return isNaN(d.getTime())
      ? ''
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // WhatsApp-style delivery ticks for my own messages.
  const renderTicks = (m: any) => {
    if (m.status === 'pending') return <Clock size={13} className="opacity-70" />;
    if (m.status === 'failed')
      return <span className="text-[11px] font-bold text-accent-red">!</span>;
    if (m.readAt) return <CheckCheck size={15} className="text-primary" />;
    return <CheckCheck size={15} className="opacity-60" />;
  };

  return (
    <div className="h-[calc(100vh-250px)] min-h-[480px] overflow-hidden sm:h-[calc(100vh-236px)]">
      <div className="h-full overflow-hidden rounded-lg border border-line-subtle bg-surface-1 shadow-elev-1 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1 xl:flex">
        {/* Left column: conversation list */}
        <div
          className={`${
            panelOpen ? 'hidden' : 'flex'
          } h-full flex-col xl:flex xl:w-1/4`}
        >
          <div className="sticky border-b border-line-subtle px-6 py-5">
            <h3 className="flex items-center gap-3 font-display text-lg font-bold tracking-tight2 text-ink-1">
              {t('messages.conversations')}
              <span className="rounded bg-surface-3 px-2 py-0.5 num text-xs font-semibold text-ink-2">
                {threads.length + rooms.length}
              </span>
            </h3>
          </div>

          <div className="flex max-h-full flex-col overflow-auto p-5">
            {/* Search */}
            <form className="sticky mb-5" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded border border-line-strong bg-surface-1 py-2.5 pl-4 pr-10 text-sm text-ink-1 outline-none transition-[border-color,box-shadow] duration-base placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
                  placeholder={t('messages.search')}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3">
                  <Search size={18} />
                </span>
              </div>
            </form>

            {/* Rooms (team / tournament) */}
            {!loading && (
              <div className="mb-5">
                <h4 className="eyebrow mb-2 flex items-center gap-2 px-3 !text-ink-3">
                  <Users size={13} />
                  {t('messages.rooms')}
                  {roomsUnread > 0 && (
                    <span className="ml-auto rounded bg-primary px-1.5 py-0.5 num text-[10px] font-bold leading-none text-on-primary">
                      {roomsUnread}
                    </span>
                  )}
                </h4>
                {visibleRooms.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-ink-3">{t('messages.rooms.none')}</p>
                ) : (
                  <div className="flex flex-col">
                    {visibleRooms.map((r) => {
                      const active = !!activeRoom && roomKey(activeRoom) === roomKey(r);
                      const senderName = nameOf(r.lastMessage?.sender);
                      return (
                        <div
                          key={r.id || roomKey(r)}
                          role="button"
                          tabIndex={0}
                          onClick={() => openRoom(r)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openRoom(r);
                            }
                          }}
                          className={`flex cursor-pointer items-center rounded-md px-3 py-2 transition-colors duration-fast hover:bg-surface-2/70 ${
                            active ? 'bg-primary/10 ring-1 ring-inset ring-primary/30' : ''
                          }`}
                        >
                          <RoomAvatar room={r} className="mr-3.5 h-11 w-11" />
                          <div className="w-full min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h5 className="truncate text-sm font-semibold text-ink-1">
                                {r.title}
                              </h5>
                              <span className="shrink-0 rounded bg-accent-violet/10 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-violet">
                                {t(`messages.room.kind.${r.kind}`)}
                              </span>
                              {r.unread > 0 && (
                                <span className="ml-auto shrink-0 rounded bg-primary px-1.5 py-0.5 num text-[10px] font-bold leading-none text-on-primary">
                                  {r.unread}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-ink-2">
                              {r.lastMessage
                                ? `${senderName ? `${senderName}: ` : ''}${r.lastMessage.body}`
                                : t('messages.room.members', { count: r.memberCount ?? 0 })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Thread list */}
            {!loading && (
              <h4 className="eyebrow mb-2 flex items-center gap-2 px-3 !text-ink-3">
                <MessageSquare size={13} />
                {t('messages.direct')}
                {threadsUnread > 0 && (
                  <span className="ml-auto rounded bg-primary px-1.5 py-0.5 num text-[10px] font-bold leading-none text-on-primary">
                    {threadsUnread}
                  </span>
                )}
              </h4>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-line-strong border-t-primary" />
              </div>
            ) : visibleThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-ink-3">
                <MessageSquare size={28} className="opacity-50" />
                {t('messages.none')}
              </div>
            ) : (
              <div className="flex flex-col">
                {visibleThreads.map((th) => {
                  const o = th.other;
                  const active = th.id === activeId;
                  return (
                    <div
                      key={th.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openThread(th.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openThread(th.id);
                        }
                      }}
                      className={`flex cursor-pointer items-center rounded-md px-3 py-2 transition-colors duration-fast hover:bg-surface-2/70 ${
                        active ? 'bg-primary/10 ring-1 ring-inset ring-primary/30' : ''
                      }`}
                    >
                      <div className="relative mr-3.5 h-11 w-11 shrink-0 rounded-full">
                        {o?.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarSrc(o.avatar, 64)}
                            alt={nameOf(o)}
                            referrerPolicy="no-referrer"
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-accent-cyan to-accent-violet font-display text-sm font-bold text-on-primary">
                            {initialOf(o)}
                          </div>
                        )}
                        {o?.id && online.has(o.id) && (
                          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-surface-1 bg-accent-green" />
                        )}
                      </div>
                      <div className="w-full min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="truncate text-sm font-semibold text-ink-1">
                            {nameOf(o) || th.subject || ''}
                          </h5>
                          {isStaff(o?.roleUser) && (
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-accent-violet/10 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-violet">
                              <Shield size={9} /> {o.roleUser}
                            </span>
                          )}
                          {th.unread > 0 && (
                            <span className="ml-auto shrink-0 rounded bg-primary px-1.5 py-0.5 num text-[10px] font-bold leading-none text-on-primary">
                              {th.unread}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-ink-2">
                          {th.lastMessage?.body || ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: active conversation */}
        <div
          className={`${
            panelOpen ? 'flex' : 'hidden'
          } h-full flex-col border-l border-line-subtle xl:flex xl:w-3/4`}
        >
          {!panelOpen ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-ink-3">
              <span className="flex h-16 w-16 items-center justify-center rounded cut-corners bg-surface-2 ring-1 ring-inset ring-line-subtle">
                <MessageSquare size={28} className="opacity-70" />
              </span>
              {t('messages.empty')}
            </div>
          ) : activeRoom ? (
            <RoomView
              key={roomKey(activeRoom)}
              room={activeRoom}
              myId={myId}
              onBack={closePanel}
              onRead={onRoomRead}
              onMessage={onRoomMessage}
            />
          ) : (
            <>
              {/* Header */}
              <div className="sticky flex items-center justify-between border-b border-line-subtle bg-surface-1/80 px-6 py-4 backdrop-blur">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={closePanel}
                    className="mr-3 rounded p-1.5 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink-1 xl:hidden"
                    aria-label={t('messages.title')}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="relative mr-4.5 h-13 w-13 shrink-0 rounded-full">
                    {headerPeer?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc(headerPeer.avatar, 64)}
                        alt={nameOf(headerPeer)}
                        referrerPolicy="no-referrer"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-accent-cyan to-accent-violet font-display text-base font-bold text-on-primary">
                        {initialOf(headerPeer)}
                      </div>
                    )}
                    {headerPeer?.id && online.has(headerPeer.id) && (
                      <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-surface-1 bg-accent-green" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="truncate font-display font-bold tracking-tight2 text-ink-1">
                      {nameOf(headerPeer) || thread?.subject || ''}
                    </h5>
                    <p className="text-xs text-ink-2">
                      {t('messages.replyTo')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message thread */}
              <div
                ref={scrollRef}
                className="no-scrollbar max-h-full flex-1 space-y-3 overflow-auto px-6 py-6"
              >
                {!thread ? (
                  draftPeer ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-ink-3">
                      <MessageSquare size={28} className="opacity-50" />
                      {t('messages.startWith', { name: draftPeer.name })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line-strong border-t-primary" />
                    </div>
                  )
                ) : (
                  (thread.messages || []).map((m: any) =>
                    m.mine ? (
                      // Sent message
                      <div key={m.id} className="ml-auto max-w-[31.25rem]">
                        <div
                          className={`mb-1.5 rounded-xl rounded-br-sm bg-primary px-4 py-2.5 shadow-elev-1 ${
                            m.status === 'pending' ? 'opacity-80' : ''
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm text-on-primary">
                            {m.body}
                          </p>
                        </div>
                        <div className="flex items-center justify-end gap-1 num text-[11px] text-ink-3">
                          {fmtTime(m.createdAt)}
                          {renderTicks(m)}
                        </div>
                      </div>
                    ) : (
                      // Received message
                      <div key={m.id} className="max-w-[31.25rem]">
                        <p className="mb-1 text-xs font-semibold text-ink-1">
                          {nameOf(other) || thread?.subject || ''}
                        </p>
                        <div className="mb-1.5 rounded-xl rounded-tl-sm border border-line-subtle bg-surface-2 px-4 py-2.5">
                          <p className="whitespace-pre-wrap break-words text-sm text-ink-1">
                            {m.body}
                          </p>
                        </div>
                        <p className="num text-[11px] text-ink-3">
                          {fmtTime(m.createdAt)}
                        </p>
                      </div>
                    ),
                  )
                )}
              </div>

              {/* Composer */}
              <div className="sticky bottom-0 border-t border-line-subtle bg-surface-1 px-6 py-4">
                <form
                  className="flex items-center justify-between space-x-4.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={t('messages.placeholder')}
                      className="h-12 w-full rounded border border-line-strong bg-surface-1 pl-4 pr-4 text-sm text-ink-1 outline-none transition-[border-color,box-shadow] duration-base placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    aria-label={t('messages.send')}
                    className="btn-cut flex h-12 w-12 items-center justify-center text-on-primary transition-[box-shadow,filter] duration-base hover:shadow-glow-cyan disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
