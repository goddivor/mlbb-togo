'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Inbox,
  MessageSquare,
  RefreshCw,
  Shield,
  Trophy,
  UserPlus,
  Users2,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { AppNotification, NotificationPage } from '@/lib/api';
import {
  PageHeader,
  SectionCard,
  Badge,
  EmptyState,
  LoadingSpinner,
  Button,
} from '@/components/ui';
import { useT, notifContent } from '@/lib/i18n';
import { timeAgo } from '@/lib/helpers';
import { getSocket, usePresence } from '@/lib/realtime';

const PAGE_SIZE = 20;

type Status = 'all' | 'unread' | 'read';

const STATUSES: { id: Status; key: string }[] = [
  { id: 'all', key: 'notif.filter.all' },
  { id: 'unread', key: 'notif.filter.unread' },
  { id: 'read', key: 'notif.filter.read' },
];

/**
 * Icon + badge colour per notification type. The backend mints types freely,
 * so anything unknown falls back to the generic bell instead of breaking the
 * row — the label then falls back to the raw type through `t()`.
 */
const TYPE_STYLE: Record<string, { icon: any; variant: string }> = {
  message: { icon: MessageSquare, variant: 'blue' },
  friend_request: { icon: UserPlus, variant: 'purple' },
  friend_accept: { icon: Users2, variant: 'green' },
  team_request: { icon: Shield, variant: 'gold' },
  request_decision: { icon: Inbox, variant: 'gold' },
  recruitment_application: { icon: Handshake, variant: 'purple' },
  recruitment_decision: { icon: Handshake, variant: 'green' },
  tournament_open: { icon: Trophy, variant: 'gold' },
  tournament_second_phase: { icon: Trophy, variant: 'pink' },
  tournament_team: { icon: Shield, variant: 'blue' },
};

const styleOf = (type: string) =>
  TYPE_STYLE[type] ?? { icon: Bell, variant: 'default' };

const EMPTY: NotificationPage = {
  items: [],
  total: 0,
  unread: 0,
  counts: {},
  page: 1,
  limit: PAGE_SIZE,
  pages: 1,
};

