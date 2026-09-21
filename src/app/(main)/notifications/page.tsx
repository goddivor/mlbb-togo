'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Award,
  Bell,
  BellOff,
  AtSign,
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
import { api, clearApiCache } from '@/lib/api';
import type { AppNotification, NotificationPage } from '@/lib/api';
import {
  PageHeader,
  SectionCard,
  Badge,
  EmptyState,
  Button,
  Tabs,
  StatTile,
  Skeleton,
} from '@/components/ui';
import { useT, notifContent } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { timeAgo } from '@/lib/helpers';
import { fadeUp, stagger, still } from '@/lib/motion';
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
  mention: { icon: AtSign, variant: 'blue' },
  friend_request: { icon: UserPlus, variant: 'purple' },
  friend_accept: { icon: Users2, variant: 'green' },
  team_request: { icon: Shield, variant: 'gold' },
  request_decision: { icon: Inbox, variant: 'gold' },
  recruitment_application: { icon: Handshake, variant: 'purple' },
  recruitment_decision: { icon: Handshake, variant: 'green' },
  tournament_open: { icon: Trophy, variant: 'gold' },
  tournament_second_phase: { icon: Trophy, variant: 'pink' },
  tournament_team: { icon: Shield, variant: 'blue' },
  sponsorship_request: { icon: Handshake, variant: 'gold' },
  achievement_unlock: { icon: Award, variant: 'purple' },
};

const styleOf = (type: string) =>
  TYPE_STYLE[type] ?? { icon: Bell, variant: 'default' };

const ACCENT_OF: Record<string, 'cyan' | 'violet' | 'gold' | 'red' | 'green'> = {
  blue: 'cyan',
  purple: 'violet',
  gold: 'gold',
  green: 'green',
  pink: 'violet',
  red: 'red',
};

const ACCENT_ICON: Record<string, string> = {
  cyan: 'bg-accent-cyan/10 text-accent-cyan',
  violet: 'bg-accent-violet/10 text-accent-violet',
  gold: 'bg-accent-gold/15 text-accent-gold',
  red: 'bg-accent-red/10 text-accent-red',
  green: 'bg-accent-green/10 text-accent-green',
};

