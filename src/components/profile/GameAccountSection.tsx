'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Crown, EyeOff, Flame, Gamepad2, History, Star, Swords, Trophy } from 'lucide-react';
import { Badge, Button, Card, SectionTitle, Skeleton, StatTile } from '@/components/ui';
import RoleIcon from '@/components/game/RoleIcon';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { useLangStore } from '@/store/useStore';
import GameSyncNotice from './GameSyncNotice';
import GameMatchDetailModal, { HeroThumb, formatDuration } from './GameMatchDetailModal';

const PAGE_SIZE = 10;
// Moonton lane ids -> our lane keys (RoleIcon / `lane.*` i18n).
const LANES: Record<number, string> = { 1: 'exp', 2: 'mid', 3: 'roam', 4: 'jungle', 5: 'gold' };

function CareerTiles({ stats }: { stats: any }) {
  const t = useT();
  const mvpRate = stats.total ? Math.round((stats.mvpCount / stats.total) * 1000) / 10 : 0;
  const tiles = [
    { key: 'games', icon: <Swords size={16} />, label: t('gameAccount.games'), value: stats.total, hint: t('dashboard.quick.record', { wins: stats.wins, losses: stats.losses }), accent: 'cyan' as const },
    { key: 'wr', icon: <Trophy size={16} />, label: t('gameAccount.winRate'), value: `${stats.winRate}%`, hint: t('gameAccount.gameTime', { n: Math.round(stats.gameTime || 0) }), accent: 'green' as const },
    { key: 'mvp', icon: <Crown size={16} />, label: t('gameAccount.mvp'), value: stats.mvpCount, hint: t('gameAccount.mvpHint', { rate: mvpRate }), accent: 'gold' as const },
    { key: 'score', icon: <Star size={16} />, label: t('gameAccount.avgScore'), value: stats.avgScore, hint: t('gameAccount.bestStreakHint', { n: stats.winStreak }), accent: 'violet' as const },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.key} className="rounded border border-line-subtle bg-surface-2/40 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <StatTile label={tile.label} value={tile.value} accent={tile.accent} />
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded cut-corners-sm bg-surface-3 text-ink-2">
              {tile.icon}
            </span>
          </div>
          <p className="mt-2 truncate text-[11px] text-ink-3">{tile.hint}</p>
        </div>
      ))}
    </div>
  );
}

