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
import { Card, Badge, StatCard, LoadingSpinner } from '@/components/ui';
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
  win: 'bg-success text-white',
  loss: 'bg-danger text-white',
  draw: 'bg-gray text-body dark:bg-meta-4 dark:text-bodydark',
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
    // Single-series lines: one hue each, stepped lighter on the dark surface.
    blue: dark ? '#8A98FF' : '#3C50E0',
    amber: dark ? '#E8A000' : '#D97706',
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
          pointBorderColor: th.dark ? '#24303F' : '#ffffff',
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
      <Card hover={false} className="flex items-center justify-center py-10">
        <LoadingSpinner size="md" />
      </Card>
    );
  }
  if (!stats) return null;

  const earned = new Set<string>(stats.earnedBadges || []);
  const hasGames = stats.games > 0;
  const streak = stats.currentStreak ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-black dark:text-white">{t('stats.title')}</h2>
        <p className="text-sm text-body dark:text-bodydark">{t('stats.subtitle')}</p>
      </div>

      {!hasGames ? (
        <Card hover={false} className="text-center py-8 text-bodydark2">
          {t('stats.none')}
        </Card>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              icon={<Swords size={20} />}
              value={stats.games}
              label={`${t('stats.games')} · ${t('stats.record', { wins: stats.wins, losses: stats.losses })}`}
            />
            <StatCard
              icon={<Trophy size={20} />}
              value={`${stats.winRate}%`}
              label={t('stats.winRate')}
            />
            <StatCard
              icon={<Star size={20} />}
              value={stats.mvpCount}
              label={`${t('stats.mvp')} · ${t('stats.mvpRate', {
                rate: stats.games ? Math.round((stats.mvpCount / stats.games) * 100) : 0,
              })}`}
            />
            <StatCard
              icon={<Target size={20} />}
              value={stats.kda}
              label={`${t('stats.kda')} · ${t('stats.avgKda', {
                k: stats.avgKills,
                d: stats.avgDeaths,
                a: stats.avgAssists,
              })}`}
            />
          </div>

          {/* Form and streaks */}
          <Card hover={false}>
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
              <div className="flex-1">
                <h3 className="font-bold text-black dark:text-white">
                  {t('stats.form')}{' '}
                  <span className="text-xs font-normal text-body dark:text-bodydark">({t('stats.formHint')})</span>
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(stats.form || []).map((r: string, i: number) => (
                    <span
                      key={i}
                      title={t(`stats.result.${r}`)}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${RESULT_CLS[r] || RESULT_CLS.draw}`}
                    >
                      {t(`stats.letter.${r}`)}
                    </span>
                  ))}
                  <span className="self-center ml-2 text-sm text-body dark:text-bodydark">{stats.formWinRate}%</span>
                </div>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-body dark:text-bodydark">{t('stats.streak')}</p>
                  <p className={`text-xl font-bold ${streak > 0 ? 'text-success' : streak < 0 ? 'text-danger' : 'text-black dark:text-white'}`}>
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
                  <p className="text-xs uppercase tracking-wide text-body dark:text-bodydark">{t('stats.bestStreak')}</p>
                  <p className="text-xl font-bold text-black dark:text-white inline-flex items-center gap-1">
                    <Flame size={18} className="text-warning" /> {stats.bestStreak}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card hover={false}>
              <h3 className="font-bold text-black dark:text-white mb-3">{t('stats.chart.winRate')}</h3>
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
                <p className="text-sm text-bodydark2 py-8 text-center">{t('stats.chart.empty')}</p>
              )}
            </Card>
            <Card hover={false}>
              <h3 className="font-bold text-black dark:text-white mb-3">{t('stats.chart.kda')}</h3>
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
                <p className="text-sm text-bodydark2 py-8 text-center">{t('stats.chart.empty')}</p>
              )}
            </Card>
          </div>

          {/* Seasons, heroes, roles */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {stats.bySeason?.length > 0 && (
              <Card hover={false}>
                <h3 className="font-bold text-black dark:text-white mb-3">{t('stats.bySeason')}</h3>
                <ul className="space-y-2">
                  {stats.bySeason.map((s: any) => (
                    <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-black dark:text-white">{s.label || t('stats.noSeason')}</span>
                      <span className="shrink-0 text-body dark:text-bodydark">
                        {t('stats.gamesCount', { n: s.games })} ·{' '}
                        <span className={s.winRate >= 50 ? 'text-success' : 'text-danger'}>{s.winRate}%</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <Card hover={false} className={stats.bySeason?.length ? '' : 'xl:col-span-2'}>
              <h3 className="font-bold text-black dark:text-white mb-3">{t('stats.heroes')}</h3>
              <div className="space-y-2">
                {stats.heroes.slice(0, 8).map((h: any) => (
                  <div
                    key={h.key}
                    className="flex items-center gap-3 rounded-sm border border-stroke bg-gray-2 p-2 dark:border-strokedark dark:bg-meta-4"
                  >
                    {h.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mlbbImg(h.image, 80)}
                        alt={h.key}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-sm object-cover bg-gray dark:bg-boxdark shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-sm bg-gray dark:bg-boxdark shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-black dark:text-white truncate">{h.key}</p>
                      <p className="text-xs text-body dark:text-bodydark">
                        {t('stats.gamesCount', { n: h.games })} · KDA {h.kda}
                        {h.mvp > 0 && ` · ${h.mvp} MVP`}
                      </p>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${h.winRate >= 50 ? 'text-success' : 'text-danger'}`}>
                      {h.winRate}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card hover={false}>
              <h3 className="font-bold text-black dark:text-white mb-3">{t('stats.roles')}</h3>
              {stats.roles.length === 0 ? (
                <p className="text-sm text-bodydark2">{t('stats.chart.empty')}</p>
              ) : (
                <ul className="space-y-3">
                  {stats.roles.map((r: any) => (
                    <li key={r.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="inline-flex items-center gap-2 text-black dark:text-white">
                          <RoleIcon role={r.key} size={16} /> {t(`lane.${r.key}`)}
                        </span>
                        <span className="text-body dark:text-bodydark">
                          {t('stats.gamesCount', { n: r.games })} ·{' '}
                          <span className={r.winRate >= 50 ? 'text-success' : 'text-danger'}>{r.winRate}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray dark:bg-meta-4">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${Math.round((r.games / stats.games) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}

      {/* Badges */}
      <Card hover={false}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-black dark:text-white">{t('stats.badges')}</h3>
          <Badge variant="gold" size="sm">
            {t('stats.badgesCount', { n: earned.size, total: BADGES.length })}
          </Badge>
        </div>
        {earned.size === 0 && (
          <p className="text-sm text-bodydark2 mb-4">{t('stats.badgesNone')}</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {BADGES.map((b) => {
            const ok = earned.has(b.key);
            return (
              <div
                key={b.key}
                title={t(`stats.badge.${b.key}.desc`)}
                className={`flex items-start gap-3 rounded-sm border p-3 ${
                  ok
                    ? 'border-warning/40 bg-warning/5 dark:bg-warning/10'
                    : 'border-stroke bg-gray-2 opacity-60 dark:border-strokedark dark:bg-meta-4'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    ok ? 'bg-warning/15 text-warning' : 'bg-gray text-bodydark2 dark:bg-boxdark'
                  }`}
                >
                  {ok ? b.icon : <Lock size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-black dark:text-white truncate">{t(`stats.badge.${b.key}`)}</p>
                  <p className="text-[11px] leading-snug text-body dark:text-bodydark">
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