/** Groups rows by calendar day (today / yesterday / dated) keeping the order. */
function groupByDay(items: AppNotification[], lang: string) {
  const today = new Date();
  const dayKey = (d: Date) => d.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const groups: { key: string; label: 'today' | 'yesterday' | string; items: AppNotification[] }[] = [];
  for (const n of items) {
    const d = new Date(n.createdAt);
    const key = dayKey(d);
    let g = groups.find((x) => x.key === key);
    if (!g) {
      const label =
        key === dayKey(today)
          ? 'today'
          : key === dayKey(yesterday)
            ? 'yesterday'
            : d.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      g = { key, label, items: [] };
      groups.push(g);
    }
    g.items.push(n);
  }
  return groups;
}

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
  const lang = useLangStore((s: any) => s.lang);
  const reduce = useReducedMotion();
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
    const onNotif = () => {
      // Drop the 20s GET cache so the refresh button really hits the server.
      clearApiCache();
      setStale(true);
    };
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
  const groups = useMemo(() => groupByDay(data.items, lang), [data.items, lang]);
  const readCount = Math.max(0, data.total - data.unread);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Bell size={22} />}
        eyebrow={t('notif.page.eyebrow')}
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

      {/* KPI strip + filters */}
      <SectionCard className="!p-0">
        <div className="grid grid-cols-3 divide-x divide-line-subtle border-b border-line-subtle">
          <StatTile label={t('notif.page.total')} value={data.total} className="px-5 py-4" />
          <StatTile label={t('notif.page.unread')} value={data.unread} accent={data.unread > 0 ? 'red' : undefined} className="px-5 py-4" />
          <StatTile label={t('notif.filter.read')} value={readCount} className="px-5 py-4" />
        </div>
        <div className="overflow-x-auto overflow-y-hidden whitespace-nowrap px-2">
          <Tabs
            variant="underline"
            className="min-w-max !border-b-0"
            tabs={STATUSES.map((s) => ({
              id: s.id,
              label: t(s.key),
              count: s.id === 'unread' ? data.unread : s.id === 'read' ? readCount : data.total,
            }))}
            active={status}
            onChange={(id) => {
              setStatus(id);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line-subtle px-4 py-3">
          <span className="eyebrow mr-1">{t('notif.filter.type')}</span>
          <button
            type="button"
            onClick={() => {
              setType('');
              setPage(1);
            }}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors duration-fast ${
              type === ''
                ? 'bg-primary text-on-primary'
                : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink-1'
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
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors duration-fast ${
                type === o.key
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink-1'
              }`}
            >
              {t(`notif.type.${o.key}`)}
              <span className={`num ${type === o.key ? 'opacity-80' : 'text-ink-3'}`}>{o.count}</span>
            </button>
          ))}
          {filtered && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto text-xs font-semibold text-primary hover:underline"
            >
              {t('notif.filter.reset')}
            </button>
          )}
        </div>
      </SectionCard>

      {/* List */}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <SectionCard key={i} className="!p-4">
              <div className="flex items-start gap-3">
                <Skeleton circle className="h-9 w-9 shrink-0" />
                <Skeleton lines={2} className="flex-1" />
              </div>
            </SectionCard>
          ))}
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
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <p className="eyebrow mb-3 flex items-center gap-3">
                {g.label === 'today'
                  ? t('notif.page.today')
                  : g.label === 'yesterday'
                    ? t('notif.page.yesterday')
                    : g.label}
                <span className="h-px flex-1 bg-line-subtle" aria-hidden="true" />
                <span className="num text-ink-3">{g.items.length}</span>
              </p>
              <motion.ul
                variants={reduce ? still : stagger(0.03)}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {g.items.map((n) => {
                  const { title, message } = notifContent(n, t);
                  const { icon: Icon, variant } = styleOf(n.type);
                  const accent = ACCENT_OF[variant] ?? 'cyan';
                  const time = timeAgo(n.createdAt);
                  return (
                    <motion.li key={n.id} variants={reduce ? still : fadeUp}>
                      <button
                        type="button"
                        onClick={() => openItem(n)}
                        className={`flex w-full items-start gap-3 rounded-lg border border-l-2 px-4 py-3.5 text-left shadow-elev-1 transition-[transform,box-shadow,border-color,background-color] duration-base ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-elev-2 ${
                          n.read
                            ? 'border-line-subtle bg-surface-1 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1'
                            : 'border-line-subtle bg-surface-1 ring-1 ring-inset ring-primary/25'
                        }`}
                        style={{ borderLeftColor: `rgb(var(--accent-${accent}))` }}
                      >
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded cut-corners-sm ${ACCENT_ICON[accent]}`}
                        >
                          <Icon size={16} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className={`text-sm text-ink-1 ${n.read ? 'font-medium' : 'font-semibold'}`}>
                              {title}
                            </span>
                            <Badge variant={variant} size="sm">
                              {t(`notif.type.${n.type}`)}
                            </Badge>
                            {!n.read && (
                              <Badge variant="red" size="sm" dot>
                                {t('notif.page.unreadBadge')}
                              </Badge>
                            )}
                          </span>
                          {message && (
                            <span className="mt-0.5 block text-sm text-ink-2">{message}</span>
                          )}
                        </span>

                        <span className="flex shrink-0 flex-col items-end gap-1">
                          {time && <span className="num text-xs text-ink-3">{time}</span>}
                          {!n.read && (
                            <Check size={16} className="text-primary" aria-label={t('notif.page.markRead')} />
                          )}
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </section>
          ))}

          {data.pages > 1 && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line-subtle bg-surface-1 px-4 py-3">
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
                {t('notif.page.prev')}
              </Button>
              <span className="num text-xs text-ink-2">
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
        </div>
      )}
    </div>
  );
}
