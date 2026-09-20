'use client';

import { useEffect, useMemo, useState } from 'react';
import { Ban, Flame, Swords, Trophy } from 'lucide-react';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useThemeStore } from '@/store/useStore';
import { EmptyState, SectionCard, SectionTitle, Skeleton } from '@/components/ui';
import { HeroThumb, InfoTip, LaneCell, SortableTable, WinRateBar, fmt, type Column } from './shared';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type HeroRow = {
  hero: string;
  image: string | null;
  heroClass: string | null;
  role: string | null;
  picks: number;
  wins: number;
  losses: number;
  winRate: number | null;
  pickRate: number;
  bans: number;
  banRate: number | null;
  mvpCount: number;
  kda: number;
};

type Meta = {
  matches: number;
  matchesWithStats: number;
  matchesWithBans: number;
  minGames: number;
  banSource: 'match-games' | 'unavailable';
  heroes: HeroRow[];
  mostPlayed: HeroRow[];
  bestWinRate: HeroRow[];
  mostBanned: HeroRow[];
};

function useChartTheme() {
  const theme = useThemeStore((s: any) => s.theme);
  const dark = theme === 'dark';
  return {
    dark,
    bar: dark ? '#22d3ee' : '#0891b2',
    grid: dark ? 'rgba(174,183,192,0.12)' : 'rgba(100,116,139,0.15)',
    tick: dark ? '#AEB7C0' : '#64748B',
  };
}

function PickRateChart({ heroes }: { heroes: HeroRow[] }) {
  const th = useChartTheme();
  const t = useT();
  const top = heroes.slice(0, 5);
  const data = useMemo(
    () => ({
      labels: top.map((h) => h.hero),
      datasets: [
        {
          data: top.map((h) => h.pickRate),
          backgroundColor: th.bar,
          borderRadius: 4,
          borderSkipped: 'start' as const,
          barThickness: 18,
          maxBarThickness: 22,
        },
      ],
    }),
    [top, th.bar],
  );
  const options = useMemo(
    () => ({
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => `${ctx.parsed.x}%`,
            afterBody: (items: any[]) => {
              const h = top[items[0]?.dataIndex];
              return h ? [`${t('lstats.col.picks')}: ${h.picks}`, `${t('lstats.col.winRate')}: ${h.winRate === null ? '–' : `${h.winRate}%`}`] : [];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          // Pick rates are usually far below 100%: fit the axis to the data.
          suggestedMax: Math.min(100, Math.ceil(Math.max(0, ...top.map((h) => h.pickRate)) / 10) * 10 + 10),
          grid: { color: th.grid },
          ticks: { color: th.tick, font: { size: 11 }, callback: (v: any) => `${v}%` },
        },
        y: { grid: { display: false }, ticks: { color: th.tick, font: { size: 12 } } },
      },
    }),
    [th, top, t],
  );
  return (
    <div className="h-56">
      <Bar data={data} options={options as any} />
    </div>
  );
}

function HeroCard({ h, value, sub }: { h: HeroRow; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line-subtle bg-surface-2/40 p-2.5 transition-colors hover:border-primary/40">
      <HeroThumb hero={{ name: h.hero, image: h.image }} size={44} className="!rounded cut-corners-sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-bold text-ink-1">{h.hero}</p>
        <p className="truncate text-[11px] capitalize num text-ink-3">
          {h.role ?? h.heroClass ?? ''}
          {sub ? ` · ${sub}` : ''}
        </p>
      </div>
      <span className="font-display text-lg font-bold num text-primary">{value}</span>
    </div>
  );
}

function Column3({
  icon,
  title,
  hint,
  extra,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SectionCard className="!p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h3 className="font-display font-bold tracking-tight2 text-ink-1">{title}</h3>
        <span className="ml-auto inline-flex items-center gap-2 text-[11px] num text-ink-3">
          {hint}
          {extra}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </SectionCard>
  );
}

