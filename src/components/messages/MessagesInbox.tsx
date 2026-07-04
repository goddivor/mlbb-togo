'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, MessageSquare, Shield, Search } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { getSocket, usePresence } from '@/lib/realtime';
import { useAuthStore } from '@/store/useStore';
import toast from 'react-hot-toast';

const initialOf = (o: any): string =>
  (o?.displayName || o?.username || '?').trim().charAt(0).toUpperCase() || '?';

const nameOf = (o: any): string => o?.displayName || o?.username || '';

const isStaff = (role?: string): boolean =>
  role === 'admin' || role === 'moderator';

export default function MessagesInbox() {
  const t = useT();
  const [threads, setThreads] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const myId = useAuthStore((s: any) => s.user?.id);
  const online = usePresence((s) => s.online);
  const connected = usePresence((s) => s.connected);
  const activeIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadThreads();
      setLoading(false);
    })();
  }, [loadThreads]);

  const openThread = useCallback(
    async (id: string) => {
      setActiveId(id);
      setThread(null);
      try {
        const data: any = await api.messages.thread(id);
        setThread(data);
        scrollToBottom();
      } catch (e: any) {
        toast.error(e?.message || t('common.error'));
      }
    },
    [scrollToBottom, t],
  );

  const send = useCallback(async () => {
    const body = text.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    try {
      const updated: any = await api.messages.reply(activeId, body);
      setThread(updated);
      setText('');
      scrollToBottom();
      loadThreads();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setSending(false);
    }
  }, [text, activeId, sending, scrollToBottom, loadThreads, t]);

  // Live message reception (WebSocket).
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onMsg = (payload: any) => {
      const threadId = payload?.threadId;
      const message = payload?.message;
      if (!threadId || !message) return;

      if (threadId === activeIdRef.current) {
        setThread((prev: any) => {
          if (!prev) return prev;
          if ((prev.messages || []).some((m: any) => m.id === message.id)) return prev;
          return {
            ...prev,
            messages: [
              ...(prev.messages || []),
              { ...message, mine: message.senderId === myId },
            ],
          };
        });
        scrollToBottom();
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
        return [{ ...th, lastMessage: preview, lastMessageAt: message.createdAt }, ...copy];
      });
    };
    s.on('message:new', onMsg);
    return () => {
      s.off('message:new', onMsg);
    };
  }, [connected, myId, scrollToBottom, loadThreads]);

  const other = thread?.other;

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

  const fmtTime = (v: any) => {
    const d = new Date(v);
    return isNaN(d.getTime())
      ? ''
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-186px)] overflow-hidden sm:h-[calc(100vh-174px)]">
      <div className="h-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark xl:flex">
        {/* Left column: conversation list */}
        <div
          className={`${
            activeId ? 'hidden' : 'flex'
          } h-full flex-col xl:flex xl:w-1/4`}
        >
          <div className="sticky border-b border-stroke px-6 py-7.5 dark:border-strokedark">
            <h3 className="text-lg font-medium text-black dark:text-white 2xl:text-xl">
              Conversations
              <span className="rounded-md border-[.5px] border-stroke bg-gray-2 px-2 py-0.5 text-base font-medium text-black dark:border-strokedark dark:bg-boxdark-2 dark:text-white 2xl:ml-4">
                {threads.length}
              </span>
            </h3>
          </div>

          <div className="flex max-h-full flex-col overflow-auto p-5">
            {/* Search */}
            <form className="sticky mb-7" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded border border-stroke bg-gray-2 py-2.5 pl-5 pr-10 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
                  placeholder="Rechercher..."
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-bodydark2">
                  <Search size={18} />
                </span>
              </div>
            </form>

            {/* Thread list */}
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-stroke border-t-primary dark:border-strokedark dark:border-t-primary" />
              </div>
            ) : visibleThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-bodydark2">
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
                      className={`flex cursor-pointer items-center rounded px-4 py-2 hover:bg-gray-2 dark:hover:bg-strokedark ${
                        active ? 'bg-gray-2 dark:bg-strokedark' : ''
                      }`}
                    >
                      <div className="relative mr-3.5 h-11 w-11 rounded-full">
                        {o?.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarSrc(o.avatar, 64)}
                            alt={nameOf(o)}
                            referrerPolicy="no-referrer"
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                            {initialOf(o)}
                          </div>
                        )}
                        {o?.id && online.has(o.id) && (
                          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-gray-2 bg-success" />
                        )}
                      </div>
                      <div className="w-full min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="truncate text-sm font-medium text-black dark:text-white">
                            {nameOf(o) || th.subject || ''}
                          </h5>
                          {isStaff(o?.roleUser) && (
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-meta-5/10 px-1 py-0.5 text-[9px] font-bold uppercase text-meta-5">
                              <Shield size={9} /> {o.roleUser}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-sm font-medium text-body dark:text-bodydark">
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
            activeId ? 'flex' : 'hidden'
          } h-full flex-col border-l border-stroke dark:border-strokedark xl:flex xl:w-3/4`}
        >
          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-bodydark2">
              <MessageSquare size={32} className="opacity-50" />
              {t('messages.empty')}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="sticky flex items-center justify-between border-b border-stroke px-6 py-4.5 dark:border-strokedark">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(null);
                      setThread(null);
                    }}
                    className="mr-3 rounded-md p-1.5 text-body hover:bg-gray-2 dark:text-bodydark dark:hover:bg-meta-4 xl:hidden"
                    aria-label={t('messages.title')}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="relative mr-4.5 h-13 w-13 rounded-full">
                    {other?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc(other.avatar, 64)}
                        alt={nameOf(other)}
                        referrerPolicy="no-referrer"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-base font-bold text-white">
                        {initialOf(other)}
                      </div>
                    )}
                    {other?.id && online.has(other.id) && (
                      <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white bg-success dark:border-boxdark" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="truncate font-medium text-black dark:text-white">
                      {nameOf(other) || thread?.subject || ''}
                    </h5>
                    <p className="text-sm font-medium text-body dark:text-bodydark">
                      Répondre au message
                    </p>
                  </div>
                </div>
              </div>

              {/* Message thread */}
              <div
                ref={scrollRef}
                className="no-scrollbar max-h-full flex-1 space-y-3.5 overflow-auto px-6 py-7.5"
              >
                {!thread ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-stroke border-t-primary dark:border-strokedark dark:border-t-primary" />
                  </div>
                ) : (
                  (thread.messages || []).map((m: any) =>
                    m.mine ? (
                      // Sent message
                      <div key={m.id} className="ml-auto max-w-[31.25rem]">
                        <div className="mb-2.5 rounded-2xl rounded-br-none bg-primary px-5 py-3">
                          <p className="whitespace-pre-wrap break-words font-medium text-white">
                            {m.body}
                          </p>
                        </div>
                        <p className="text-right text-xs font-medium text-body dark:text-bodydark">
                          {fmtTime(m.createdAt)}
                        </p>
                      </div>
                    ) : (
                      // Received message
                      <div key={m.id} className="max-w-[31.25rem]">
                        <p className="mb-2.5 text-sm font-medium text-black dark:text-white">
                          {nameOf(other) || thread?.subject || ''}
                        </p>
                        <div className="mb-2.5 rounded-2xl rounded-tl-none bg-gray px-5 py-3 dark:bg-boxdark-2">
                          <p className="whitespace-pre-wrap break-words font-medium text-black dark:text-white">
                            {m.body}
                          </p>
                        </div>
                        <p className="text-xs font-medium text-body dark:text-bodydark">
                          {fmtTime(m.createdAt)}
                        </p>
                      </div>
                    ),
                  )
                )}
              </div>

              {/* Composer */}
              <div className="sticky bottom-0 border-t border-stroke bg-white px-6 py-5 dark:border-strokedark dark:bg-boxdark">
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
                      className="h-13 w-full rounded-md border border-stroke bg-gray pl-5 pr-19 font-medium text-black placeholder-body outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    aria-label={t('messages.send')}
                    className="flex h-13 w-13 items-center justify-center rounded-md bg-primary text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
