'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { useT, notifContent } from '@/lib/i18n';
import { getSocket, usePresence } from '@/lib/realtime';

export default function NotificationBell() {
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

  const loadList = () =>
    api.notifications
      .list()
      .then((l: any) => setItems(Array.isArray(l) ? l : []))
      .catch(() => {});

  useEffect(() => {
    loadCount();
    const id = setInterval(loadCount, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    openRef.current = open;
    if (open) loadList();
  }, [open]);

  // Notifications en direct (WebSocket).
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

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('notif.title')}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-gaming-surface transition-colors"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-gaming-border bg-gaming-card shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gaming-border sticky top-0 bg-gaming-card">
            <span className="text-sm font-semibold text-white">{t('notif.title')}</span>
            {items.some((i) => !i.read) && (
              <button onClick={markAll} className="text-xs text-neon-blue hover:underline">
                {t('notif.markAllRead')}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">{t('notif.none')}</div>
          ) : (
            <ul>
              {items.map((n) => {
                const { title, message } = notifContent(n, t);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={`w-full text-left px-4 py-3 border-b border-gaming-border/50 hover:bg-gaming-surface transition-colors ${
                        !n.read ? 'bg-neon-blue/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-neon-blue shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{title}</p>
                          {message && <p className="text-xs text-gray-400 mt-0.5">{message}</p>}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
