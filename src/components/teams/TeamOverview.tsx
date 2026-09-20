'use client';

import { useMemo } from 'react';
import { Swords, Trophy, ThumbsDown, Percent, Flame, Award, Zap } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, EmptyState, StatCard, Table, Td, Th } from '@/components/ui';
import { cn } from '@/lib/helpers';
import { useLangStore, useThemeStore } from '@/store/useStore';
import { ResultBadge, TeamChip, SectionTitle, fmtDate, type TFn } from './shared';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const LINE_DARK = '#22d3ee';
const LINE_LIGHT = '#0891b2';

function RecordTable({ rows, firstCol, t, firstRender }: { rows: any[]; firstCol: string; t: TFn; firstRender: (r: any) => React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          <tr className="border-b border-line-subtle">
            <Th className="pl-0">{firstCol}</Th>
            <Th align="center" title={t('teams.detail.played')}>{t('teams.stats.colPlayed')}</Th>
            <Th align="center" className="text-accent-green" title={t('teams.detail.wins')}>{t('teams.stats.colWins')}</Th>
            <Th align="center" className="text-accent-red" title={t('teams.detail.losses')}>{t('teams.stats.colLosses')}</Th>
            <Th align="center" title={t('teams.stats.draws')}>{t('teams.stats.colDraws')}</Th>
            <Th align="right" className="pr-0" title={t('teams.detail.winRate')}>{t('teams.stats.colWinRate')}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line-subtle last:border-0">
              <Td className="pl-0 py-2">{firstRender(r)}</Td>
              <Td align="center" className="py-2 text-ink-2">{r.played}</Td>
              <Td align="center" className="py-2 font-semibold text-accent-green">{r.wins}</Td>
              <Td align="center" className="py-2 font-semibold text-accent-red">{r.losses}</Td>
              <Td align="center" className="py-2 text-ink-2">{r.draws}</Td>
              <Td align="right" className="pr-0 py-2 font-display font-bold">{r.winRate}%</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default function TeamOverview({ stats, t }: { stats: any; t: TFn }) {
  const lang = useLangStore((s: any) => s.lang);
  const theme = useThemeStore((s: any) => s.theme);
  const dark = theme === 'dark';

  const timeline: any[] = Array.isArray(stats?.timeline) ? stats.timeline : [];

  const chartData = useMemo(
    () => ({
      labels: timeline.map((p) => fmtDate(p.date, lang, { day: '2-digit', month: 'short' }) || '·'),
      datasets: [
        {
          label: t('teams.stats.chartLabel'),
          data: timeline.map((p) => p.winRate),
          borderColor: dark ? LINE_DARK : LINE_LIGHT,
          backgroundColor: dark ? 'rgba(34, 211, 238, 0.12)' : 'rgba(8, 145, 178, 0.12)',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: timeline.map((p) => (p.result === 'W' ? '#22c55e' : p.result === 'L' ? '#ef4444' : '#f2b544')),
          pointBorderColor: dark ? '#0f1524' : '#ffffff',
          pointBorderWidth: 2,
          fill: true,
          tension: 0.3,
        },
      ],
    }),
    [timeline, lang, dark, t],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items: any[]) => {
              const p = timeline[items[0]?.dataIndex ?? 0];
              return p ? fmtDate(p.date, lang) : '';
            },
            label: (item: any) => {
              const p = timeline[item.dataIndex];
              return `${t('teams.result.' + (p?.result || 'D'))} · ${item.parsed.y}%`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: dark ? '#AEB7C0' : '#64748B', maxRotation: 0, autoSkip: true } },
        y: {
          min: 0,
          max: 100,
          grid: { color: dark ? 'rgba(174,183,192,0.12)' : 'rgba(100,116,139,0.15)' },
          ticks: { color: dark ? '#AEB7C0' : '#64748B', stepSize: 25, callback: (v: any) => `${v}%` },
        },
      },
    }),
    [timeline, lang, dark, t],
  );

  if (!stats || !stats.played) {
    return <EmptyState icon={<Swords size={28} />} title={t('teams.stats.noData')} />;
  }

  const form: string[] = Array.isArray(stats.form) ? stats.form : [];
  const streak = stats.currentStreak;
  const streakLabel = !streak
    ? t('teams.stats.noStreak')
    : streak.type === 'W'
      ? t('teams.stats.streakWin', { n: streak.count })
      : streak.type === 'L'
        ? t('teams.stats.streakLoss', { n: streak.count })
        : t('teams.stats.streakDraw', { n: streak.count });
  const bySeason: any[] = Array.isArray(stats.bySeason) ? stats.bySeason : [];
  const byType: any[] = Array.isArray(stats.byType) ? stats.byType : [];
  const h2h: any[] = Array.isArray(stats.headToHead) ? stats.headToHead : [];

  return (
    <div className="space-y-6">
      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={<Swords size={18} />} label={t('teams.detail.played')} value={stats.played} />
        <StatCard icon={<Trophy size={18} />} label={t('teams.detail.wins')} value={stats.wins} accent="green" />
        <StatCard icon={<ThumbsDown size={18} />} label={t('teams.detail.losses')} value={stats.losses} accent="red" />
        <StatCard icon={<Percent size={18} />} label={t('teams.detail.winRate')} value={`${stats.winRate}%`} accent="gold" sparkline={timeline.length > 1 ? timeline.map((p) => p.winRate) : undefined} />
      </div>

      {/* Form + streaks */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="!p-4">
          <SectionTitle hint={t('teams.stats.formHint')}>{t('teams.stats.form')}</SectionTitle>
          {form.length === 0 ? (
            <p className="text-sm text-ink-3">{t('teams.stats.noForm')}</p>
          ) : (
            <div className="flex items-center gap-1.5">
              {form.map((r, i) => <ResultBadge key={i} result={r} t={t} className={i === form.length - 1 ? 'ring-2 ring-primary/40' : ''} />)}
            </div>
          )}
        </Card>
        <Card className="!p-4">
          <SectionTitle>{t('teams.stats.streak')}</SectionTitle>
          <div className="flex items-center gap-2">
            <Flame size={18} className={streak?.type === 'W' ? 'text-accent-green' : streak?.type === 'L' ? 'text-accent-red' : 'text-ink-3'} />
            <span className="font-display text-base font-bold text-ink-1">{streakLabel}</span>
          </div>
          <p className="mt-2 text-xs text-ink-2">
            {t('teams.stats.bestStreak')} : <span className="font-semibold num text-ink-1">{t('teams.stats.bestStreakValue', { n: stats.bestWinStreak ?? 0 })}</span>
          </p>
        </Card>
        <Card className="!p-4">
          <SectionTitle>{t('teams.stats.biggestWin')}</SectionTitle>
          {stats.biggestWin ? (
            <div className="flex items-center gap-3">
              <Zap size={18} className="shrink-0 text-accent-gold" />
              <div className="min-w-0">
                <p className="font-display text-lg font-bold leading-tight num text-ink-1">
                  {stats.biggestWin.scoreFor} - {stats.biggestWin.scoreAgainst}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-2">
                  <span>{t('teams.schedule.vs')}</span>
                  <TeamChip team={stats.biggestWin.opponent} size={6} />
                </div>
                <p className="mt-0.5 text-xs num text-ink-3">{fmtDate(stats.biggestWin.date, lang)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-3">{t('teams.stats.noForm')}</p>
          )}
          <p className="mt-2 text-xs text-ink-2">
            {t('teams.stats.scoreDiff')} : <span className={cn('font-semibold num', stats.scoreDiff > 0 ? 'text-accent-green' : stats.scoreDiff < 0 ? 'text-accent-red' : 'text-ink-1')}>{stats.scoreDiff > 0 ? '+' : ''}{stats.scoreDiff}</span>
          </p>
        </Card>
      </div>

      {/* Win-rate chart */}
      {timeline.length > 1 && (
        <Card className="!p-4">
          <SectionTitle hint={t('teams.stats.chartHint')}>{t('teams.stats.chartTitle')}</SectionTitle>
          <div className="h-56 w-full sm:h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card>
      )}

      {/* Per season / per type */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {bySeason.length > 0 && (
          <Card className="!p-4">
            <SectionTitle>{t('teams.stats.bySeason')}</SectionTitle>
            <RecordTable
              rows={bySeason}
              t={t}
              firstCol={t('teams.stats.colSeason')}
              firstRender={(r) => (
                <span className="inline-flex items-center gap-1.5">
                  <Award size={14} className={r.seasonId ? 'text-accent-gold' : 'text-ink-3'} />
                  {r.season || t('teams.stats.noSeason')}
                </span>
              )}
            />
          </Card>
        )}
        {byType.length > 0 && (
          <Card className="!p-4">
            <SectionTitle>{t('teams.stats.byType')}</SectionTitle>
            <RecordTable rows={byType} t={t} firstCol={t('teams.stats.colType')} firstRender={(r) => t('matchType.' + r.type)} />
          </Card>
        )}
      </div>

      {/* Head-to-head */}
      {h2h.length > 0 && (
        <Card className="!p-4">
          <SectionTitle hint={t('teams.stats.headToHeadHint')}>{t('teams.stats.headToHead')}</SectionTitle>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="border-b border-line-subtle">
                  <Th className="pl-0">{t('teams.stats.colOpponent')}</Th>
                  <Th align="center">{t('teams.stats.colPlayed')}</Th>
                  <Th align="center" className="text-accent-green">{t('teams.stats.colWins')}</Th>
                  <Th align="center" className="text-accent-red">{t('teams.stats.colLosses')}</Th>
                  <Th align="center">{t('teams.stats.colWinRate')}</Th>
                  <Th align="right" className="pr-0">{t('teams.stats.lastMeeting')}</Th>
                </tr>
              </thead>
              <tbody>
                {h2h.map((r) => (
                  <tr key={r.opponent?.id} className="border-b border-line-subtle last:border-0">
                    <Td className="pl-0 py-2"><TeamChip team={r.opponent} size={6} /></Td>
                    <Td align="center" className="py-2 text-ink-2">{r.played}</Td>
                    <Td align="center" className="py-2 font-semibold text-accent-green">{r.wins}</Td>
                    <Td align="center" className="py-2 font-semibold text-accent-red">{r.losses}</Td>
                    <Td align="center" className="py-2 font-display font-bold">{r.winRate}%</Td>
                    <Td align="right" className="pr-0 py-2">
                      {r.last && (
                        <span className="inline-flex items-center gap-2">
                          <span className="hidden text-xs num text-ink-3 sm:inline">{fmtDate(r.last.date, lang)}</span>
                          <ResultBadge result={r.last.result} t={t} />
                        </span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
