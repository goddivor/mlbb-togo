'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { timeAgo, truncateText } from '@/lib/helpers';
import { getSocket, useChatUnread, usePresence } from '@/lib/realtime';
import { useAuthStore } from '@/store/useStore';
import { Avatar } from '@/components/ui';
import { RoomAvatar } from '@/components/messages/RoomView';

interface MessageDropdownProps {
  /** Where the icon and every row link to (player: /messages, admin: /admin/messages). */
  href?: string;
}

const nameOf = (o: any): string => o?.displayName || o?.username || '';

/**
 * TailAdmin "Messages" dropdown (see partials/header.html): round icon button
 * with the exact chat SVG plus a red dot on incoming messages, and a dropdown
 * listing the latest threads (avatar, other party's name, truncated last
 * message, relative time). Threads come from `api.messages.threads`; a
 * `message:new` socket event keeps the list and the dot live. Every row and
 * the footer button link to the messages page.
 */
export default function MessageDropdown({ href = '/messages' }: MessageDropdownProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [notifying, setNotifying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const connected = usePresence((s) => s.connected);
  const myId = useAuthStore((s: any) => s.user?.id);
  // Unread total (direct threads + group rooms), kept live by RealtimeProvider.
  const unreadTotal = useChatUnread((s) => s.total);

  const loadThreads = () => {
    api.messages
      .threads()
      .then((l: any) => setThreads(Array.isArray(l) ? l : []))
      .catch(() => {});
    api.messages
      .rooms()
      .then((l: any) => setRooms(Array.isArray(l) ? l : []))
      .catch(() => {});
  };

  // Rooms and threads interleaved by recency; rooms without any message are
  // left out of the dropdown (they still show on the messages page).
  const rows: { key: string; room?: any; thread?: any; at: any }[] = [
    ...rooms
      .filter((r) => r.lastMessage)
      .map((r) => ({ key: `room:${r.id}`, room: r, at: r.lastMessageAt })),
    ...threads.map((th) => ({ key: `thread:${th.id}`, thread: th, at: th.lastMessageAt })),
  ].sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime());

  // Initial load so the dropdown is ready before the first open.
  useEffect(() => {
    loadThreads();
  }, []);

  // Refresh the list each time the dropdown opens and clear the dot.
  useEffect(() => {
    if (open) {
      loadThreads();
      setNotifying(false);
    }
  }, [open]);

  // Live messages (WebSocket): refresh the list and flag the dot.
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onMsg = (payload: any) => {
      // Only flag incoming messages; never my own outgoing ones.
      if (payload?.message?.senderId && payload.message.senderId === myId) {
        loadThreads();
        return;
      }
      setNotifying(true);
      loadThreads();
    };
    s.on('message:new', onMsg);
    return () => {
      s.off('message:new', onMsg);
    };
  }, [connected, myId]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('header.messages')}
        aria-expanded={open}
        className="header-btn"
      >
        {unreadTotal > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 z-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold leading-none text-white num ring-2 ring-surface-1">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        ) : (
          notifying && (
            <span className="absolute right-1.5 top-1.5 z-1 h-2 w-2 rounded-full bg-accent-red">
              <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
            </span>
          )
        )}

        <svg
          className="fill-current"
          width="17"
          height="17"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.9688 1.57495H7.03135C3.43135 1.57495 0.506348 4.41558 0.506348 7.90308C0.506348 11.3906 2.75635 13.8375 8.26885 16.3125C8.40947 16.3687 8.52197 16.3968 8.6626 16.3968C8.85947 16.3968 9.02822 16.3406 9.19697 16.2281C9.47822 16.0593 9.64697 15.75 9.64697 15.4125V14.2031H10.9688C14.5688 14.2031 17.522 11.3625 17.522 7.87495C17.522 4.38745 14.5688 1.57495 10.9688 1.57495ZM10.9688 12.9937H9.3376C8.80322 12.9937 8.35322 13.4437 8.35322 13.9781V15.0187C3.6001 12.825 1.74385 10.8 1.74385 7.9312C1.74385 5.14683 4.10635 2.8687 7.03135 2.8687H10.9688C13.8657 2.8687 16.2563 5.14683 16.2563 7.9312C16.2563 10.7156 13.8657 12.9937 10.9688 12.9937Z"
            fill=""
          />
          <path
            d="M5.42812 7.28442C5.0625 7.28442 4.78125 7.56567 4.78125 7.9313C4.78125 8.29692 5.0625 8.57817 5.42812 8.57817C5.79375 8.57817 6.075 8.29692 6.075 7.9313C6.075 7.56567 5.79375 7.28442 5.42812 7.28442Z"
            fill=""
          />
          <path
            d="M9.00015 7.28442C8.63452 7.28442 8.35327 7.56567 8.35327 7.9313C8.35327 8.29692 8.63452 8.57817 9.00015 8.57817C9.33765 8.57817 9.64702 8.29692 9.64702 7.9313C9.64702 7.56567 9.33765 7.28442 9.00015 7.28442Z"
            fill=""
          />
          <path
            d="M12.5719 7.28442C12.2063 7.28442 11.925 7.56567 11.925 7.9313C11.925 8.29692 12.2063 8.57817 12.5719 8.57817C12.9375 8.57817 13.2188 8.29692 13.2188 7.9313C13.2188 7.56567 12.9094 7.28442 12.5719 7.28442Z"
            fill=""
          />
        </svg>
      </button>

      {open && (
        <div className="header-menu absolute -right-16 mt-2.5 flex h-90 w-80 flex-col overflow-hidden sm:right-0">
          <div className="border-b border-line-subtle px-4 py-2.5">
            <h5 className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('header.messages')}</h5>
          </div>

          <ul className="flex flex-1 flex-col overflow-y-auto">
            {rows.length === 0 ? (
              <li className="flex flex-1 items-center justify-center px-4 py-6 text-center text-sm text-ink-3">
                {t('messages.none')}
              </li>
            ) : (
              rows.map((row) => {
                if (row.room) {
                  const r = row.room;
                  const target = `${href}?room=${r.kind}:${r.scopeId}`;
                  return (
                    <li key={row.key}>
                      <Link
                        href={target}
                        onClick={() => setOpen(false)}
                        className="flex gap-3 border-b border-line-subtle px-4 py-3 transition-colors duration-fast hover:bg-surface-2"
                      >
                        <RoomAvatar room={r} className="h-10 w-10" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h6 className="truncate text-sm font-medium text-ink-1">
                              {r.title}
                            </h6>
                            {r.unread > 0 && (
                              <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-on-primary num">
                                {r.unread}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-sm text-ink-2">
                            {truncateText(
                              `${nameOf(r.lastMessage?.sender) ? `${nameOf(r.lastMessage.sender)}: ` : ''}${r.lastMessage?.body || ''}`,
                              32,
                            )}
                          </p>
                          <p className="text-[11px] text-ink-3 num">{timeAgo(r.lastMessageAt)}</p>
                        </div>
                      </Link>
                    </li>
                  );
                }
                const th = row.thread;
                const o = th.other;
                return (
                  <li key={row.key}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 border-b border-line-subtle px-4 py-3 transition-colors duration-fast hover:bg-surface-2"
                    >
                      <Avatar
                        name={nameOf(o)}
                        src={o?.avatar ? avatarSrc(o.avatar, 64) : undefined}
                        size="md"
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h6 className="truncate text-sm font-medium text-ink-1">
                            {nameOf(o) || th.subject || ''}
                          </h6>
                          {th.unread > 0 && (
                            <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-on-primary num">
                              {th.unread}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-sm text-ink-2">
                          {truncateText(th.lastMessage?.body || '', 32)}
                        </p>
                        <p className="text-[11px] text-ink-3 num">{timeAgo(th.lastMessageAt)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>

          <Link
            href={href}
            onClick={() => setOpen(false)}
            className="border-t border-line-subtle px-4 py-2.5 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            {t('header.viewAllMessages')}
          </Link>
        </div>
      )}
    </div>
  );
}
