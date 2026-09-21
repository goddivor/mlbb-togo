'use client';

import { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { FilterBar, LaneTabs, PanelSkeleton, RankTierTabs, Unavailable, fmtPct, useChartTheme } from './shared';
import { useMeta } from './useMeta';

/** Win rate by game length (minutes) for one lane. */
export default function HeroTimelinePanel({ heroId }: { heroId: number }) {
  const t = useT();
  const th = useChartTheme();
  const [rank, setRank] = useState('all');
  const [lane, setLane] = useState<string | null>(null);
  const { data, loading } = useMeta<any>(
    () => api.heroes.metaTimeline(heroId, { rank, lane: lane ?? undefined }),
    [heroId, rank, lane],
  );
  const buckets: any[] = useMemo(() => data?.buckets ?? [], [data]);

  const chart = useMemo(
    () => ({
      labels: buckets.map((b) =>
        b.to == null ? t('heroMeta.minutesPlus', { n: b.from }) : t('heroMeta.minutesRange', { from: b.from, to: b.to }),
      ),
      datasets: [
        {
          data: buckets.map((b) => b.winRate),
          backgroundColor: buckets.map((b) => ((b.winRate ?? 0) >= 50 ? th.green : th.red)),
          borderRadius: 4,
          maxBarThickness: 42,
        },
      ],
    }),
    [buckets, th.green, th.red, t],
  );
  const values = buckets.map((b) => b.winRate ?? 50);
  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx: any) => fmtPct(ctx.parsed.y, 2) } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: th.tick } },
        y: {
          grid: { color: th.grid },
          ticks: { color: th.tick, callback: (v: any) => `${v}%` },
          beginAtZero: false,
          min: Math.max(0, Math.floor(Math.min(...values, 50) - 5)),
          suggestedMax: Math.min(100, Math.ceil(Math.max(...values, 50) + 3)),
        },
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [th.tick, th.grid, values.join(',')],
  );

  const best = buckets.reduce((acc: any, b: any) => (acc == null || (b.winRate ?? 0) > (acc.winRate ?? 0) ? b : acc), null);

  return (
    <div>
      <FilterBar>
        <RankTierTabs value={rank} onChange={setRank} />
        {data?.lanes?.length > 1 && <LaneTabs lanes={data.lanes} value={data.lane} onChange={setLane} />}
      </FilterBar>
      {loading && !buckets.length ? (
        <PanelSkeleton rows={2} />
      ) : !buckets.length ? (
        <Unavailable />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="text-ink-2">
              {t('heroMeta.timeline.total')}{' '}
              <strong className="font-display num text-ink-1">{fmtPct(data.totalWinRate, 2)}</strong>
            </span>
            {data.lane && (
              <span className="text-ink-2">
                {t('heroMeta.timeline.lane')} <strong className="text-ink-1">{t(`heroMeta.lane.${data.lane}`)}</strong>
              </span>
            )}
            {best && (
              <span className="text-ink-2">
                {t('heroMeta.timeline.peak')}{' '}
                <strong className="text-ink-1">
                  {best.to == null
                    ? t('heroMeta.minutesPlus', { n: best.from })
                    : t('heroMeta.minutesRange', { from: best.from, to: best.to })}
                </strong>
              </span>
            )}
          </div>
          <div className="h-64 sm:h-72" role="img" aria-label={t('heroMeta.tab.timeline')}>
            <Bar data={chart} options={options} />
          </div>
          <p className="mt-3 text-xs text-ink-3">{t('heroMeta.timeline.hint')}</p>
        </>
      )}
    </div>
  );
}
