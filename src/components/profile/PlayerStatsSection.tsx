'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  Crown,
  Flame,
  Lock,
  Medal,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, Badge, ProgressBar, SectionTitle, Skeleton, StatCard } from '@/components/ui';
import { cn } from '@/lib/helpers';
import RoleIcon from '@/components/game/RoleIcon';
import { api, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore, useThemeStore } from '@/store/useStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// All badge keys the backend can award, in display order. Icon per key.
const BADGES: Array<{ key: string; icon: React.ReactNode }> = [
  { key: 'first_win', icon: <Trophy size={18} /> },
  { key: 'wins_10', icon: <Trophy size={18} /> },
  { key: 'wins_25', icon: <Medal size={18} /> },
  { key: 'wins_50', icon: <Crown size={18} /> },
  { key: 'games_10', icon: <Swords size={18} /> },
  { key: 'games_50', icon: <Shield size={18} /> },
  { key: 'games_100', icon: <Sparkles size={18} /> },
  { key: 'mvp_1', icon: <Star size={18} /> },
  { key: 'mvp_5', icon: <Star size={18} /> },
  { key: 'mvp_10', icon: <Award size={18} /> },
  { key: 'streak_3', icon: <Flame size={18} /> },
  { key: 'streak_5', icon: <Flame size={18} /> },
  { key: 'streak_10', icon: <Zap size={18} /> },
  { key: 'kda_3', icon: <Target size={18} /> },
  { key: 'kda_5', icon: <Target size={18} /> },
  { key: 'hero_master', icon: <Crown size={18} /> },
  { key: 'flex', icon: <BarChart3 size={18} /> },
];

const RESULT_CLS: Record<string, string> = {
  win: 'bg-accent-green text-white',
  loss: 'bg-accent-red text-white',
  draw: 'bg-surface-3 text-ink-2',
};

function monthLabel(key: string, lang: string) {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}

function useChartTheme() {
  const theme = useThemeStore((s: any) => s.theme);
  const dark = theme === 'dark';
  return {
    dark,
    // Single-series lines: the design-system accents, readable on both surfaces.
    blue: dark ? '#22d3ee' : '#0891b2',
    amber: dark ? '#f2b544' : '#b45309',
    grid: dark ? 'rgba(174,183,192,0.12)' : 'rgba(100,116,139,0.15)',
    tick: dark ? '#AEB7C0' : '#64748B',
  };
}

function TrendChart({
  labels,
  values,
  color,
  suffix = '',
  max,
  extra,
}: {
  labels: string[];
  values: number[];
  color: string;
  suffix?: string;
  max?: number;
  extra?: (i: number) => string[];
}) {
  const th = useChartTheme();
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: values,
          borderColor: color,
          backgroundColor: color + '22',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: color,
          pointBorderColor: th.dark ? '#0f1524' : '#ffffff',
          pointBorderWidth: 2,
          fill: true,
          tension: 0.3,
        },
      ],
    }),
    [labels, values, color, th.dark],
  );
  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => `${ctx.parsed.y}${suffix}`,
            afterBody: (items: any[]) => (extra && items[0] ? extra(items[0].dataIndex) : []),
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: th.tick, font: { size: 11 } } },
        y: {
          beginAtZero: true,
          max,
          grid: { color: th.grid },
          ticks: { color: th.tick, font: { size: 11 }, callback: (v: any) => `${v}${suffix}` },
        },
      },
    }),
    [th, suffix, max, extra],
  );
  return (
    <div className="h-56">
      <Line data={data} options={options as any} />
    </div>
  );
}

