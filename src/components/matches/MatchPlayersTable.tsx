'use client';

import Link from 'next/link';
import { Star, Users } from 'lucide-react';
import RoleIcon from '@/components/game/RoleIcon';
import { avatarSrc, mlbbImg } from '@/lib/api';
import { MatchPlayer, MatchTeam, TFn, TeamLogo, userLabel } from './shared';

const LANE_ORDER = ['roam', 'jungle', 'mid', 'exp', 'gold'];

function kdaLabel(p: MatchPlayer) {
  if (p.kda == null) return '—';
  return Number.isFinite(p.kda) ? p.kda.toFixed(1) : '∞';
}

/** Per-player stats of one team: hero, lane, K / D / A, KDA, MVP star. */
export default function MatchPlayersTable({
  team,
  players,
  won,
  t,
}: {
  team: MatchTeam;
  players: MatchPlayer[];
  won: boolean;
  t: TFn;
}) {
  const rows = [...players].sort((a, b) => {
    const ia = LANE_ORDER.indexOf(a.role || '');
    const ib = LANE_ORDER.indexOf(b.role || '');
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-center gap-3 border-b border-stroke px-4 py-3 dark:border-strokedark">
        <TeamLogo team={team} size="sm" />
        <Link href={`/teams/${team.id}`} className="truncate font-semibold text-black hover:text-primary dark:text-white">
          {team.name}
        </Link>
        {won && (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
            {t('matches.winner')}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-body dark:text-bodydark">
          <Users size={12} /> {rows.length}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-body dark:text-bodydark">{t('matches.players.none')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-body dark:text-bodydark">
                <th className="px-4 py-2 font-medium">{t('matches.players.player')}</th>
                <th className="px-2 py-2 font-medium">{t('matches.players.hero')}</th>
                <th className="px-2 py-2 text-center font-medium">K</th>
                <th className="px-2 py-2 text-center font-medium">D</th>
                <th className="px-2 py-2 text-center font-medium">A</th>
                <th className="px-2 py-2 text-center font-medium">KDA</th>
                <th className="px-4 py-2 text-center font-medium">{t('matches.mvp')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className={`border-t border-stroke dark:border-strokedark ${p.isMvp ? 'bg-warning/5' : ''}`}
                >
                  <td className="px-4 py-2">
                    <Link href={`/players/${p.userId}`} className="flex items-center gap-2 hover:text-primary">
                      {p.user?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarSrc(p.user.avatar, 64)}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                          {userLabel(p.user)[0]?.toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-black dark:text-white">{userLabel(p.user)}</span>
                        {p.role && (
                          <span className="flex items-center gap-1 text-[11px] text-bodydark2">
                            <RoleIcon role={p.role} size={12} /> {t('lane.' + p.role)}
                          </span>
                        )}
                      </span>
                    </Link>
                  </td>
                  <td className="px-2 py-2">
                    <span className="flex items-center gap-2">
                      {p.heroImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mlbbImg(p.heroImage, 64)}
                          alt={p.hero || ''}
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 shrink-0 rounded-full border border-stroke object-cover dark:border-strokedark"
                        />
                      ) : (
                        <span className="h-8 w-8 shrink-0 rounded-full bg-gray-2 dark:bg-meta-4" />
                      )}
                      <span className="truncate text-black dark:text-white">{p.hero || '—'}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center font-semibold tabular-nums text-success">{p.kills}</td>
                  <td className="px-2 py-2 text-center font-semibold tabular-nums text-danger">{p.deaths}</td>
                  <td className="px-2 py-2 text-center font-semibold tabular-nums text-primary">{p.assists}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-black dark:text-white">{kdaLabel(p)}</td>
                  <td className="px-4 py-2 text-center">
                    {p.isMvp && (
                      <Star size={16} className="inline text-warning" fill="currentColor" aria-label={t('matches.mvp')} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
