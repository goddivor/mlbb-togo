'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { api, clearApiCache } from '@/lib/api';
import { notifContent, useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { getSocket, usePresence } from '@/lib/realtime';
import { Badge, Button, EmptyState, PageHeader, SectionCard } from '@/components/ui';
import { Bone } from '@/components/dashboard/widgets';

/** Full notification list (the header bell only shows a short dropdown). */
export default function NotificationsPage() {
  const t = useT();
  const router = useRouter();
  const lang = useLangStore((s: any) => s.lang);
  const connected = usePresence((s) => s.connected);
  const [items, setItems] = useState<any[] | null>(null);
  const [error, setError] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const load = () =>
    api.notifications
      .list()
      .then((l: any) => {
        setItems(Array.isArray(l) ? l : []);
        setError(false);
      })
      .catch(() => {
        setItems([]);
        setError(true);
      });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onNotif = (n: any) => setItems((prev) => [n, ...(prev ?? [])]);
    s.on('notification:new', onNotif);
    return () => {
      s.off('notification:new', onNotif);
    };
  }, [connected]);

  const open = async (n: any) => {
    if (!n.read) {
      try {
        await api.notifications.markRead(n.id);
      } catch {
        // Best effort.
      }
      setItems((prev) => (prev ?? []).map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    try {
      await api.notifications.markAllRead();
      clearApiCache();
      setItems((prev) => (prev ?? []).map((x) => ({ ...x, read: true })));
    } catch {
      // Best effort.
    }
  };

  const fmt = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const unread = (items ?? []).filter((n) => !n.read).length;
  const shown = unreadOnly ? (items ?? []).filter((n) => !n.read) : items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={unreadOnly ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setUnreadOnly((v) => !v)}
            >
              {t('notifications.unreadOnly')}
              {unread > 0 && <Badge variant="red" size="sm">{unread}</Badge>}
            </Button>
            <Button variant="outline" size="sm" onClick={markAll} disabled={unread === 0}>
              <CheckCheck size={14} /> {t('notif.markAllRead')}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-sm border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          {t('notifications.loadError')}
        </div>
      )}

      <SectionCard className="!p-0">
        {items === null ? (
          <div className="space-y-4 p-5" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Bone className="h-2.5 w-2.5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Bone className="h-3 w-1/3" />
                  <Bone className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<Bell size={26} />}
            title={t('notif.none')}
            className="min-h-[40vh]"
          />
        ) : (
          <ul className="divide-y divide-stroke dark:divide-strokedark">
            {shown.map((n) => {
              const { title, message } = notifContent(n, t);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-gray dark:hover:bg-meta-4 ${
                      n.read ? '' : 'bg-primary/5'
                    }`}
                  >
                    <span
                      className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                        n.read ? 'bg-stroke dark:bg-strokedark' : 'bg-primary'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-black dark:text-white">{title}</span>
                      <span className="block text-sm text-body dark:text-bodydark">{message}</span>
                    </span>
                    <time className="shrink-0 text-xs text-bodydark2" dateTime={n.createdAt}>
                      {fmt.format(new Date(n.createdAt))}
                    </time>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
