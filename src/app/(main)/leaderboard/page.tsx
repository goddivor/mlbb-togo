'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Crown, Flame, Medal, Swords } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { MLBB_ROLES } from '@/lib/constants';
import {
  PageHeader,
  SectionCard,
  Badge,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import RoleIcon from '@/components/game/RoleIcon';
import { useT } from '@/lib/i18n';

type Metric = 'winRate' | 'wins' | 'mvpCount' | 'streak';

const METRICS: { id: Metric; labelKey: string }[] = [
  { id: 'winRate', labelKey: 'leaderboard.metric.winRate' },
  { id: 'wins', labelKey: 'leaderboard.metric.wins' },
  { id: 'mvpCount', labelKey: 'leaderboard.metric.mvp' },
  { id: 'streak', labelKey: 'leaderboard.metric.streak' },
];

/** Value shown in the highlighted column, per metric. */
function metricValue(entry: any, metric: Metric): string {
  if (metric === 'winRate') return `${entry.winRate ?? 0}%`;
  if (metric === 'wins') return String(entry.wins ?? 0);
  if (metric === 'mvpCount') return String(entry.mvpCount ?? 0);
  return String(entry.streak ?? 0);
}

const PODIUM_STYLES = [
  { ring: 'ring-[#FFD700]', chip: 'bg-[#FFD700] text-black', order: 'sm:order-2 sm:-mt-4' },
  { ring: 'ring-[#C0C0C0]', chip: 'bg-[#C0C0C0] text-black', order: 'sm:order-1' },
  { ring: 'ring-[#CD7F32]', chip: 'bg-[#CD7F32] text-white', order: 'sm:order-3' },
];

function PlayerAvatar({ entry, size }: { entry: any; size: number }) {
  const name = entry.displayName || entry.username || '';
  if (entry.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarSrc(entry.avatar, size * 2)}
        alt={name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-stroke dark:border-strokedark"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-primary flex items-center justify-center font-bold text-white"
    >
      {name[0]?.toUpperCase() || 'J'}
    </div>
  );
}

export default function LeaderboardPage() {
  const t = useT();

  const [metric, setMetric] = useState<Metric>('winRate');
  const [role, setRole] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [rankedOnly, setRankedOnly] = useState(true);

  const [seasons, setSeasons] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.esport
      .seasons()
      .then((s: any) => setSeasons(Array.isArray(s) ? s : []))
      .catch(() => setSeasons([]));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    api.users
      .leaderboard({
        metric,
        role: role || undefined,
        seasonId: seasonId || undefined,
        // Win rate is meaningless on a 1-0 record: ask for a real sample.
        minGames: rankedOnly && metric === 'winRate' ? 10 : undefined,
        limit: 100,
      })
      .then((res: any) => {
        setEntries(Array.isArray(res?.entries) ? res.entries : []);
        setTotal(res?.total ?? 0);
      })
      .catch(() => {
        setEntries([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [metric, role, seasonId, rankedOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  const selectClass =
    'py-2 pl-3 pr-8 text-sm rounded-sm bg-gray-2 border border-stroke text-black focus:outline-none focus:border-primary dark:bg-meta-4 dark:border-strokedark dark:text-white';

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('leaderboard.title')}
        subtitle={
          loading
            ? '…'
            : `${total} ${t('leaderboard.rankedPlayers')}`
        }
      />

      {/* Filtres */}
      <SectionCard className="!p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {METRICS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                className={`px-3 py-1.5 text-sm rounded-sm border transition-colors ${
                  metric === m.id
                    ? 'bg-primary border-primary text-white'
                    : 'bg-gray-2 border-stroke text-body hover:border-primary dark:bg-meta-4 dark:border-strokedark dark:text-bodydark'
                }`}
              >
                {t(m.labelKey)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={selectClass}
            >
              <option value="">{t('leaderboard.allRoles')}</option>
              {MLBB_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className={selectClass}
            >
              <option value="">{t('leaderboard.allSeasons')}</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {metric === 'winRate' && (
              <label className="flex items-center gap-2 text-sm text-body dark:text-bodydark cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rankedOnly}
                  onChange={(e) => setRankedOnly(e.target.checked)}
                  className="accent-primary"
                />
                {t('leaderboard.minGames')}
              </label>
            )}
          </div>

          {seasonId && (
            <p className="text-xs text-bodydark2">{t('leaderboard.seasonNote')}</p>
          )}
        </div>
      </SectionCard>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={<Trophy size={26} />} title={t('leaderboard.none')} />
      ) : (
        <>
          {/* Podium */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            {podium.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={PODIUM_STYLES[i].order}
              >
                <Link
                  href={`/players/${e.id}`}
                  className="flex flex-col items-center gap-2 rounded-sm border border-stroke bg-white shadow-default hover:border-primary transition-colors p-5 dark:border-strokedark dark:bg-boxdark"
                >
                  <div className={`relative rounded-full ring-2 ${PODIUM_STYLES[i].ring}`}>
                    <PlayerAvatar entry={e} size={i === 0 ? 76 : 64} />
                    {i === 0 && (
                      <Crown
                        size={22}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 text-[#FFD700]"
                      />
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${PODIUM_STYLES[i].chip}`}
                  >
                    #{e.position}
                  </span>

                  <p className="text-sm font-semibold text-black dark:text-white text-center truncate max-w-full">
                    {e.displayName || e.username}
                  </p>

                  <p className="text-xl font-bold text-primary">
                    {metricValue(e, metric)}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-bodydark2">
                    <RoleIcon role={e.role} size={14} />
                    {hasRankBadge(e.gameRank) && <RankBadge rank={e.gameRank} size={16} />}
                    <span>
                      {e.wins ?? 0}{t('leaderboard.winShort')} / {e.losses ?? 0}{t('leaderboard.lossShort')}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Reste du classement */}
          {rest.length > 0 && (
            <SectionCard className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-2 text-left text-xs uppercase text-bodydark2 dark:bg-meta-4">
                      <th className="py-3 px-4 w-14">#</th>
                      <th className="py-3 px-4">{t('leaderboard.player')}</th>
                      <th className="py-3 px-4 text-center hidden sm:table-cell">
                        {t('leaderboard.role')}
                      </th>
                      <th className="py-3 px-4 text-center hidden md:table-cell">
                        {t('leaderboard.record')}
                      </th>
                      <th className="py-3 px-4 text-center hidden lg:table-cell">
                        <Medal size={14} className="inline" />
                      </th>
                      <th className="py-3 px-4 text-center hidden lg:table-cell">
                        <Flame size={14} className="inline" />
                      </th>
                      <th className="py-3 px-4 text-right">{t(`leaderboard.metric.${
                        metric === 'mvpCount' ? 'mvp' : metric
                      }`)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((e) => (
                      <tr
                        key={e.id}
                        className="border-t border-stroke hover:bg-gray-2 transition-colors dark:border-strokedark dark:hover:bg-meta-4"
                      >
                        <td className="py-3 px-4 font-semibold text-bodydark2">
                          {e.position}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/players/${e.id}`}
                            className="flex items-center gap-2.5 min-w-0 hover:text-primary"
                          >
                            <PlayerAvatar entry={e} size={32} />
                            <span className="font-medium text-black dark:text-white truncate">
                              {e.displayName || e.username}
                            </span>
                            {hasRankBadge(e.gameRank) && (
                              <RankBadge rank={e.gameRank} size={16} />
                            )}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-center hidden sm:table-cell">
                          <RoleIcon role={e.role} size={18} />
                        </td>
                        <td className="py-3 px-4 text-center hidden md:table-cell whitespace-nowrap text-body dark:text-bodydark">
                          {e.wins ?? 0}{t('leaderboard.winShort')} / {e.losses ?? 0}{t('leaderboard.lossShort')}
                        </td>
                        <td className="py-3 px-4 text-center hidden lg:table-cell text-body dark:text-bodydark">
                          {e.mvpCount ?? 0}
                        </td>
                        <td className="py-3 px-4 text-center hidden lg:table-cell">
                          {(e.streak ?? 0) > 0 ? (
                            <Badge variant="success" size="sm">
                              {e.streak}
                            </Badge>
                          ) : (
                            <span className="text-bodydark2">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-primary whitespace-nowrap">
                          {metricValue(e, metric)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {total > entries.length && (
            <p className="text-center text-xs text-bodydark2">
              <Swords size={12} className="inline mr-1" />
              {t('leaderboard.showing')
                .replace('{shown}', String(entries.length))
                .replace('{total}', String(total))}
            </p>
          )}
        </>
      )}
    </div>
  );
}
