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
import { Card, EmptyState } from '@/components/ui';
import { useLangStore, useThemeStore } from '@/store/useStore';
import { ResultBadge, TeamChip, SectionTitle, fmtDate, type TFn } from './shared';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const PRIMARY = '#6366f1';

function StatTile({ icon, label, value, accent = 'text-primary' }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4 ${accent}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xl font-bold leading-tight text-black dark:text-white">{value}</p>
          <p className="truncate text-xs text-body dark:text-bodydark">{label}</p>
        </div>
      </div>
    </div>
  );
}

function RecordTable({ rows, firstCol, t, firstRender }: { rows: any[]; firstCol: string; t: TFn; firstRender: (r: any) => React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stroke text-left text-xs uppercase tracking-wide text-body dark:border-strokedark dark:text-bodydark">
            <th className="py-2 pr-2 font-semibold">{firstCol}</th>
            <th className="py-2 px-2 text-center font-semibold" title={t('teams.detail.played')}>{t('teams.stats.colPlayed')}</th>
            <th className="py-2 px-2 text-center font-semibold text-success" title={t('teams.detail.wins')}>{t('teams.stats.colWins')}</th>
            <th className="py-2 px-2 text-center font-semibold text-danger" title={t('teams.detail.losses')}>{t('teams.stats.colLosses')}</th>
            <th className="py-2 px-2 text-center font-semibold" title={t('teams.stats.draws')}>{t('teams.stats.colDraws')}</th>
            <th className="py-2 pl-2 text-right font-semibold" title={t('teams.detail.winRate')}>{t('teams.stats.colWinRate')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-stroke/60 last:border-0 dark:border-strokedark/60">
              <td className="py-2 pr-2 text-black dark:text-white">{firstRender(r)}</td>
              <td className="py-2 px-2 text-center text-body dark:text-bodydark">{r.played}</td>
              <td className="py-2 px-2 text-center font-semibold text-success">{r.wins}</td>
              <td className="py-2 px-2 text-center font-semibold text-danger">{r.losses}</td>
              <td className="py-2 px-2 text-center text-body dark:text-bodydark">{r.draws}</td>
              <td className="py-2 pl-2 text-right font-semibold text-black dark:text-white">{r.winRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
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
          borderColor: PRIMARY,
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: timeline.map((p) => (p.result === 'W' ? '#219653' : p.result === 'L' ? '#D34053' : '#FFA70B')),
          pointBorderColor: dark ? '#24303F' : '#ffffff',
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
          grid: { color: dark ? 'rgba(46,58,71,0.8)' : 'rgba(226,232,240,0.9)' },
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<Swords size={18} />} label={t('teams.detail.played')} value={stats.played} />
        <StatTile icon={<Trophy size={18} />} label={t('teams.detail.wins')} value={stats.wins} accent="text-success" />
        <StatTile icon={<ThumbsDown size={18} />} label={t('teams.detail.losses')} value={stats.losses} accent="text-danger" />
        <StatTile icon={<Percent size={18} />} label={t('teams.detail.winRate')} value={`${stats.winRate}%`} />
      </div>

      {/* Form + streaks */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="!p-4">
          <SectionTitle hint={t('teams.stats.formHint')}>{t('teams.stats.form')}</SectionTitle>
          {form.length === 0 ? (
            <p className="text-sm text-bodydark2">{t('teams.stats.noForm')}</p>
          ) : (
            <div className="flex items-center gap-1.5">
              {form.map((r, i) => <ResultBadge key={i} result={r} t={t} className={i === form.length - 1 ? 'ring-2 ring-primary/40' : ''} />)}
            </div>
          )}
        </Card>
        <Card className="!p-4">
          <SectionTitle>{t('teams.stats.streak')}</SectionTitle>
          <div className="flex items-center gap-2">
            <Flame size={18} className={streak?.type === 'W' ? 'text-success' : streak?.type === 'L' ? 'text-danger' : 'text-bodydark2'} />
            <span className="text-sm font-semibold text-black dark:text-white">{streakLabel}</span>
          </div>
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            {t('teams.stats.bestStreak')} : <span className="font-semibold text-black dark:text-white">{t('teams.stats.bestStreakValue', { n: stats.bestWinStreak ?? 0 })}</span>
          </p>
        </Card>
        <Card className="!p-4">
          <SectionTitle>{t('teams.stats.biggestWin')}</SectionTitle>
          {stats.biggestWin ? (
            <div className="flex items-center gap-3">
              <Zap size={18} className="shrink-0 text-warning" />
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight text-black dark:text-white">
                  {stats.biggestWin.scoreFor} - {stats.biggestWin.scoreAgainst}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-body dark:text-bodydark">
                  <span>{t('teams.schedule.vs')}</span>
                  <TeamChip team={stats.biggestWin.opponent} size={6} />
                </div>
                <p className="mt-0.5 text-xs text-bodydark2">{fmtDate(stats.biggestWin.date, lang)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-bodydark2">{t('teams.stats.noForm')}</p>
          )}
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            {t('teams.stats.scoreDiff')} : <span className={`font-semibold ${stats.scoreDiff > 0 ? 'text-success' : stats.scoreDiff < 0 ? 'text-danger' : 'text-black dark:text-white'}`}>{stats.scoreDiff > 0 ? '+' : ''}{stats.scoreDiff}</span>
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
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {bySeason.length > 0 && (
          <Card className="!p-4">
            <SectionTitle>{t('teams.stats.bySeason')}</SectionTitle>
            <RecordTable
              rows={bySeason}
              t={t}
              firstCol={t('teams.stats.colSeason')}
              firstRender={(r) => (
                <span className="inline-flex items-center gap-1.5">
                  <Award size={14} className={r.seasonId ? 'text-warning' : 'text-bodydark2'} />
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke text-left text-xs uppercase tracking-wide text-body dark:border-strokedark dark:text-bodydark">
                  <th className="py-2 pr-2 font-semibold">{t('teams.stats.colOpponent')}</th>
                  <th className="py-2 px-2 text-center font-semibold">{t('teams.stats.colPlayed')}</th>
                  <th className="py-2 px-2 text-center font-semibold text-success">{t('teams.stats.colWins')}</th>
                  <th className="py-2 px-2 text-center font-semibold text-danger">{t('teams.stats.colLosses')}</th>
                  <th className="py-2 px-2 text-center font-semibold">{t('teams.stats.colWinRate')}</th>
                  <th className="py-2 pl-2 text-right font-semibold">{t('teams.stats.lastMeeting')}</th>
                </tr>
              </thead>
              <tbody>
                {h2h.map((r) => (
                  <tr key={r.opponent?.id} className="border-b border-stroke/60 last:border-0 dark:border-strokedark/60">
                    <td className="py-2 pr-2"><TeamChip team={r.opponent} size={6} /></td>
                    <td className="py-2 px-2 text-center text-body dark:text-bodydark">{r.played}</td>
                    <td className="py-2 px-2 text-center font-semibold text-success">{r.wins}</td>
                    <td className="py-2 px-2 text-center font-semibold text-danger">{r.losses}</td>
                    <td className="py-2 px-2 text-center font-semibold text-black dark:text-white">{r.winRate}%</td>
                    <td className="py-2 pl-2 text-right">
                      {r.last && (
                        <span className="inline-flex items-center gap-2">
                          <span className="hidden text-xs text-bodydark2 sm:inline">{fmtDate(r.last.date, lang)}</span>
                          <ResultBadge result={r.last.result} t={t} />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
