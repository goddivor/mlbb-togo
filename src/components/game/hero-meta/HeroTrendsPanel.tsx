'use client';

import { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Tabs } from '@/components/ui';
import { FilterBar, PanelSkeleton, RankTierTabs, TREND_WINDOWS, Unavailable, WindowTabs, fmtPct, useChartTheme } from './shared';
import { useMeta } from './useMeta';

type Metric = 'winRate' | 'pickRate' | 'banRate';
const METRICS: Array<{ id: Metric; label: string; color: 'green' | 'cyan' | 'red' }> = [
  { id: 'winRate', label: 'heroes.winRate', color: 'green' },
  { id: 'pickRate', label: 'heroes.pickRate', color: 'cyan' },
  { id: 'banRate', label: 'heroes.banRate', color: 'red' },
];

/** Daily win/pick/ban series over 7, 15 or 30 days. */
export default function HeroTrendsPanel({ heroId }: { heroId: number }) {
  const t = useT();
  const th = useChartTheme();
  const [rank, setRank] = useState('all');
  const [days, setDays] = useState(15);
  const [metric, setMetric] = useState<Metric>('winRate');
  const { data, loading } = useMeta<any>(() => api.heroes.metaTrends(heroId, { rank, days }), [heroId, rank, days]);
  const points: any[] = useMemo(() => data?.points ?? [], [data]);

  const color = th[METRICS.find((m) => m.id === metric)!.color];
  const chart = useMemo(
    () => ({
      labels: points.map((p) => p.date.slice(5)),
      datasets: [
        {
          data: points.map((p) => p[metric]),
          borderColor: color,
          backgroundColor: `${color}22`,
          fill: true,
          tension: 0.35,
          pointRadius: points.length > 15 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    }),
    [points, metric, color],
  );
  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx: any) => fmtPct(ctx.parsed.y, 2) } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: th.tick, maxRotation: 0, autoSkipPadding: 12 } },
        y: { grid: { color: th.grid }, ticks: { color: th.tick, callback: (v: any) => `${v}%` } },
      },
    }),
    [th.tick, th.grid],
  );

  const first = points[0]?.[metric];
  const last = points[points.length - 1]?.[metric];

  return (
    <div>
      <FilterBar>
        <RankTierTabs value={rank} onChange={setRank} />
        <WindowTabs value={days} onChange={setDays} options={TREND_WINDOWS} />
      </FilterBar>
      <Tabs
        variant="underline"
        size="sm"
        tabs={METRICS.map((m) => ({ id: m.id, label: t(m.label) }))}
        active={metric}
        onChange={(id: Metric) => setMetric(id)}
        className="mb-4"
      />
      {loading && !points.length ? (
        <PanelSkeleton rows={2} />
      ) : !points.length ? (
        <Unavailable />
      ) : (
        <>
          <div className="mb-3 flex items-baseline gap-3">
            <span className="font-display text-2xl font-bold num text-ink-1">{fmtPct(last, 2)}</span>
            {first != null && last != null && (
              <span className={`text-sm font-semibold num ${last - first >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {last - first >= 0 ? '+' : ''}
                {(last - first).toFixed(2)} {t('heroMeta.points')} · {t('heroMeta.days', { n: days })}
              </span>
            )}
          </div>
          <div className="h-64 sm:h-72" role="img" aria-label={t('heroMeta.tab.trends')}>
            <Line data={chart} options={options} />
          </div>
        </>
      )}
    </div>
  );
}
