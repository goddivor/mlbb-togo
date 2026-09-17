'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Coins, Crosshair, Flame, HandHelping, Medal, Scale, Timer } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { EmptyState, LoadingSpinner, SectionCard } from '@/components/ui';
import { HeroThumb, PlayerAvatar, TeamLogo, fmt, fmtInt, type TeamRef, type UserRef } from './shared';

type PlayerRecord = {
  value: number;
  matchId: string;
  hero: string | null;
  role: string | null;
  date: string | null;
  kills: number;
  deaths: number;
  assists: number;
  user: UserRef;
  team: TeamRef;
  heroCard: { name: string; image: string | null } | null;
};

type MatchRecord = {
  value: number;
  matchId: string;
  scoreA: number;
  scoreB: number;
  date: string | null;
  teamA: TeamRef | null;
  teamB: TeamRef | null;
};

type Records = {
  period: 'week' | 'season';
  window: { from: string; to: string } | null;
  matches: number;
  topKills: PlayerRecord | null;
  topAssists: PlayerRecord | null;
  topDamage: PlayerRecord | null;
  topGold: PlayerRecord | null;
  topKda: PlayerRecord | null;
  longestGame: MatchRecord | null;
  biggestMargin: MatchRecord | null;
};

const PLAYER_KEYS = ['topKills', 'topAssists', 'topDamage', 'topGold', 'topKda'] as const;
const ICONS: Record<string, ReactNode> = {
  topKills: <Crosshair size={18} />,
  topAssists: <HandHelping size={18} />,
  topDamage: <Flame size={18} />,
  topGold: <Coins size={18} />,
  topKda: <Medal size={18} />,
  longestGame: <Timer size={18} />,
  biggestMargin: <Scale size={18} />,
};

function dateLabel(iso: string | null, lang: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' });
}

function RecordCard({ icon, title, children, index }: { icon: ReactNode; title: string; children: ReactNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark"
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-body dark:text-bodydark">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-meta-2 text-primary dark:bg-meta-4">{icon}</span>
        {title}
      </div>
      {children}
    </motion.div>
  );
}

export default function RecordsTab({ scope, ready }: { scope: string; ready: boolean }) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [period, setPeriod] = useState<'week' | 'season'>('week');
  const [rec, setRec] = useState<Records | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    setLoading(true);
    api.leagueStats
      .records(scope, period)
      .then((res: any) => alive && setRec(res && typeof res === 'object' ? res : null))
      .catch(() => alive && setRec(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [scope, ready, period]);

  const valueOf = (key: string, r: PlayerRecord) =>
    key === 'topKda' ? fmt(r.value, 2) : key === 'topDamage' || key === 'topGold' ? fmtInt(r.value) : String(r.value);

  const playerBody = (key: string, r: PlayerRecord | null) => {
    if (!r) return <p className="text-sm text-bodydark2">{t('lstats.records.none')}</p>;
    const name = r.user.displayName || r.user.username;
    return (
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Link href={`/players/${r.user.id}`}>
            <PlayerAvatar user={r.user} size={48} />
          </Link>
          {r.heroCard && (
            <span className="absolute -bottom-1 -right-1">
              <HeroThumb hero={r.heroCard} size={22} className="ring-2 ring-white dark:ring-boxdark" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold leading-tight text-black dark:text-white tabular-nums">{valueOf(key, r)}</p>
          <Link href={`/players/${r.user.id}`} className="block truncate text-sm font-semibold text-black hover:text-primary dark:text-white">
            {name}
          </Link>
          <p className="flex flex-wrap items-center gap-x-1 text-[11px] text-bodydark2">
            <TeamLogo team={r.team} size={12} />
            <span className="truncate">{r.team.name}</span>
            {r.hero && <span>· {t('lstats.records.with')} {r.hero}</span>}
            <span>· {r.kills}/{r.deaths}/{r.assists}</span>
            {r.date && <span>· {dateLabel(r.date, lang)}</span>}
          </p>
        </div>
      </div>
    );
  };

  const matchBody = (r: MatchRecord | null, unavailable: boolean) => {
    if (unavailable) return <p className="text-sm text-bodydark2">{t('lstats.records.notRecorded')}</p>;
    if (!r) return <p className="text-sm text-bodydark2">{t('lstats.records.none')}</p>;
    const side = (team: TeamRef | null, score: number, won: boolean) => (
      <div className={`flex items-center gap-2 min-w-0 ${won ? '' : 'opacity-70'}`}>
        {team && <TeamLogo team={team} size={28} />}
        <span className="truncate text-sm font-semibold text-black dark:text-white">{team?.name ?? '?'}</span>
        <span className={`ml-auto text-xl font-bold tabular-nums ${won ? 'text-success' : 'text-black dark:text-white'}`}>{score}</span>
      </div>
    );
    return (
      <div className="space-y-1.5">
        {side(r.teamA, r.scoreA, r.scoreA > r.scoreB)}
        {side(r.teamB, r.scoreB, r.scoreB > r.scoreA)}
        <p className="text-[11px] text-bodydark2">
          +{r.value}
          {r.date && ` · ${dateLabel(r.date, lang)}`}
        </p>
      </div>
    );
  };

  const hasAny = rec && (PLAYER_KEYS.some((k) => rec[k]) || rec.biggestMargin);

  return (
    <div className="space-y-4">
      <SectionCard className="!p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-black dark:text-white">
              {period === 'week' ? t('lstats.records.week') : t('lstats.records.season')}
            </h3>
            {rec && (
              <p className="text-xs text-bodydark2">
                {t('lstats.records.matchesInWindow', { n: rec.matches })}
                {rec.window && ` · ${dateLabel(rec.window.from, lang)} → ${dateLabel(rec.window.to, lang)}`}
              </p>
            )}
          </div>
          <div className="flex gap-1.5">
            {(['week', 'season'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-sm border transition-colors ${
                  period === p
                    ? 'bg-primary border-primary text-white'
                    : 'bg-gray-2 border-stroke text-body hover:border-primary dark:bg-meta-4 dark:border-strokedark dark:text-bodydark'
                }`}
              >
                {t(`lstats.records.period.${p}`)}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : !rec || !hasAny ? (
        <EmptyState icon={<Medal size={26} />} title={t('lstats.records.empty')} description={t('lstats.empty.desc')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PLAYER_KEYS.map((k, i) => (
            <RecordCard key={k} icon={ICONS[k]} title={t(`lstats.records.${k}`)} index={i}>
              {playerBody(k, rec[k])}
            </RecordCard>
          ))}
          <RecordCard icon={ICONS.biggestMargin} title={t('lstats.records.biggestMargin')} index={5}>
            {matchBody(rec.biggestMargin, false)}
          </RecordCard>
          <RecordCard icon={ICONS.longestGame} title={t('lstats.records.longestGame')} index={6}>
            {matchBody(rec.longestGame, rec.longestGame === null)}
          </RecordCard>
        </div>
      )}
    </div>
  );
}