export default function NotificationsPage() {
  const t = useT();
  const router = useRouter();
  const connected = usePresence((s) => s.connected);

  const [data, setData] = useState<NotificationPage>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [stale, setStale] = useState(false);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<Status>('all');
  const [type, setType] = useState<string>('');

  const load = useCallback(
    async (opts: { page: number; status: Status; type: string }) => {
      setError(false);
      try {
        const res = await api.notifications.list({
          page: opts.page,
          limit: PAGE_SIZE,
          status: opts.status,
          type: opts.type || undefined,
        });
        setData(res);
        setStale(false);
        // The server clamps nothing: deleting or reading rows can leave us past
        // the last page, so walk back instead of showing an empty list.
        if (res.total > 0 && res.items.length === 0 && opts.page > res.pages) {
          setPage(res.pages);
        }
      } catch {
        setError(true);
        setData(EMPTY);
      }
    },
    [],
  );

  useEffect(() => {
    setLoading(true);
    load({ page, status, type }).finally(() => setLoading(false));
  }, [load, page, status, type]);

  // Live updates: a notification landing while the page is open makes the
  // current slice outdated, so offer a refresh rather than shuffling rows
  // under the cursor.
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onNotif = () => setStale(true);
    s.on('notification:new', onNotif);
    return () => {
      s.off('notification:new', onNotif);
    };
  }, [connected]);

  const refresh = () => load({ page, status, type });

  const typeOptions = useMemo(
    () =>
      Object.entries(data.counts)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({ key, count })),
    [data.counts],
  );

  const filtered = status !== 'all' || type !== '';

  const openItem = async (n: AppNotification) => {
    if (!n.read) {
      setData((d) => ({
        ...d,
        unread: Math.max(0, d.unread - 1),
        items: d.items.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      }));
      try {
        await api.notifications.markRead(n.id);
      } catch {
        /* optimistic: the next load puts the real state back */
      }
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    setBusy(true);
    try {
      // Scoped to the type currently displayed so the button never clears
      // notifications the user cannot see on screen.
      await api.notifications.markAllRead(type || undefined);
      await load({ page, status, type });
    } finally {
      setBusy(false);
    }
  };

  const resetFilters = () => {
    setStatus('all');
    setType('');
    setPage(1);
  };

  const hasUnreadHere = data.items.some((n) => !n.read);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('notif.page.title')}
        subtitle={t('notif.page.subtitle')}
        breadcrumb={t('notif.title')}
        action={
          <div className="flex items-center gap-2">
            {stale && (
              <Button
                size="sm"
                variant="secondary"
                title={t('notif.page.newArrived')}
                onClick={refresh}
              >
                <RefreshCw size={14} />
                {t('notif.page.refresh')}
              </Button>
            )}
            {(hasUnreadHere || data.unread > 0) && (
              <Button size="sm" variant="primary" loading={busy} onClick={markAll}>
                <CheckCheck size={14} />
                {t('notif.markAllRead')}
              </Button>
            )}
          </div>
        }
      />

      {/* Filtres */}
      <SectionCard className="!p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase text-bodydark2">
              {t('notif.filter.status')}
            </span>
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setStatus(s.id);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  status === s.id
                    ? 'bg-primary text-white'
                    : 'bg-gray text-body hover:bg-gray-2 dark:bg-meta-4 dark:text-bodydark'
                }`}
              >
                {t(s.key)}
                {s.id === 'unread' && data.unread > 0 ? ` (${data.unread})` : ''}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase text-bodydark2">
              {t('notif.filter.type')}
            </span>
            <button
              type="button"
              onClick={() => {
                setType('');
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                type === ''
                  ? 'bg-primary text-white'
                  : 'bg-gray text-body hover:bg-gray-2 dark:bg-meta-4 dark:text-bodydark'
              }`}
            >
              {t('notif.filter.allTypes')}
            </button>
            {typeOptions.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => {
                  setType(o.key);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  type === o.key
                    ? 'bg-primary text-white'
                    : 'bg-gray text-body hover:bg-gray-2 dark:bg-meta-4 dark:text-bodydark'
                }`}
              >
                {t(`notif.type.${o.key}`)} ({o.count})
              </button>
            ))}
          </div>

          {filtered && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto text-xs font-medium text-primary hover:underline"
            >
              {t('notif.filter.reset')}
            </button>
          )}
        </div>
      </SectionCard>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState
          icon={<BellOff size={26} />}
          title={t('notif.page.error')}
          action={
            <Button size="sm" variant="secondary" onClick={refresh}>
              <RefreshCw size={14} />
              {t('notif.page.refresh')}
            </Button>
          }
        />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={filtered ? <BellOff size={26} /> : <Bell size={26} />}
          title={filtered ? t('notif.page.emptyFiltered') : t('notif.page.empty')}
          description={
            filtered ? t('notif.page.emptyFilteredDesc') : t('notif.page.emptyDesc')
          }
          action={
            filtered ? (
              <Button size="sm" variant="secondary" onClick={resetFilters}>
                {t('notif.filter.reset')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <SectionCard className="!p-0">
          <div className="flex items-center justify-between border-b border-stroke px-4.5 py-3 dark:border-strokedark">
            <h4 className="text-sm font-medium text-black dark:text-white">
              {t('notif.title')}
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm">
                {t('notif.page.total')} {data.total}
              </Badge>
              {data.unread > 0 && (
                <Badge variant="red" size="sm">
                  {t('notif.page.unread')} {data.unread}
                </Badge>
              )}
            </div>
          </div>

          <ul>
            {data.items.map((n, i) => {
              const { title, message } = notifContent(n, t);
              const { icon: Icon, variant } = styleOf(n.type);
              const time = timeAgo(n.createdAt);
              return (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-stroke last:border-b-0 dark:border-strokedark"
                >
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-3 px-4.5 py-4 text-left transition-colors hover:bg-gray-2 dark:hover:bg-meta-4 ${
                      !n.read ? 'bg-gray-2/60 dark:bg-meta-4/40' : ''
                    }`}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray text-body dark:bg-meta-4 dark:text-bodydark">
                      <Icon size={16} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-black dark:text-white">
                          {title}
                        </span>
                        <Badge variant={variant} size="sm">
                          {t(`notif.type.${n.type}`)}
                        </Badge>
                        {!n.read && (
                          <Badge variant="red" size="sm">
                            {t('notif.page.unreadBadge')}
                          </Badge>
                        )}
                      </span>
                      {message && (
                        <span className="mt-0.5 block text-sm text-body dark:text-bodydark">
                          {message}
                        </span>
                      )}
                      {time && (
                        <span className="mt-1 block text-xs text-bodydark2">{time}</span>
                      )}
                    </span>

                    {!n.read && (
                      <Check
                        size={16}
                        className="mt-1 shrink-0 text-primary"
                        aria-label={t('notif.page.markRead')}
                      />
                    )}
                  </button>
                </motion.li>
              );
            })}
          </ul>

          {data.pages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-stroke px-4.5 py-3 dark:border-strokedark">
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
                {t('notif.page.prev')}
              </Button>
              <span className="text-xs text-body dark:text-bodydark">
                {t('notif.page.pagination', { page: data.page, pages: data.pages })}
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              >
                {t('notif.page.next')}
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
