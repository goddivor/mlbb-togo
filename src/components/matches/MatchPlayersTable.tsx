'use client';

import Link from 'next/link';
import { Star, Users } from 'lucide-react';
import RoleIcon from '@/components/game/RoleIcon';
import { avatarSrc, mlbbImg } from '@/lib/api';
import { Badge, Table, Td, Th } from '@/components/ui';
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
    <div className={`overflow-hidden rounded-lg border bg-surface-1 shadow-elev-1 ${won ? 'border-accent-green/40' : 'border-line-subtle'}`}>
      <div className="flex items-center gap-3 border-b border-line-subtle px-4 py-3">
        <TeamLogo team={team} size="sm" />
        <Link href={`/teams/${team.id}`} className="truncate font-display font-bold text-ink-1 hover:text-primary">
          {team.name}
        </Link>
        {won && (
          <Badge variant="green" size="sm">{t('matches.winner')}</Badge>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-xs num text-ink-2">
          <Users size={12} /> {rows.length}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-3">{t('matches.players.none')}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[520px]">
            <thead className="bg-surface-2">
              <tr className="border-b border-line-subtle">
                <Th className="px-4">{t('matches.players.player')}</Th>
                <Th className="px-2">{t('matches.players.hero')}</Th>
                <Th align="center" className="px-2 text-accent-green">K</Th>
                <Th align="center" className="px-2 text-accent-red">D</Th>
                <Th align="center" className="px-2 text-accent-cyan">A</Th>
                <Th align="center" className="px-2">KDA</Th>
                <Th align="center" className="px-4">{t('matches.mvp')}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-line-subtle last:border-b-0 transition-colors hover:bg-surface-2/60 ${p.isMvp ? 'bg-accent-gold/5' : ''}`}
                >
                  <Td className="px-4 py-2">
                    <Link href={`/players/${p.userId}`} className="flex items-center gap-2 hover:text-primary">
                      {p.user?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarSrc(p.user.avatar, 64)}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 shrink-0 rounded cut-corners-sm object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded cut-corners-sm bg-surface-3 text-xs font-bold text-ink-2">
                          {userLabel(p.user)[0]?.toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink-1">{userLabel(p.user)}</span>
                        {p.role && (
                          <span className="flex items-center gap-1 text-[11px] text-ink-3">
                            <RoleIcon role={p.role} size={12} /> {t('lane.' + p.role)}
                          </span>
                        )}
                      </span>
                    </Link>
                  </Td>
                  <Td className="px-2 py-2">
                    <span className="flex items-center gap-2">
                      {p.heroImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mlbbImg(p.heroImage, 64)}
                          alt={p.hero || ''}
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 shrink-0 rounded cut-corners-sm object-cover ring-1 ring-inset ring-line-subtle"
                        />
                      ) : (
                        <span className="h-8 w-8 shrink-0 rounded cut-corners-sm bg-surface-3" />
                      )}
                      <span className="truncate text-ink-1">{p.hero || '—'}</span>
                    </span>
                  </Td>
                  <Td align="center" className="px-2 py-2 font-semibold text-accent-green">{p.kills}</Td>
                  <Td align="center" className="px-2 py-2 font-semibold text-accent-red">{p.deaths}</Td>
                  <Td align="center" className="px-2 py-2 font-semibold text-accent-cyan">{p.assists}</Td>
                  <Td align="center" className="px-2 py-2 font-display font-bold">{kdaLabel(p)}</Td>
                  <Td align="center" className="px-4 py-2">
                    {p.isMvp && (
                      <Star size={16} className="inline text-accent-gold" fill="currentColor" aria-label={t('matches.mvp')} />
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
