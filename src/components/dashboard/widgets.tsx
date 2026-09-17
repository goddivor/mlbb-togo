'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Activity, ArrowUpRight, Award, Bell, CalendarDays, Crown, Flame, Gamepad2,
  Megaphone, MessageSquare, Swords, Trophy, UserPlus, Users, Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { avatarSrc } from '@/lib/api';
import { notifContent, useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function useLocale() {
  const lang = useLangStore((s: any) => s.lang);
  return lang === 'en' ? 'en-GB' : 'fr-FR';
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Widget shell: title row with optional link, then content. */
export function Widget({
  title,
  icon,
  href,
  hrefLabel,
  children,
  className,
  bodyClassName,
}: {
  title: ReactNode;
  icon?: ReactNode;
  href?: string;
  hrefLabel?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-stroke px-5 py-4 dark:border-strokedark">
        <h3 className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold uppercase tracking-wide text-black dark:text-white">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h3>
        {href && (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-primary hover:underline"
          >
            {hrefLabel} <ArrowUpRight size={12} />
          </Link>
        )}
      </header>
      <div className={cn('flex-1 p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Grey placeholder block used by the skeleton loaders. */
export function Bone({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-gray dark:bg-meta-4', className)} />;
}

export function WidgetSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <section
      className={cn(
        'rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark',
        className,
      )}
      aria-busy="true"
    >
      <div className="border-b border-stroke px-5 py-4 dark:border-strokedark">
        <Bone className="h-4 w-32" />
      </div>
      <div className="space-y-3 p-5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Bone className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Small inline empty state for widgets (the UI kit one is full-page). */
function WidgetEmpty({ icon, text, action }: { icon: ReactNode; text: string; action?: ReactNode }) {
  return (
    <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 py-4 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray text-body dark:bg-meta-4 dark:text-bodydark">
        {icon}
      </span>
      <p className="max-w-xs text-sm text-body dark:text-bodydark">{text}</p>
      {action}
    </div>
  );
}

function TeamAvatar({ team, size = 32 }: { team: any; size?: number }) {
  const name: string = team?.name || '?';
  const src = team?.image || team?.logo || team?.icon || null;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarSrc(src, size * 2)}
        alt={name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full border border-stroke object-cover dark:border-strokedark"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
    >
      {name[0]?.toUpperCase() || '?'}
    </span>
  );
}

const RESULT_STYLE: Record<string, { badge: string; bar: string }> = {
  win: { badge: 'green', bar: 'bg-success' },
  loss: { badge: 'red', bar: 'bg-danger' },
  draw: { badge: 'default', bar: 'bg-body' },
};

/* ------------------------------------------------------------------ */
/* Quick stats                                                         */
/* ------------------------------------------------------------------ */

export function QuickStatsWidget({ stats, className }: { stats: any; className?: string }) {
  const t = useT();
  const s = stats || {};
  const streak: number = s.currentStreak ?? 0;
  const abs = Math.abs(streak);
  const streakLabel =
    streak > 0
      ? t(abs === 1 ? 'dashboard.quick.streakWinOne' : 'dashboard.quick.streakWin', { n: abs })
      : streak < 0
        ? t(abs === 1 ? 'dashboard.quick.streakLossOne' : 'dashboard.quick.streakLoss', { n: abs })
        : t('dashboard.quick.streakNone');
  const tiles = [
    {
      key: 'games',
      icon: <Swords size={18} />,
      value: s.games ?? 0,
      label: t('dashboard.quick.games'),
      hint: t('dashboard.quick.record', { wins: s.wins ?? 0, losses: s.losses ?? 0 }),
    },
    {
      key: 'winRate',
      icon: <Trophy size={18} />,
      value: `${s.winRate ?? 0}%`,
      label: t('dashboard.quick.winRate'),
      hint: `${t('dashboard.quick.kda')} ${s.kda ?? 0}`,
    },
    {
      key: 'streak',
      icon: <Flame size={18} />,
      value: streak > 0 ? `+${streak}` : String(streak),
      label: t('dashboard.quick.streak'),
      hint: streakLabel,
    },
    {
      key: 'mvp',
      icon: <Crown size={18} />,
      value: s.mvpCount ?? 0,
      label: t('dashboard.quick.mvp'),
      hint: `${t('dashboard.stats.bestStreak')} ${s.bestStreak ?? 0}`,
    },
  ];
  const form: string[] = Array.isArray(s.form) ? s.form : [];

  return (
    <Widget title={t('dashboard.widgets.quickStats')} icon={<Zap size={16} />} className={className}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.key} className="rounded-sm border border-stroke p-4 dark:border-strokedark">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-meta-2 text-primary dark:bg-meta-4">
              {tile.icon}
            </span>
            <p className="mt-3 text-2xl font-bold text-black dark:text-white">{tile.value}</p>
            <p className="text-xs font-medium text-body dark:text-bodydark">{tile.label}</p>
            <p className="mt-1 truncate text-[11px] text-bodydark2">{tile.hint}</p>
          </div>
        ))}
      </div>
      {form.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-body dark:text-bodydark">{t('dashboard.quick.form')}</span>
          <div className="flex gap-1">
            {form.map((r, i) => (
              <span
                key={i}
                title={t(`dashboard.matches.result.${r}`)}
                className={cn('h-2.5 w-4 rounded-sm', RESULT_STYLE[r]?.bar || 'bg-body')}
              />
            ))}
          </div>
        </div>
      )}
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Recent activity timeline                                            */
/* ------------------------------------------------------------------ */

const ACTIVITY_ICON: Record<string, ReactNode> = {
  match: <Swords size={14} />,
  draft_registration: <Gamepad2 size={14} />,
  friend_accepted: <UserPlus size={14} />,
  badge: <Award size={14} />,
  post: <MessageSquare size={14} />,
  comment: <MessageSquare size={14} />,
};

const ACTIVITY_TONE: Record<string, string> = {
  match: 'bg-primary/10 text-primary',
  draft_registration: 'bg-meta-5/10 text-meta-5',
  friend_accepted: 'bg-success/10 text-success',
  badge: 'bg-warning/10 text-warning',
  post: 'bg-meta-6/10 text-meta-6',
  comment: 'bg-meta-6/10 text-meta-6',
};

function useActivityText() {
  const t = useT();
  return (e: any): { title: string; detail: string | null } => {
    const d = e?.data || {};
    switch (e?.type) {
      case 'match':
        return {
          title: t(`dashboard.activity.match.${d.result || 'draw'}`, { opponent: d.opponent?.name ?? '?' }),
          detail: t('dashboard.activity.match.detail', {
            scoreFor: d.scoreFor ?? 0,
            scoreAgainst: d.scoreAgainst ?? 0,
            hero: d.hero ?? '—',
          }),
        };
      case 'draft_registration':
        return {
          title: t('dashboard.activity.draft_registration', { name: d.name ?? '' }),
          detail: t('dashboard.activity.draft_registration.detail', { category: d.category ?? '', role: d.role ?? '' }),
        };
      case 'friend_accepted':
        return { title: t('dashboard.activity.friend_accepted', { name: d.name ?? '?' }), detail: null };
      case 'badge':
        return { title: t('dashboard.activity.badge', { badge: t(`stats.badge.${d.badge}`) }), detail: null };
      case 'post':
        return { title: t('dashboard.activity.post', { title: d.title ?? '' }), detail: null };
      case 'comment':
        return { title: t('dashboard.activity.comment', { title: d.title ?? '' }), detail: d.excerpt ?? null };
      default:
        return { title: String(e?.type ?? ''), detail: null };
    }
  };
}

export function ActivityWidget({ events, className }: { events: any[]; className?: string }) {
  const t = useT();
  const locale = useLocale();
  const text = useActivityText();
  const list = Array.isArray(events) ? events : [];
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <Widget title={t('dashboard.widgets.activity')} icon={<Activity size={16} />} className={className}>
      {list.length === 0 ? (
        <WidgetEmpty icon={<Activity size={18} />} text={t('dashboard.activity.empty')} />
      ) : (
        <ol className="relative space-y-4 border-l border-stroke pl-5 dark:border-strokedark">
          {list.map((e) => {
            const { title, detail } = text(e);
            const inner = (
              <>
                <span
                  className={cn(
                    'absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-boxdark',
                    ACTIVITY_TONE[e.type] || 'bg-gray text-body',
                  )}
                >
                  {ACTIVITY_ICON[e.type] || <Activity size={14} />}
                </span>
                <p className="text-sm font-medium text-black dark:text-white">
                  {title}
                  {e.type === 'match' && e.data?.isMvp && (
                    <Badge variant="gold" size="sm" className="ml-2">{t('dashboard.activity.match.mvp')}</Badge>
                  )}
                </p>
                {detail && <p className="text-xs text-body dark:text-bodydark">{detail}</p>}
                <time className="text-[11px] text-bodydark2" dateTime={e.date}>
                  {fmt.format(new Date(e.date))}
                </time>
              </>
            );
            return (
              <li key={e.id} className="relative">
                {e.link ? (
                  <Link href={e.link} className="block rounded-sm transition-colors hover:text-primary">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Leaderboard rank                                                    */
/* ------------------------------------------------------------------ */

export function RankWidget({ rank, className }: { rank: any; className?: string }) {
  const t = useT();
  const position: number | null = rank?.position ?? null;
  const total: number = rank?.total ?? 0;
  // Share of the field the player is ahead of (bar) and the "top X%" label.
  const percentile = position && total ? Math.round(((total - position + 1) / total) * 100) : 0;
  const topPct = position && total ? Math.max(1, Math.round((position / total) * 100)) : 100;

  return (
    <Widget
      title={t('dashboard.widgets.rank')}
      icon={<Trophy size={16} />}
      href="/leaderboard"
      hrefLabel={t('dashboard.rank.viewAll')}
      className={className}
    >
      {position ? (
        <div className="flex h-full flex-col justify-between gap-4">
          <div className="flex items-end gap-3">
            <span className="text-5xl font-black leading-none text-primary">#{position}</span>
            <div className="pb-1">
              <p className="text-xs uppercase tracking-wide text-bodydark2">{t('dashboard.rank.position')}</p>
              <p className="text-sm text-body dark:text-bodydark">{t('dashboard.rank.of', { total })}</p>
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-body dark:text-bodydark">
              <span>{t('dashboard.rank.metric.winRate')}</span>
              <span className="font-semibold text-black dark:text-white">{rank.value ?? 0}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray dark:bg-meta-4">
              <div className="h-full rounded-full bg-primary" style={{ width: `${percentile}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-bodydark2">Top {topPct}%</p>
          </div>
        </div>
      ) : (
        <WidgetEmpty
          icon={<Trophy size={18} />}
          text={`${t('dashboard.rank.unranked')} · ${t('dashboard.rank.unrankedHint')}`}
        />
      )}
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Last matches                                                        */
/* ------------------------------------------------------------------ */

export function LastMatchesWidget({
  matches,
  userId,
  className,
}: {
  matches: any[];
  userId?: string;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const list = Array.isArray(matches) ? matches : [];
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });

  return (
    <Widget
      title={t('dashboard.widgets.lastMatches')}
      icon={<Swords size={16} />}
      href={userId ? `/players/${userId}` : undefined}
      hrefLabel={t('dashboard.matches.viewAll')}
      className={className}
      bodyClassName="p-0"
    >
      {list.length === 0 ? (
        <div className="p-5">
          <WidgetEmpty icon={<Swords size={18} />} text={t('dashboard.matches.empty')} />
        </div>
      ) : (
        <ul className="divide-y divide-stroke dark:divide-strokedark">
          {list.map((m) => {
            const style = RESULT_STYLE[m.result] || RESULT_STYLE.draw;
            return (
              <li key={m.id || m.matchId} className="flex items-center gap-3 px-5 py-3">
                <span className={cn('h-8 w-1 shrink-0 rounded-full', style.bar)} />
                <TeamAvatar team={m.opponent} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black dark:text-white">
                    <span className="text-bodydark2">{t('dashboard.matches.vs')}</span> {m.opponent?.name ?? '?'}
                  </p>
                  <p className="truncate text-xs text-body dark:text-bodydark">
                    {m.hero || '—'} · {m.kills}/{m.deaths}/{m.assists}
                    {m.isMvp && <span className="ml-1 font-semibold text-warning">MVP</span>}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={style.badge} size="sm">
                    {m.scoreFor}-{m.scoreAgainst}
                  </Badge>
                  <p className="mt-0.5 text-[11px] text-bodydark2">{fmt.format(new Date(m.date))}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Upcoming calendar                                                   */
/* ------------------------------------------------------------------ */

const UPCOMING_ICON: Record<string, ReactNode> = {
  esport_match: <Swords size={14} />,
  tournament_match: <Swords size={14} />,
  tournament: <Trophy size={14} />,
  draft_match: <Gamepad2 size={14} />,
  draft_tournament: <Gamepad2 size={14} />,
};

function useUpcomingText() {
  const t = useT();
  return (u: any): { title: string; detail: string | null } => {
    const d = u?.data || {};
    const opp = d.opponent?.name;
    switch (u?.kind) {
      case 'esport_match': {
        const type = t(`dashboard.upcoming.matchType.${d.type || 'friendly'}`);
        return {
          title: opp
            ? t('dashboard.upcoming.esport_match', { type, opponent: opp })
            : t('dashboard.upcoming.esport_match.tbd', { type }),
          detail: d.team?.name ?? null,
        };
      }
      case 'tournament':
        return {
          title: t('dashboard.upcoming.tournament', { name: d.name ?? '' }),
          detail: d.team?.name ? t('dashboard.upcoming.tournament.detail', { team: d.team.name }) : null,
        };
      case 'tournament_match':
        return {
          title: opp
            ? t('dashboard.upcoming.tournament_match', { name: d.tournamentName ?? '', round: d.round ?? '?', opponent: opp })
            : t('dashboard.upcoming.tournament_match.tbd', { name: d.tournamentName ?? '', round: d.round ?? '?' }),
          detail: d.team?.name ?? null,
        };
      case 'draft_tournament': {
        const known = ['registration', 'closed', 'drafted', 'ongoing'];
        const status = known.includes(d.status) ? t(`dashboard.upcoming.draft_tournament.status.${d.status}`) : null;
        return {
          title: t('dashboard.upcoming.draft_tournament', { name: d.name ?? '' }),
          detail: [t('dashboard.upcoming.draft_tournament.detail', { category: d.category ?? '' }), status]
            .filter(Boolean)
            .join(' · '),
        };
      }
      case 'draft_match':
        return {
          title: opp
            ? t('dashboard.upcoming.draft_match', { name: d.tournamentName ?? '', round: d.round ?? '?', opponent: opp })
            : t('dashboard.upcoming.draft_match.tbd', { name: d.tournamentName ?? '', round: d.round ?? '?' }),
          detail: d.team?.name ?? null,
        };
      default:
        return { title: String(u?.kind ?? ''), detail: null };
    }
  };
}

export function UpcomingWidget({ items, className }: { items: any[]; className?: string }) {
  const t = useT();
  const locale = useLocale();
  const text = useUpcomingText();
  const list = Array.isArray(items) ? items : [];
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });

  // Group by calendar day (viewer's timezone); unscheduled entries go last.
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const groups: Array<{ key: string; label: string; items: any[] }> = [];
  for (const u of list) {
    const date = u.date ? new Date(u.date) : null;
    const key = date ? date.toDateString() : 'tbd';
    let g = groups.find((x) => x.key === key);
    if (!g) {
      const label = !date
        ? t('dashboard.upcoming.unscheduled')
        : sameDay(date, now)
          ? t('dashboard.upcoming.today')
          : sameDay(date, tomorrow)
            ? t('dashboard.upcoming.tomorrow')
            : dayFmt.format(date);
      g = { key, label, items: [] };
      groups.push(g);
    }
    g.items.push(u);
  }

  return (
    <Widget title={t('dashboard.widgets.upcoming')} icon={<CalendarDays size={16} />} className={className}>
      {list.length === 0 ? (
        <WidgetEmpty
          icon={<CalendarDays size={18} />}
          text={t('dashboard.upcoming.empty')}
          action={
            <Link href="/draft" className="text-xs font-medium text-primary hover:underline">
              {t('header.draft')}
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-bodydark2">{g.label}</p>
              <ul className="space-y-2">
                {g.items.map((u) => {
                  const { title, detail } = text(u);
                  const date = u.date ? new Date(u.date) : null;
                  const row = (
                    <div className="flex items-center gap-3 rounded-sm border border-stroke px-3 py-2.5 transition-colors hover:border-primary dark:border-strokedark">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {UPCOMING_ICON[u.kind] || <CalendarDays size={14} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-black dark:text-white">{title}</p>
                        {detail && <p className="truncate text-xs text-body dark:text-bodydark">{detail}</p>}
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-black dark:text-white">
                        {/* Tournament start dates carry no time of day. */}
                        {date && u.kind !== 'tournament' ? timeFmt.format(date) : '—'}
                      </span>
                    </div>
                  );
                  return (
                    <li key={u.id}>
                      {u.link ? <Link href={u.link}>{row}</Link> : row}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications summary                                               */
/* ------------------------------------------------------------------ */

export function NotificationsWidget({
  unread,
  latest,
  onOpen,
  className,
}: {
  unread: number;
  latest: any[];
  onOpen: (n: any) => void;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const list = Array.isArray(latest) ? latest : [];
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <Widget
      title={t('dashboard.widgets.notifications')}
      icon={<Bell size={16} />}
      href="/notifications"
      hrefLabel={t('dashboard.notifications.viewAll')}
      className={className}
      bodyClassName="p-0"
    >
      <div className="flex items-center gap-2 px-5 py-3">
        <Badge variant={unread > 0 ? 'red' : 'green'} size="sm">
          {unread > 0 ? t('dashboard.notifications.unread', { n: unread }) : t('dashboard.notifications.allRead')}
        </Badge>
      </div>
      {list.length === 0 ? (
        <div className="px-5 pb-5">
          <WidgetEmpty icon={<Bell size={18} />} text={t('dashboard.notifications.empty')} />
        </div>
      ) : (
        <ul className="divide-y divide-stroke border-t border-stroke dark:divide-strokedark dark:border-strokedark">
          {list.map((n) => {
            const { title, message } = notifContent(n, t);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onOpen(n)}
                  className={cn(
                    'flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-gray dark:hover:bg-meta-4',
                    !n.read && 'bg-primary/5',
                  )}
                >
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      n.read ? 'bg-stroke dark:bg-strokedark' : 'bg-primary',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-black dark:text-white">{title}</span>
                    <span className="block truncate text-xs text-body dark:text-bodydark">{message}</span>
                    <span className="block text-[11px] text-bodydark2">{fmt.format(new Date(n.createdAt))}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Shortcuts                                                           */
/* ------------------------------------------------------------------ */

export function ShortcutsWidget({ className }: { className?: string }) {
  const t = useT();
  const items = [
    { href: '/draft', icon: <Gamepad2 size={20} />, label: t('dashboard.shortcuts.draft'), desc: t('dashboard.shortcuts.draftDesc') },
    { href: '/tournaments', icon: <Trophy size={20} />, label: t('dashboard.shortcuts.tournaments'), desc: t('dashboard.shortcuts.tournamentsDesc') },
    { href: '/recruitment', icon: <Megaphone size={20} />, label: t('dashboard.shortcuts.recruitment'), desc: t('dashboard.shortcuts.recruitmentDesc') },
    { href: '/leaderboard', icon: <Users size={20} />, label: t('dashboard.shortcuts.leaderboard'), desc: t('dashboard.shortcuts.leaderboardDesc') },
  ];
  return (
    <Widget title={t('dashboard.widgets.shortcuts')} icon={<Zap size={16} />} className={className}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="group flex items-center gap-3 rounded-sm border border-stroke p-3 transition-colors hover:border-primary dark:border-strokedark"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              {it.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-black dark:text-white">{it.label}</span>
              <span className="block truncate text-xs text-body dark:text-bodydark">{it.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </Widget>
  );
}
