'use client';

import { useCallback, useEffect, useState } from 'react';
import { History, Star, Trophy } from 'lucide-react';
import { Card, Badge, Button, SectionTitle, Skeleton } from '@/components/ui';
import RoleIcon from '@/components/game/RoleIcon';
import { api, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { useLangStore } from '@/store/useStore';

const PAGE_SIZE = 10;

const RESULT_BADGE: Record<string, string> = {
  win: 'green',
  loss: 'red',
  draw: 'default',
};

const RESULT_EDGE: Record<string, string> = {
  win: 'bg-accent-green',
  loss: 'bg-accent-red',
  draw: 'bg-ink-3',
};

function TeamLogo({ team }: { team: any }) {
  if (team?.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.image}
        alt={team.name}
        referrerPolicy="no-referrer"
        className="h-7 w-7 shrink-0 rounded cut-corners-sm object-cover ring-1 ring-inset ring-line-subtle"
      />
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded cut-corners-sm bg-surface-3 text-[11px] font-bold text-ink-2">
      {team?.name?.[0]?.toUpperCase() || 'T'}
    </div>
  );
}

export default function MatchHistory({ userId }: { userId: string }) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);

  const load = useCallback(
    async (p: number) => {
      const res = await api.users.matches(userId, p, PAGE_SIZE);
      setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
      setTotal(res.total ?? 0);
      setHasMore(!!res.hasMore);
      setPage(p);
    },
    [userId],
  );

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    load(1)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [userId, load]);

  const loadMore = async () => {
    setMore(true);
    try {
      await load(page + 1);
    } finally {
      setMore(false);
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <Card>
      <SectionTitle
        size="sm"
        className="mb-4"
        title={
          <span className="inline-flex items-center gap-2">
            <History size={18} className="text-primary" /> {t('stats.history')}
          </span>
        }
        action={
          total > 0 ? (
            <span className="text-xs num text-ink-2">{t('stats.shown', { shown: items.length, total })}</span>
          ) : undefined
        }
      />

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-3">{t('stats.historyNone')}</p>
      ) : (
        <ul className="divide-y divide-line-subtle">
          {items.map((m) => (
            <li key={m.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
              {/* Result + date */}
              <div className="flex shrink-0 items-center gap-2.5 sm:w-44">
                <span className={cn('h-7 w-1 shrink-0 -skew-x-12 rounded-sm', RESULT_EDGE[m.result] || RESULT_EDGE.draw)} />
                <Badge variant={RESULT_BADGE[m.result] || 'default'} size="sm">
                  {t(`stats.result.${m.result}`)}
                </Badge>
                <span className="text-xs num text-ink-3">{fmtDate(m.date)}</span>
              </div>

              {/* Teams and score */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <TeamLogo team={m.team} />
                <span className="truncate text-sm font-semibold text-ink-1">{m.team?.name}</span>
                <span className="px-1 font-display text-base font-bold num text-ink-1">
                  {m.scoreFor}<span className="mx-0.5 text-ink-3">-</span>{m.scoreAgainst}
                </span>
                <span className="truncate text-sm text-ink-2">{m.opponent?.name}</span>
                <TeamLogo team={m.opponent} />
              </div>

              {/* Hero, role, KDA */}
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {m.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mlbbImg(m.heroImage, 64)}
                      alt={m.hero || ''}
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 rounded cut-corners-sm bg-surface-3 object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded cut-corners-sm bg-surface-3" />
                  )}
                  <div className="leading-tight">
                    <p className="max-w-[110px] truncate text-xs font-semibold text-ink-1">
                      {m.hero || t('stats.noHero')}
                    </p>
                    <p className="inline-flex items-center gap-1 text-[11px] text-ink-2">
                      {m.role && <RoleIcon role={m.role} size={12} />}
                      {m.role ? t(`lane.${m.role}`) : m.type ? t(`matchType.${m.type}`) : ''}
                    </p>
                  </div>
                </div>
                <div className="w-24 text-right leading-tight">
                  <p className="font-display text-sm font-bold num text-ink-1">
                    <span className="text-accent-green">{m.kills}</span>
                    <span className="text-ink-3"> / </span>
                    <span className="text-accent-red">{m.deaths}</span>
                    <span className="text-ink-3"> / </span>
                    <span className="text-accent-cyan">{m.assists}</span>
                  </p>
                  <p className="text-[11px] num text-ink-2">KDA {m.kda}</p>
                </div>
                {m.isMvp && (
                  <Badge variant="gold" size="sm" className="gap-1">
                    <Star size={12} /> MVP
                  </Badge>
                )}
              </div>

              {m.seasonName && (
                <span className="hidden shrink-0 items-center gap-1 text-xs text-ink-2 xl:inline-flex">
                  <Trophy size={12} /> {m.seasonName}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button size="sm" variant="secondary" disabled={more} loading={more} onClick={loadMore}>
            {t('stats.loadMore')}
          </Button>
        </div>
      )}
    </Card>
  );
}