export default function MetaTab({ scope, ready }: { scope: string; ready: boolean }) {
  const t = useT();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    setLoading(true);
    api.leagueStats
      .meta(scope, 5)
      .then((res: any) => alive && setMeta(res && Array.isArray(res.heroes) ? res : null))
      .catch(() => alive && setMeta(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [scope, ready]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}
      </div>
    );
  }
  if (!meta || meta.heroes.length === 0) {
    return <EmptyState icon={<Swords size={26} />} title={t('lstats.empty.title')} description={t('lstats.empty.desc')} />;
  }

  const source = (
    <InfoTip label={t('lstats.meta.source')}>
      <span className="block font-semibold mb-1">{t('lstats.meta.source')}</span>
      <span className="block">{t('lstats.meta.source.picks')}</span>
      <span className="block mt-1">
        {meta.banSource === 'match-games'
          ? t('lstats.meta.source.bansMatches', { n: meta.matchesWithBans })
          : t('lstats.meta.source.bansUnavailable')}
      </span>
    </InfoTip>
  );

  const columns: Column<HeroRow>[] = [
    {
      key: 'hero',
      label: t('lstats.col.hero'),
      value: (r) => r.hero,
      render: (r) => (
        <span className="inline-flex items-center gap-2.5 font-semibold">
          <HeroThumb hero={{ name: r.hero, image: r.image }} size={30} />
          {r.hero}
        </span>
      ),
    },
    { key: 'role', label: t('lstats.col.role'), value: (r) => r.role ?? '', render: (r) => <LaneCell role={r.role} />, hideOnMobile: true },
    { key: 'picks', label: t('lstats.col.picks'), value: (r) => r.picks, render: (r) => r.picks, align: 'right' },
    {
      key: 'pickRate',
      label: (
        <span className="inline-flex items-center gap-1">
          {t('lstats.col.pickRate')}
          <InfoTip>{t('lstats.meta.pickRateTip')}</InfoTip>
        </span>
      ),
      value: (r) => r.pickRate,
      render: (r) => `${fmt(r.pickRate)}%`,
      align: 'right',
      hideOnMobile: true,
    },
    {
      key: 'winRate',
      label: t('lstats.col.winRate'),
      value: (r) => r.winRate,
      render: (r) =>
        r.winRate === null ? (
          <span className="text-xs text-ink-3" title={t('lstats.meta.minGames', { n: meta.minGames })}>
            –
          </span>
        ) : (
          <WinRateBar value={r.winRate} />
        ),
    },
    { key: 'kda', label: t('lstats.col.kda'), value: (r) => r.kda, render: (r) => fmt(r.kda, 2), align: 'right', hideOnMobile: true },
    { key: 'mvp', label: t('lstats.col.mvp'), value: (r) => r.mvpCount, render: (r) => r.mvpCount, align: 'right', hideOnMobile: true },
    {
      key: 'bans',
      label: (
        <span className="inline-flex items-center gap-1">
          {t('lstats.col.bans')}
          {source}
        </span>
      ),
      value: (r) => r.bans,
      render: (r) =>
        meta.banSource === 'unavailable' ? <span className="text-ink-3">–</span> : `${r.bans}${r.banRate !== null ? ` (${fmt(r.banRate)}%)` : ''}`,
      align: 'right',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Column3 icon={<Flame size={18} />} title={t('lstats.meta.mostPlayed')} hint={`${meta.matchesWithStats} ${t('lstats.col.games').toLowerCase()}`}>
          {meta.mostPlayed.map((h) => (
            <HeroCard key={h.hero} h={h} value={String(h.picks)} sub={`${fmt(h.pickRate)}%`} />
          ))}
        </Column3>
        <Column3 icon={<Trophy size={18} />} title={t('lstats.meta.bestWinRate')} hint={t('lstats.meta.minGames', { n: meta.minGames })}>
          {meta.bestWinRate.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-3">{t('lstats.meta.noWinRate')}</p>
          ) : (
            meta.bestWinRate.map((h) => (
              <HeroCard
                key={h.hero}
                h={h}
                value={`${fmt(h.winRate)}%`}
                sub={`${h.wins}${t('lstats.winShort')} / ${h.losses}${t('lstats.lossShort')}`}
              />
            ))
          )}
        </Column3>
        <Column3 icon={<Ban size={18} />} title={t('lstats.meta.mostBanned')} extra={source}>
          {meta.mostBanned.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-3">
              {meta.banSource === 'unavailable' ? t('lstats.meta.source.bansUnavailable') : t('lstats.meta.noBans')}
            </p>
          ) : (
            meta.mostBanned.map((h) => (
              <HeroCard key={h.hero} h={h} value={String(h.bans)} sub={h.banRate !== null ? `${fmt(h.banRate)}%` : undefined} />
            ))
          )}
        </Column3>
      </div>

      <SectionCard className="!p-4">
        <SectionTitle size="sm" title={t('lstats.meta.chartTitle')} className="mb-3" />
        <PickRateChart heroes={meta.mostPlayed} />
      </SectionCard>

      <SectionCard className="!p-0 overflow-hidden">
        <div className="px-4 pt-4 pb-3"><SectionTitle size="sm" title={t('lstats.meta.allHeroes')} /></div>
        <SortableTable columns={columns} rows={meta.heroes} rowKey={(r) => r.hero} defaultSort={{ key: 'picks', dir: 'desc' }} />
      </SectionCard>
    </div>
  );
}
