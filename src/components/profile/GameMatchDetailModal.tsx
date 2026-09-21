'use client';

import { useEffect, useState } from 'react';
import { Clock, Crown, Swords } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Badge, Skeleton } from '@/components/ui';
import { api, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';

export function formatDuration(sec?: number | null): string {
  if (sec == null || !Number.isFinite(sec)) return '–';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function HeroThumb({ src, name, size = 32 }: { src?: string | null; name?: string | null; size?: number }) {
  if (!src) {
    return <span style={{ width: size, height: size }} className="block shrink-0 rounded cut-corners-sm bg-surface-3" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mlbbImg(src, size * 2)}
      alt={name || ''}
      referrerPolicy="no-referrer"
      style={{ width: size, height: size }}
      className="shrink-0 rounded cut-corners-sm bg-surface-3 object-cover"
    />
  );
}

function PlayerRow({ p }: { p: any }) {
  const t = useT();
  return (
    <li
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-2.5 md:grid-cols-[minmax(0,1.6fr)_7rem_6rem_6.5rem_4rem_minmax(0,1.4fr)]',
        p.isSelf && 'bg-primary/5 ring-1 ring-inset ring-primary/30',
      )}
    >
      {/* Player + hero */}
      <div className="flex min-w-0 items-center gap-2.5">
        <HeroThumb src={p.heroImage} name={p.heroName} size={36} />
        <div className="min-w-0 leading-tight">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink-1">
            <span className="truncate">{p.name}</span>
            {p.isSelf && <Badge variant="neon" size="sm">{t('gameAccount.you')}</Badge>}
            {p.mvp && (
              <Badge variant="gold" size="sm" className="gap-1">
                <Crown size={11} /> MVP
              </Badge>
            )}
          </p>
          <p className="truncate text-[11px] text-ink-3">
            {p.heroName || '?'}
            {p.heroLevel != null && <span className="num"> · {t('gameAccount.heroLevel', { n: p.heroLevel })}</span>}
          </p>
        </div>
      </div>

      {/* K/D/A */}
      <div className="text-right md:text-left">
        <p className="font-display text-sm font-bold num">
          <span className="text-accent-green">{p.kills}</span>
          <span className="text-ink-3"> / </span>
          <span className="text-accent-red">{p.deaths}</span>
          <span className="text-ink-3"> / </span>
          <span className="text-accent-cyan">{p.assists}</span>
        </p>
        <p className="text-[11px] num text-ink-3">KDA {p.kda}</p>
      </div>

      {/* Damage, teamfight, score: labelled on mobile, columns on desktop */}
      <div className="col-span-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-2 md:contents">
        <p className="num md:text-sm md:text-ink-1">
          <span className="md:hidden">{t('gameAccount.col.damage')} </span>
          {Number(p.damage || 0).toLocaleString()}
          <span className="block text-[11px] text-ink-3 max-md:inline max-md:ml-1">{p.damageShare}%</span>
        </p>
        <p className="num md:text-sm md:text-ink-1">
          <span className="md:hidden">{t('gameAccount.col.teamfight')} </span>
          {p.teamfight}%
        </p>
        <p className="num font-semibold md:text-sm md:text-ink-1">
          <span className="font-normal md:hidden">{t('gameAccount.col.score')} </span>
          {p.score}
        </p>
      </div>

      {/* Items */}
      <div className="col-span-2 flex flex-wrap gap-1 md:col-span-1">
        {(p.items || []).map((it: any, i: number) => (
          <span key={`${it.id}-${i}`} title={it.name || `#${it.id}`}>
            {it.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mlbbImg(it.image, 56)}
                alt={it.name || ''}
                referrerPolicy="no-referrer"
                className="h-6 w-6 rounded-sm bg-surface-3 object-cover ring-1 ring-inset ring-line-subtle"
              />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-surface-3 text-[9px] num text-ink-3">
                {it.id}
              </span>
            )}
          </span>
        ))}
      </div>
    </li>
  );
}

/** 10-player scoreboard of a stored game match (fetched lazily by the API). */
export default function GameMatchDetailModal({
  userId,
  match,
  onClose,
}: {
  userId: string;
  match: any | null;
  onClose: () => void;
}) {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!match) return;
    let alive = true;
    setData(null);
    setLoading(true);
    api.users
      .gameMatch(userId, match.bid)
      .then((d: any) => alive && setData(d))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId, match]);

  const detail = data?.detail;
  const players: any[] = detail?.players ?? [];
  const teams: any[] = detail?.teams ?? [];
  const teamIds: number[] = teams.length ? teams.map((x) => x.team) : Array.from(new Set(players.map((p) => p.team)));
  const duration = detail?.durationSec ?? match?.durationSec;

  return (
    <Modal
      open={!!match}
      onClose={onClose}
      size="xl"
      icon={<Swords size={18} />}
      title={t('gameAccount.detail')}
      subtitle={
        match ? (
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>{match.heroName || '?'}</span>
            <span className="inline-flex items-center gap-1 num">
              <Clock size={12} /> {formatDuration(duration)}
            </span>
          </span>
        ) : undefined
      }
      closeLabel={t('common.close')}
    >
      {loading ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !players.length ? (
        <p className="py-8 text-center text-sm text-ink-3">{t('gameAccount.detailUnavailable')}</p>
      ) : (
        <div className="space-y-4">
          {teamIds.map((team) => {
            const info = teams.find((x) => x.team === team);
            const rows = players.filter((p) => p.team === team);
            const win = info?.win ?? rows[0]?.win;
            return (
              <section key={team} className="overflow-hidden rounded border border-line-subtle">
                <header className="flex items-center justify-between gap-2 border-b border-line-subtle bg-surface-2/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-4 w-1 -skew-x-12 rounded-sm', win ? 'bg-accent-green' : 'bg-accent-red')} />
                    <span className="text-sm font-semibold text-ink-1">{t('gameAccount.team', { n: team })}</span>
                    <Badge variant={win ? 'green' : 'red'} size="sm">
                      {t(win ? 'gameAccount.win' : 'gameAccount.loss')}
                    </Badge>
                  </div>
                  {info?.kills != null && (
                    <span className="text-xs num text-ink-2">{t('gameAccount.teamKills', { n: info.kills })}</span>
                  )}
                </header>
                <div className="hidden grid-cols-[minmax(0,1.6fr)_7rem_6rem_6.5rem_4rem_minmax(0,1.4fr)] gap-x-3 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3 md:grid">
                  <span>{t('gameAccount.col.player')}</span>
                  <span>{t('gameAccount.col.kda')}</span>
                  <span>{t('gameAccount.col.damage')}</span>
                  <span>{t('gameAccount.col.teamfight')}</span>
                  <span>{t('gameAccount.col.score')}</span>
                  <span>{t('gameAccount.col.items')}</span>
                </div>
                <ul className="divide-y divide-line-subtle">
                  {rows.map((p, i) => (
                    <PlayerRow key={`${team}-${i}`} p={p} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
