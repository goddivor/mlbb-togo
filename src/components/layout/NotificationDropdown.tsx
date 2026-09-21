'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useT, notifContent } from '@/lib/i18n';
import { timeAgo } from '@/lib/helpers';
import { getSocket, usePresence } from '@/lib/realtime';

/**
 * TailAdmin notification bell (see partials/header.html): round icon button
 * with the exact bell SVG plus an animated red dot when there are unread
 * items, and a dropdown listing clickable notifications (title / message /
 * time). Data + realtime logic mirrors the legacy NotificationBell:
 * REST for the initial count/list, `notification:new` socket events to stay
 * live, mark-as-read on open, and navigation to the item link on click.
 */
const DROPDOWN_SIZE = 10;

export default function NotificationDropdown() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const connected = usePresence((s) => s.connected);
  const openRef = useRef(false);

  const loadCount = () =>
    api.notifications
      .unreadCount()
      .then((r: any) => setCount(r?.count || 0))
      .catch(() => {});

  // The dropdown is a preview: ask for the first page only, the full history
  // lives on /notifications.
  const loadList = () =>
    api.notifications
      .list({ limit: DROPDOWN_SIZE })
      .then((r) => setItems(r?.items ?? []))
      .catch(() => {});

  // Initial unread count + periodic refresh.
  useEffect(() => {
    loadCount();
    const id = setInterval(loadCount, 60000);
    return () => clearInterval(id);
  }, []);

  // Load the list whenever the dropdown opens.
  useEffect(() => {
    openRef.current = open;
    if (open) loadList();
  }, [open]);

  // Live notifications (WebSocket).
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onNotif = (n: any) => {
      setCount((c) => c + 1);
      if (openRef.current) setItems((prev) => [n, ...prev]);
    };
    s.on('notification:new', onNotif);
    return () => {
      s.off('notification:new', onNotif);
    };
  }, [connected]);

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

  const openItem = async (n: any) => {
    if (!n.read) {
      try {
        await api.notifications.markRead(n.id);
      } catch {}
      setCount((c) => Math.max(0, c - 1));
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    try {
      await api.notifications.markAllRead();
    } catch {}
    setCount(0);
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
  };

  const notifying = count > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('notif.title')}
        aria-expanded={open}
        className="header-btn"
      >
        {notifying && (
          <span className="absolute right-1.5 top-1.5 z-1 h-2 w-2 rounded-full bg-accent-red">
            <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
          </span>
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
            d="M16.1999 14.9343L15.6374 14.0624C15.5249 13.8937 15.4687 13.7249 15.4687 13.528V7.67803C15.4687 6.01865 14.7655 4.47178 13.4718 3.31865C12.4312 2.39053 11.0812 1.7999 9.64678 1.6874V1.1249C9.64678 0.787402 9.36553 0.478027 8.9999 0.478027C8.6624 0.478027 8.35303 0.759277 8.35303 1.1249V1.65928C8.29678 1.65928 8.24053 1.65928 8.18428 1.6874C4.92178 2.05303 2.4749 4.66865 2.4749 7.79053V13.528C2.44678 13.8093 2.39053 13.9499 2.33428 14.0343L1.7999 14.9343C1.63115 15.2155 1.63115 15.553 1.7999 15.8343C1.96865 16.0874 2.2499 16.2562 2.55928 16.2562H8.38115V16.8749C8.38115 17.2124 8.6624 17.5218 9.02803 17.5218C9.36553 17.5218 9.6749 17.2405 9.6749 16.8749V16.2562H15.4687C15.778 16.2562 16.0593 16.0874 16.228 15.8343C16.3968 15.553 16.3968 15.2155 16.1999 14.9343ZM3.23428 14.9905L3.43115 14.653C3.5999 14.3718 3.68428 14.0343 3.74053 13.6405V7.79053C3.74053 5.31553 5.70928 3.23428 8.3249 2.95303C9.92803 2.78428 11.503 3.2624 12.6562 4.2749C13.6687 5.1749 14.2312 6.38428 14.2312 7.67803V13.528C14.2312 13.9499 14.3437 14.3437 14.5968 14.7374L14.7655 14.9905H3.23428Z"
            fill=""
          />
        </svg>
      </button>

      {open && (
        <div className="header-menu absolute -right-25 mt-2.5 flex h-90 w-80 flex-col overflow-hidden sm:right-0">
          <div className="flex items-center justify-between border-b border-line-subtle px-4 py-2.5">
            <h5 className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('notif.title')}</h5>
            {items.some((i) => !i.read) && (
              <button
                type="button"
                onClick={markAll}
                className="text-xs font-medium text-primary hover:underline"
              >
                {t('notif.markAllRead')}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-4 py-6 text-center text-sm text-ink-3">
              {t('notif.none')}
            </div>
          ) : (
            <ul className="flex h-auto flex-col overflow-y-auto">
              {items.map((n) => {
                const time = timeAgo(n.createdAt);
                const { title, message } = notifContent(n, t);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={`relative flex w-full flex-col gap-1 border-b border-line-subtle px-4 py-3 text-left transition-colors duration-fast hover:bg-surface-2 ${
                        !n.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      {!n.read && <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />}
                      <p className="text-sm text-ink-2">
                        <span className="font-medium text-ink-1">{title}</span>
                        {message ? ` ${message}` : ''}
                      </p>
                      {time && <p className="text-[11px] text-ink-3 num">{time}</p>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="mt-auto border-t border-line-subtle px-4 py-2.5 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            {t('notif.viewAll')}
          </Link>
        </div>
      )}
    </div>
  );
}