function HeroList({ heroes }: { heroes: any[] }) {
  const t = useT();
  if (!heroes.length) return <p className="py-3 text-sm text-ink-3">{t('gameAccount.heroesEmpty')}</p>;
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {heroes.slice(0, 9).map((h, i) => {
        const wr = Number(h.winRate ?? 0);
        return (
          <div key={h.heroId ?? i} className="flex items-center gap-3 rounded border border-line-subtle bg-surface-2/40 p-2">
            <HeroThumb src={h.image} name={h.name} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-1">{h.name}</p>
              <p className="text-[11px] num text-ink-2">{t('gameAccount.heroMatches', { n: h.matches ?? 0 })}</p>
            </div>
            <div className="w-20 shrink-0">
              <p className={cn('text-right text-sm font-bold num', wr >= 50 ? 'text-accent-green' : 'text-accent-red')}>{wr}%</p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className={cn('h-full rounded-full', wr >= 50 ? 'bg-accent-green' : 'bg-accent-red')}
                  style={{ width: `${Math.max(0, Math.min(100, wr))}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * "Compte de jeu" section of a player profile: cached Moonton data served by
 * our API (career, seasons, heroes, match history with a scoreboard modal).
 */
export default function GameAccountSection({ userId }: { userId: string }) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState<number | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.users
      .game(userId)
      .then((g: any) => {
        setGame(g);
        setSeason(g?.currentSeason ?? null);
      })
      .catch(() => setGame(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const loadMatches = useCallback(
    async (p: number) => {
      const res: any = await api.users.gameMatches(userId, { season, page: p, limit: PAGE_SIZE });
      setItems((prev) => (p === 1 ? res.items ?? [] : [...prev, ...(res.items ?? [])]));
      setTotal(res.total ?? 0);
      setHasMore(!!res.hasMore);
      setPage(p);
    },
    [userId, season],
  );

  const enabled = !!game?.visible && !!game?.linked;
  useEffect(() => {
    if (!enabled) return;
    setListLoading(true);
    loadMatches(1)
      .catch(() => setItems([]))
      .finally(() => setListLoading(false));
  }, [enabled, loadMatches]);

  const heroes = useMemo(() => {
    if (!game) return [];
    const row = (game.seasonStats || []).find((s: any) => s.sid === season);
    if (row) return row.frequentHeroes || [];
    return season === game.currentSeason ? game.frequentHeroes || [] : [];
  }, [game, season]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const title = (
    <span className="inline-flex items-center gap-2">
      <Gamepad2 size={18} className="text-primary" /> {t('gameAccount.title')}
    </span>
  );

  if (loading) {
    return (
      <Card aria-busy="true">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </Card>
    );
  }
  if (!game || !game.linked) return null;
  if (!game.visible) {
    return (
      <Card>
        <SectionTitle size="sm" title={title} className="mb-3" />
        <p className="flex items-center gap-2 text-sm text-ink-3">
          <EyeOff size={15} /> {t('gameAccount.private')}
        </p>
      </Card>
    );
  }

  const seasons: number[] = game.seasons || [];
  const offline = !game.sync?.statsAvailable;

  return (
    <Card>
      <SectionTitle
        size="sm"
        className="mb-4"
        title={title}
        action={
          seasons.length > 0 ? (
            <label className="inline-flex items-center gap-2 text-xs text-ink-2">
              <span className="sr-only">{t('gameAccount.seasonSelect')}</span>
              <select
                value={season ?? ''}
                onChange={(e) => setSeason(e.target.value ? Number(e.target.value) : null)}
                className="rounded border border-line-subtle bg-surface-2 px-2 py-1.5 text-xs font-semibold text-ink-1 focus:border-primary focus:outline-none"
              >
                {seasons.map((s) => (
                  <option key={s} value={s}>
                    {t('gameAccount.season', { n: s })}
                  </option>
                ))}
                <option value="">{t('gameAccount.allSeasons')}</option>
              </select>
            </label>
          ) : undefined
        }
      />

      <GameSyncNotice sync={game.sync} isOwner={game.isOwner} className="mb-4" />

      {/* Career */}
      <p className="eyebrow mb-3">{t('gameAccount.career')}</p>
      {game.stats ? (
        <CareerTiles stats={game.stats} />
      ) : (
        <p className="rounded border border-dashed border-line-subtle px-3 py-4 text-center text-sm text-ink-3">
          {t('gameAccount.noStats')}
        </p>
      )}

      {/* Frequent heroes of the selected season */}
      {(heroes.length > 0 || season != null) && (
        <>
          <p className="eyebrow mb-3 mt-6">
            {t('gameAccount.frequentHeroes')}
            {season != null && <span className="ml-2 normal-case tracking-normal text-ink-3">{t('gameAccount.season', { n: season })}</span>}
          </p>
          <HeroList heroes={heroes} />
        </>
      )}

      {/* Match history */}
      <div className="mb-3 mt-6 flex items-center justify-between gap-2">
        <p className="eyebrow inline-flex items-center gap-1.5">
          <History size={13} /> {t('gameAccount.history')}
        </p>
        {total > 0 && <span className="text-xs num text-ink-2">{t('gameAccount.historyCount', { shown: items.length, total })}</span>}
      </div>
      {listLoading ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed border-line-subtle px-4 py-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded cut-corners-sm bg-surface-2 text-ink-3 ring-1 ring-inset ring-line-subtle">
            <History size={18} />
          </span>
          <p className="max-w-sm text-sm text-ink-2">
            {t(offline ? 'gameAccount.historyEmptyOffline' : 'gameAccount.historyEmpty')}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line-subtle overflow-hidden rounded border border-line-subtle">
          {items.map((m) => {
            const lane = LANES[m.laneId];
            return (
              <li key={m.bid}>
                <button
                  type="button"
                  onClick={() => setOpen(m)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2/60 focus-visible:bg-surface-2/60 focus-visible:outline-none"
                >
                  <span className={cn('h-8 w-1 shrink-0 -skew-x-12 rounded-sm', m.win ? 'bg-accent-green' : 'bg-accent-red')} />
                  <HeroThumb src={m.heroImage} name={m.heroName} size={36} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink-1">
                      <span className="truncate">{m.heroName || '?'}</span>
                      {m.mvp && (
                        <Badge variant="gold" size="sm" className="gap-1">
                          <Crown size={11} /> MVP
                        </Badge>
                      )}
                    </p>
                    <p className="flex items-center gap-1.5 truncate text-[11px] text-ink-3">
                      <Badge variant={m.win ? 'green' : 'red'} size="sm">
                        {t(m.win ? 'gameAccount.win' : 'gameAccount.loss')}
                      </Badge>
                      {lane && <RoleIcon role={lane} size={12} />}
                      <span className="num">{fmtDate(m.playedAt)}</span>
                      {m.durationSec != null && <span className="num">· {formatDuration(m.durationSec)}</span>}
                    </p>
                  </div>
                  <div className="shrink-0 text-right leading-tight">
                    <p className="font-display text-sm font-bold num">
                      <span className="text-accent-green">{m.kills}</span>
                      <span className="text-ink-3"> / </span>
                      <span className="text-accent-red">{m.deaths}</span>
                      <span className="text-ink-3"> / </span>
                      <span className="text-accent-cyan">{m.assists}</span>
                    </p>
                    <p className="text-[11px] num text-ink-3">
                      KDA {m.kda} · <Flame size={10} className="inline" /> {m.score}
                    </p>
                  </div>
                  <ChevronRight size={16} className="hidden shrink-0 text-ink-3 sm:block" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            size="sm"
            variant="secondary"
            disabled={more}
            loading={more}
            onClick={async () => {
              setMore(true);
              try {
                await loadMatches(page + 1);
              } finally {
                setMore(false);
              }
            }}
          >
            {t('stats.loadMore')}
          </Button>
        </div>
      )}

      <GameMatchDetailModal userId={userId} match={open} onClose={() => setOpen(null)} />
    </Card>
  );
}
