'use client';

import { useCallback, useEffect, useState } from 'react';
import { History, Star, Trophy } from 'lucide-react';
import { Card, Badge, Button, LoadingSpinner } from '@/components/ui';
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
        className="w-7 h-7 rounded-lg object-cover border border-stroke shrink-0 dark:border-strokedark"
      />
    );
  }
  return (
    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-[11px] font-bold text-white shrink-0">
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
    <Card hover={false}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-black dark:text-white inline-flex items-center gap-2">
          <History size={18} /> {t('stats.history')}
        </h3>
        {total > 0 && (
          <span className="text-xs text-body dark:text-bodydark">
            {t('stats.shown', { shown: items.length, total })}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-bodydark2 text-center py-6">{t('stats.historyNone')}</p>
      ) : (
        <ul className="divide-y divide-stroke dark:divide-strokedark">
          {items.map((m) => (
            <li key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Result + date */}
              <div className="flex items-center gap-2 sm:w-40 shrink-0">
                <Badge variant={RESULT_BADGE[m.result] || 'default'} size="sm">
                  {t(`stats.result.${m.result}`)}
                </Badge>
                <span className="text-xs text-body dark:text-bodydark">{fmtDate(m.date)}</span>
              </div>

              {/* Teams and score */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <TeamLogo team={m.team} />
                <span className="text-sm font-semibold text-black dark:text-white truncate">{m.team?.name}</span>
                <span className="text-sm font-bold tabular-nums text-black dark:text-white px-1">
                  {m.scoreFor} - {m.scoreAgainst}
                </span>
                <span className="text-sm text-body dark:text-bodydark truncate">{m.opponent?.name}</span>
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
                      className="w-8 h-8 rounded-sm object-cover bg-gray dark:bg-boxdark"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-sm bg-gray dark:bg-boxdark" />
                  )}
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-black dark:text-white truncate max-w-[110px]">
                      {m.hero || t('stats.noHero')}
                    </p>
                    <p className="text-[11px] text-body dark:text-bodydark inline-flex items-center gap-1">
                      {m.role && <RoleIcon role={m.role} size={12} />}
                      {m.role ? t(`lane.${m.role}`) : m.type ? t(`matchType.${m.type}`) : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right leading-tight w-20">
                  <p className="text-sm font-bold tabular-nums text-black dark:text-white">
                    {m.kills} / {m.deaths} / {m.assists}
                  </p>
                  <p className="text-[11px] text-body dark:text-bodydark">KDA {m.kda}</p>
                </div>
                {m.isMvp && (
                  <Badge variant="gold" size="sm" className="gap-1">
                    <Star size={12} /> MVP
                  </Badge>
                )}
              </div>

              {m.seasonName && (
                <span className="hidden xl:inline-flex items-center gap-1 text-xs text-body dark:text-bodydark shrink-0">
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
