'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp, stagger, still } from '@/lib/motion';
import { Coins, Crosshair, Flame, HandHelping, Medal, Scale, Timer } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { EmptyState, SectionCard, Skeleton, Tabs } from '@/components/ui';
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

function RecordCard({ icon, title, children, reduce }: { icon: ReactNode; title: string; children: ReactNode; reduce: boolean }) {
  return (
    <motion.div
      variants={reduce ? still : fadeUp}
      className="relative overflow-hidden rounded-lg border border-line-subtle bg-surface-1 p-4 shadow-elev-1 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded cut-corners-sm bg-accent-cyan/10 text-accent-cyan">{icon}</span>
        <span className="eyebrow">{title}</span>
      </div>
      {children}
    </motion.div>
  );
}

export default function RecordsTab({ scope, ready }: { scope: string; ready: boolean }) {
  const t = useT();
  const reduce = !!useReducedMotion();
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
    key === 'topKda' ? fmt(r.value, 2) : key === 'topDamage' || key === 'topGold' ? fmtInt(r.value, lang) : String(r.value);

  const playerBody = (key: string, r: PlayerRecord | null) => {
    if (!r) return <p className="text-sm text-ink-3">{t('lstats.records.none')}</p>;
    const name = r.user.displayName || r.user.username;
    return (
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Link href={`/players/${r.user.id}`}>
            <PlayerAvatar user={r.user} size={48} />
          </Link>
          {r.heroCard && (
            <span className="absolute -bottom-1 -right-1">
              <HeroThumb hero={r.heroCard} size={22} className="!ring-2 !ring-surface-1" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-3xl font-bold leading-none tracking-tight2 num text-ink-1">{valueOf(key, r)}</p>
          <Link href={`/players/${r.user.id}`} className="mt-1 block truncate text-sm font-semibold text-ink-1 hover:text-primary">
            {name}
          </Link>
          <p className="flex flex-wrap items-center gap-x-1 text-[11px] num text-ink-3">
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
    if (unavailable) return <p className="text-sm text-ink-3">{t('lstats.records.notRecorded')}</p>;
    if (!r) return <p className="text-sm text-ink-3">{t('lstats.records.none')}</p>;
    const side = (team: TeamRef | null, score: number, won: boolean) => (
      <div className={`flex min-w-0 items-center gap-2 ${won ? '' : 'opacity-70'}`}>
        {team && <TeamLogo team={team} size={28} />}
        <span className="truncate text-sm font-semibold text-ink-1">{team?.name ?? '?'}</span>
        <span className={`ml-auto font-display text-xl font-bold num ${won ? 'text-accent-green' : 'text-ink-1'}`}>{score}</span>
      </div>
    );
    return (
      <div className="space-y-1.5">
        {side(r.teamA, r.scoreA, r.scoreA > r.scoreB)}
        {side(r.teamB, r.scoreB, r.scoreB > r.scoreA)}
        <p className="text-[11px] num text-ink-3">
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
            <h3 className="font-display font-bold tracking-tight2 text-ink-1">
              {period === 'week' ? t('lstats.records.week') : t('lstats.records.season')}
            </h3>
            {rec && (
              <p className="text-xs num text-ink-3">
                {t('lstats.records.matchesInWindow', { n: rec.matches })}
                {rec.window && ` · ${dateLabel(rec.window.from, lang)} → ${dateLabel(rec.window.to, lang)}`}
              </p>
            )}
          </div>
          <Tabs
            size="sm"
            tabs={(['week', 'season'] as const).map((p) => ({ id: p, label: t(`lstats.records.period.${p}`) }))}
            active={period}
            onChange={(p: 'week' | 'season') => setPeriod(p)}
          />
        </div>
      </SectionCard>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
      ) : !rec || !hasAny ? (
        <EmptyState icon={<Medal size={26} />} title={t('lstats.records.empty')} description={t('lstats.empty.desc')} />
      ) : (
        <motion.div
          key={period}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          variants={reduce ? still : stagger(0.04)}
          initial="hidden"
          animate="visible"
        >
          {PLAYER_KEYS.map((k) => (
            <RecordCard key={k} icon={ICONS[k]} title={t(`lstats.records.${k}`)} reduce={reduce}>
              {playerBody(k, rec[k])}
            </RecordCard>
          ))}
          <RecordCard icon={ICONS.biggestMargin} title={t('lstats.records.biggestMargin')} reduce={reduce}>
            {matchBody(rec.biggestMargin, false)}
          </RecordCard>
          <RecordCard icon={ICONS.longestGame} title={t('lstats.records.longestGame')} reduce={reduce}>
            {matchBody(rec.longestGame, rec.longestGame === null)}
          </RecordCard>
        </motion.div>
      )}
    </div>
  );
}
