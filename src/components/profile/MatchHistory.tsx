'use client';

import { useCallback, useEffect, useState } from 'react';
import { History, Star, Trophy } from 'lucide-react';
import { Card, Badge, Button, Skeleton, SectionTitle } from '@/components/ui';
import { cn } from '@/lib/helpers';
import RoleIcon from '@/components/game/RoleIcon';
import { api, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';

const PAGE_SIZE = 10;

const RESULT_BADGE: Record<string, string> = {
  win: 'green',
  loss: 'red',
  draw: 'default',
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
        title={
          <span className="inline-flex items-center gap-2">
            <History size={18} className="text-primary" /> {t('stats.history')}
          </span>
        }
        className="mb-4"
        action={
          total > 0 ? (
            <span className="text-xs text-ink-3 num">{t('stats.shown', { shown: items.length, total })}</span>
          ) : undefined
        }
      />

      {loading ? (
        <div className="space-y-3 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-3">{t('stats.historyNone')}</p>
      ) : (
        <ul className="divide-y divide-line-subtle">
          {items.map((m) => (
            <li
              key={m.id}
              className={cn(
                'flex flex-col gap-3 border-l-2 py-3 pl-3 sm:flex-row sm:items-center',
                m.result === 'win' ? 'border-l-accent-green' : m.result === 'loss' ? 'border-l-accent-red' : 'border-l-line-strong',
              )}
            >
              {/* Result + date */}
              <div className="flex shrink-0 items-center gap-2 sm:w-40">
                <Badge variant={RESULT_BADGE[m.result] || 'default'} size="sm">
                  {t(`stats.result.${m.result}`)}
                </Badge>
                <span className="text-xs text-ink-3 num">{fmtDate(m.date)}</span>
              </div>

              {/* Teams and score */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <TeamLogo team={m.team} />
                <span className="truncate text-sm font-semibold text-ink-1">{m.team?.name}</span>
                <span className="px-1 font-display text-sm font-bold num text-ink-1">
                  {m.scoreFor} - {m.scoreAgainst}
                </span>
                <span className="truncate text-sm text-ink-2">{m.opponent?.name}</span>
                <TeamLogo team={m.opponent} />
              </div>

              {/* Hero, role, KDA */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  {m.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mlbbImg(m.heroImage, 64)}
                      alt={m.hero || ''}
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 rounded object-cover bg-surface-3"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-surface-3" />
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
                <div className="w-20 text-right leading-tight">
                  <p className="text-sm font-bold num text-ink-1">
                    {m.kills} / {m.deaths} / {m.assists}
                  </p>
                  <p className="text-[11px] text-ink-2 num">KDA {m.kda}</p>
                </div>
                {m.isMvp && (
                  <Badge variant="gold" size="sm" className="gap-1">
                    <Star size={12} /> MVP
                  </Badge>
                )}
              </div>

              {m.seasonName && (
                <span className="hidden shrink-0 items-center gap-1 text-xs text-ink-3 xl:inline-flex">
                  <Trophy size={12} /> {m.seasonName}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button size="sm" variant="secondary" disabled={more} onClick={loadMore}>
            {t('stats.loadMore')}
          </Button>
        </div>
      )}
    </Card>
  );
}
