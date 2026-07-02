'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, MessageSquare, Shield } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

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

  const other = thread?.other;

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)] min-h-[24rem]">
      {/* Volet gauche : liste des conversations */}
      <div
        className={`${
          activeId ? 'hidden sm:flex' : 'flex'
        } w-full sm:w-72 shrink-0 flex-col rounded-xl border border-gaming-border bg-gaming-surface/40 overflow-hidden`}
      >
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center text-gray-500 text-sm">
              <MessageSquare size={28} className="opacity-50" />
              {t('messages.none')}
            </div>
          ) : (
            <ul className="divide-y divide-gaming-border/60">
              {threads.map((th) => {
                const o = th.other;
                const active = th.id === activeId;
                return (
                  <li key={th.id}>
                    <button
                      type="button"
                      onClick={() => openThread(th.id)}
                      className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                        active
                          ? 'border-l-2 border-neon-blue bg-neon-blue/10'
                          : 'border-l-2 border-transparent hover:bg-gaming-surface/60'
                      }`}
                    >
                      {o?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarSrc(o.avatar, 64)}
                          alt={nameOf(o)}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover shrink-0 bg-gaming-dark"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full shrink-0 bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-sm font-bold text-white">
                          {initialOf(o)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-white truncate">
                            {nameOf(o) || th.subject || ''}
                          </p>
                          {isStaff(o?.roleUser) && (
                            <span className="inline-flex items-center gap-0.5 shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase bg-neon-purple/20 text-neon-purple">
                              <Shield size={9} /> {o.roleUser}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {th.lastMessage?.body || ''}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Volet droit : fil de discussion */}
      <div
        className={`${
          activeId ? 'flex' : 'hidden sm:flex'
        } flex-1 flex-col rounded-xl border border-gaming-border bg-gaming-surface/40 overflow-hidden`}
      >
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-gray-500 text-sm">
            <MessageSquare size={32} className="opacity-50" />
            {t('messages.empty')}
          </div>
        ) : (
          <>
            {/* En-tête */}
            <div className="flex items-center gap-2 p-3 border-b border-gaming-border shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveId(null);
                  setThread(null);
                }}
                className="sm:hidden p-1.5 rounded-lg text-gray-300 hover:bg-gaming-surface/60"
                aria-label={t('messages.title')}
              >
                <ArrowLeft size={18} />
              </button>
              {other?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc(other.avatar, 64)}
                  alt={nameOf(other)}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover shrink-0 bg-gaming-dark"
                />
              ) : (
                <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold text-white">
                  {initialOf(other)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {nameOf(other) || thread?.subject || ''}
                </p>
                {thread?.subject && (
                  <p className="text-xs text-gray-500 truncate">{thread.subject}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {!thread ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-8 h-8 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
                </div>
              ) : (
                (thread.messages || []).map((m: any) => (
                  <div
                    key={m.id}
                    className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                        m.mine
                          ? 'bg-neon-blue/20 text-white'
                          : 'bg-gaming-surface text-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1 text-right">
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Saisie */}
            <div className="flex items-end gap-2 p-3 border-t border-gaming-border shrink-0">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={t('messages.placeholder')}
                className="flex-1 resize-none max-h-32 bg-gaming-surface border border-gaming-border text-gray-200 focus:border-neon-blue focus:outline-none rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={send}
                disabled={sending || !text.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/40 px-3 py-2 text-sm font-medium hover:bg-neon-blue/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                <span className="hidden sm:inline">{t('messages.send')}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