export default function PlayerStatsSection({ userId }: { userId: string }) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const th = useChartTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.users
      .stats(userId)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const byMonth: any[] = stats?.byMonth || [];
  const labels = byMonth.map((p) => monthLabel(p.key, lang));

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (!stats) return null;

  const earned = new Set<string>(stats.earnedBadges || []);
  const hasGames = stats.games > 0;
  const streak = stats.currentStreak ?? 0;

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow={t('nav.section.esport')} title={t('stats.title')} description={t('stats.subtitle')} />

      {!hasGames ? (
        <Card className="py-8 text-center text-sm text-ink-3">
          {t('stats.none')}
        </Card>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              icon={<Swords size={18} />}
              value={stats.games}
              label={t('stats.games')}
              hint={t('stats.record', { wins: stats.wins, losses: stats.losses })}
              sparkline={byMonth.length >= 2 ? byMonth.map((p) => p.games) : undefined}
            />
            <StatCard
              icon={<Trophy size={18} />}
              value={`${stats.winRate}%`}
              label={t('stats.winRate')}
              accent="green"
              sparkline={byMonth.length >= 2 ? byMonth.map((p) => p.winRate) : undefined}
            />
            <StatCard
              icon={<Star size={18} />}
              value={stats.mvpCount}
              label={t('stats.mvp')}
              hint={t('stats.mvpRate', {
                rate: stats.games ? Math.round((stats.mvpCount / stats.games) * 100) : 0,
              })}
              accent="gold"
            />
            <StatCard
              icon={<Target size={18} />}
              value={stats.kda}
              label={t('stats.kda')}
              hint={t('stats.avgKda', {
                k: stats.avgKills,
                d: stats.avgDeaths,
                a: stats.avgAssists,
              })}
              accent="violet"
              sparkline={byMonth.length >= 2 ? byMonth.map((p) => p.kda) : undefined}
            />
          </div>

          {/* Form and streaks */}
          <Card>
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
              <div className="flex-1">
                <SectionTitle size="sm" title={t('stats.form')} description={t('stats.formHint')} />
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(stats.form || []).map((r: string, i: number) => (
                    <span
                      key={i}
                      title={t(`stats.result.${r}`)}
                      className={cn('inline-flex h-7 w-7 items-center justify-center rounded cut-corners-sm text-xs font-bold', RESULT_CLS[r] || RESULT_CLS.draw)}
                    >
                      {t(`stats.letter.${r}`)}
                    </span>
                  ))}
                  <span className="ml-2 self-center font-display text-sm font-bold num text-ink-1">{stats.formWinRate}%</span>
                </div>
              </div>
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('stats.streak')}</p>
                  <p className={cn('font-display text-xl font-bold num', streak > 0 ? 'text-accent-green' : streak < 0 ? 'text-accent-red' : 'text-ink-1')}>
                    {streak === 1
                      ? t('stats.winOne')
                      : streak > 1
                        ? t('stats.winsShort', { n: streak })
                        : streak === -1
                          ? t('stats.lossOne')
                          : streak < -1
                            ? t('stats.lossesShort', { n: -streak })
                            : '0'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('stats.bestStreak')}</p>
                  <p className="inline-flex items-center gap-1 font-display text-xl font-bold num text-ink-1">
                    <Flame size={18} className="text-accent-gold" /> {stats.bestStreak}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <SectionTitle size="sm" title={t('stats.chart.winRate')} className="mb-3" />
              {byMonth.length >= 2 ? (
                <TrendChart
                  labels={labels}
                  values={byMonth.map((p) => p.winRate)}
                  color={th.blue}
                  suffix="%"
                  max={100}
                  extra={(i) => [
                    `${t('stats.chart.games')}: ${byMonth[i].games}`,
                    `${t('stats.chart.wins')}: ${byMonth[i].wins}`,
                  ]}
                />
              ) : (
                <p className="py-8 text-center text-sm text-ink-3">{t('stats.chart.empty')}</p>
              )}
            </Card>
            <Card>
              <SectionTitle size="sm" title={t('stats.chart.kda')} className="mb-3" />
              {byMonth.length >= 2 ? (
                <TrendChart
                  labels={labels}
                  values={byMonth.map((p) => p.kda)}
                  color={th.amber}
                  extra={(i) => [
                    `${t('stats.chart.kills')}: ${byMonth[i].kills}`,
                    `${t('stats.chart.deaths')}: ${byMonth[i].deaths}`,
                    `${t('stats.chart.assists')}: ${byMonth[i].assists}`,
                  ]}
                />
              ) : (
                <p className="py-8 text-center text-sm text-ink-3">{t('stats.chart.empty')}</p>
              )}
            </Card>
          </div>

          {/* Seasons, heroes, roles */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {stats.bySeason?.length > 0 && (
              <Card>
                <SectionTitle size="sm" title={t('stats.bySeason')} className="mb-3" />
                <ul className="divide-y divide-line-subtle">
                  {stats.bySeason.map((s: any) => (
                    <li key={s.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="truncate font-medium text-ink-1">{s.label || t('stats.noSeason')}</span>
                      <span className="shrink-0 num text-ink-2">
                        {t('stats.gamesCount', { n: s.games })} ·{' '}
                        <span className={cn('font-semibold', s.winRate >= 50 ? 'text-accent-green' : 'text-accent-red')}>{s.winRate}%</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <Card className={stats.bySeason?.length ? '' : 'xl:col-span-2'}>
              <SectionTitle size="sm" title={t('stats.heroes')} className="mb-3" />
              <div className="space-y-2">
                {stats.heroes.slice(0, 8).map((h: any) => (
                  <div
                    key={h.key}
                    className="flex items-center gap-3 rounded border border-line-subtle bg-surface-2/40 p-2"
                  >
                    {h.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mlbbImg(h.image, 80)}
                        alt={h.key}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 shrink-0 rounded cut-corners-sm bg-surface-3 object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded cut-corners-sm bg-surface-3" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-1">{h.key}</p>
                      <p className="text-xs num text-ink-2">
                        {t('stats.gamesCount', { n: h.games })} · KDA {h.kda}
                        {h.mvp > 0 && ` · ${h.mvp} MVP`}
                      </p>
                    </div>
                    <span className={cn('shrink-0 font-display text-sm font-bold num', h.winRate >= 50 ? 'text-accent-green' : 'text-accent-red')}>
                      {h.winRate}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle size="sm" title={t('stats.roles')} className="mb-3" />
              {stats.roles.length === 0 ? (
                <p className="text-sm text-ink-3">{t('stats.chart.empty')}</p>
              ) : (
                <ul className="space-y-3">
                  {stats.roles.map((r: any) => (
                    <li key={r.key}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2 font-medium text-ink-1">
                          <RoleIcon role={r.key} size={16} /> {t(`lane.${r.key}`)}
                        </span>
                        <span className="num text-ink-2">
                          {t('stats.gamesCount', { n: r.games })} ·{' '}
                          <span className={cn('font-semibold', r.winRate >= 50 ? 'text-accent-green' : 'text-accent-red')}>{r.winRate}%</span>
                        </span>
                      </div>
                      <ProgressBar value={r.games} max={stats.games} className="h-1.5" label={t(`lane.${r.key}`)} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}

      {/* Badges */}
      <Card>
        <SectionTitle
          size="sm"
          title={t('stats.badges')}
          className="mb-4"
          action={
            <Badge variant="gold" size="sm">
              {t('stats.badgesCount', { n: earned.size, total: BADGES.length })}
            </Badge>
          }
        />
        {earned.size === 0 && (
          <p className="mb-4 text-sm text-ink-3">{t('stats.badgesNone')}</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {BADGES.map((b) => {
            const ok = earned.has(b.key);
            return (
              <div
                key={b.key}
                title={t(`stats.badge.${b.key}.desc`)}
                className={cn(
                  'flex items-start gap-3 rounded border p-3',
                  ok ? 'tier-gold' : 'border-line-subtle bg-surface-2/40 opacity-60'
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded cut-corners-sm',
                    ok ? 'bg-accent-gold/15 text-accent-gold' : 'bg-surface-3 text-ink-3'
                  )}
                >
                  {ok ? b.icon : <Lock size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-1">{t(`stats.badge.${b.key}`)}</p>
                  <p className="text-[11px] leading-snug text-ink-2">
                    {ok ? t(`stats.badge.${b.key}.desc`) : t('stats.locked')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
