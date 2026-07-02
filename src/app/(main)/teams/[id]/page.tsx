'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Crown, Users, Calendar, MapPin } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { api, avatarSrc } from '@/lib/api';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import { useT } from '@/lib/i18n';

function MemberCard({ m, t, highlight = false }: any) {
  const u = m?.user || {};
  const name = u.displayName || u.username || '';

  return (
    <Link
      href={`/players/${m.userId}`}
      className={`flex items-center gap-3 rounded-xl border bg-gaming-surface/40 p-3 transition-colors ${
        highlight
          ? 'border-yellow-500/40 hover:border-yellow-400'
          : 'border-gaming-border hover:border-neon-blue'
      }`}
    >
      {u.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc(u.avatar, 96)}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-12 h-12 rounded-xl object-cover border border-gaming-border"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-lg font-bold text-white">
          {name?.[0]?.toUpperCase() || 'J'}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {m.isCaptain && <Crown size={14} className="text-yellow-400 shrink-0" />}
          <p className="text-sm font-semibold text-white truncate">{name}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {m.role && (
            <Badge variant="purple" size="sm">
              {t('lane.' + m.role)}
            </Badge>
          )}
          {hasRankBadge(u.gameRank) && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-300">
              <RankBadge rank={u.gameRank} size={16} />
              {u.gameRank}
            </span>
          )}
        </div>

        {u.country && (
          <span className="inline-flex items-center gap-0.5 text-xs text-gray-500 mt-1">
            <MapPin size={11} /> {u.country}
          </span>
        )}
      </div>
    </Link>
  );
}

function StatBox({ label, value, color = 'text-white' }: any) {
  return (
    <div className="rounded-xl border border-gaming-border bg-gaming-surface/40 p-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function MatchRow({ m, t }: any) {
  const completed = m.status === 'completed';
  const aWin = m.winnerTeamId && m.winnerTeamId === m.teamA?.id;
  const bWin = m.winnerTeamId && m.winnerTeamId === m.teamB?.id;
  let dateLabel = '';
  if (m.scheduledAt) {
    const d = new Date(m.scheduledAt);
    if (!isNaN(d.getTime())) dateLabel = d.toLocaleDateString();
  }
  return (
    <div className="rounded-lg border border-gaming-border bg-gaming-surface/40 p-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
        <span className={`text-right truncate ${aWin ? 'text-neon-gold font-bold' : 'text-white'}`}>
          {m.teamA?.name}
        </span>
        <span className="px-2 text-gray-400 font-semibold shrink-0">
          {completed ? `${m.scoreA} - ${m.scoreB}` : 'vs'}
        </span>
        <span className={`text-left truncate ${bWin ? 'text-neon-gold font-bold' : 'text-white'}`}>
          {m.teamB?.name}
        </span>
      </div>
      <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
        <Badge variant="purple" size="sm">{t('matchType.' + m.type)}</Badge>
        <Badge variant={completed ? 'green' : 'default'} size="sm">{t('matchStatus.' + m.status)}</Badge>
        {dateLabel && <span className="text-xs text-gray-500">{dateLabel}</span>}
      </div>
    </div>
  );
}

export default function TeamDetailPage() {
  const t = useT();
  const params = useParams();
  const id = String(params?.id || '');
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.esport
      .team(id)
      .then(setTeam)
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <Link
          href="/teams"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft size={16} /> {t('teams.back')}
        </Link>
        <p className="text-center text-gray-500 py-20">{t('teams.detail.notFound')}</p>
      </div>
    );
  }

  const members: any[] = Array.isArray(team.members) ? team.members : [];
  const matches: any[] = Array.isArray(team.matches) ? team.matches : [];
  const stats = team.stats || {};
  const captainUserId = team.captain?.id ?? team.captain?.userId;

  // Le capitaine est listé une seule fois, en tête ; on l'exclut des sections.
  const others = members.filter(
    (m) => m.userId !== captainUserId && !m.isCaptain,
  );
  const starters = others.filter((m) => !m.isSubstitute);
  const substitutes = others.filter((m) => m.isSubstitute);

  // Carte du capitaine (depuis members si présent, sinon depuis team.captain).
  const captainMember =
    members.find((m) => m.isCaptain || m.userId === captainUserId) ||
    (team.captain
      ? { userId: captainUserId, isCaptain: true, role: null, user: team.captain }
      : null);

  let foundedLabel = '';
  if (team.foundedAt) {
    const d = new Date(team.foundedAt);
    if (!isNaN(d.getTime())) foundedLabel = d.toLocaleDateString();
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4"
      >
        <ArrowLeft size={16} /> {t('teams.back')}
      </Link>

      {/* Hero compact : image en fond + dégradé, contenu superposé */}
      <div className="relative rounded-2xl overflow-hidden border border-gaming-border mb-5">
        <div className="relative h-44 sm:h-56 w-full bg-gaming-dark">
          {team.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.image}
              alt={team.name}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gaming-surface to-gaming-dark">
              <Shield size={72} className="text-neon-blue/25" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gaming-dark via-gaming-dark/55 to-transparent" />

          <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-2">
            <Badge variant={team.type === 'esport' ? 'gold' : 'default'} size="sm">
              {t('admin.esport.badge.' + (team.type || 'community'))}
            </Badge>
            {team.isRecruiting && (
              <Badge variant="green" size="sm">
                {t('teams.detail.recruiting')}
              </Badge>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">{team.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs sm:text-sm text-gray-200">
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} /> {team.memberCount ?? members.length} {t('teams.members')}
              </span>
              {foundedLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} /> {t('teams.detail.founded')} {foundedLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {team.description && (
        <p className="text-sm text-gray-400 mb-6 whitespace-pre-line">{team.description}</p>
      )}

      {/* Bilan */}
      {stats.played > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-3">{t('teams.detail.record')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label={t('teams.detail.played')} value={stats.played} />
            <StatBox label={t('teams.detail.wins')} value={stats.wins} color="text-green-400" />
            <StatBox label={t('teams.detail.losses')} value={stats.losses} color="text-red-400" />
            <StatBox label={t('teams.detail.winRate')} value={`${stats.winRate ?? 0}%`} color="text-neon-blue" />
          </div>
        </div>
      )}

      {/* Effectif */}
      <Card hover={false}>
        <h2 className="text-lg font-bold text-white mb-4">{t('teams.detail.roster')}</h2>

        {!captainMember && members.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{t('teams.detail.noMembers')}</p>
        ) : (
          <div className="space-y-6">
            {captainMember && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={16} className="text-yellow-400" />
                  <Badge variant="gold" size="sm">
                    {t('teams.detail.captain')}
                  </Badge>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <MemberCard m={captainMember} t={t} highlight />
                </motion.div>
              </div>
            )}

            {starters.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  {t('teams.detail.starters')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {starters.map((m, i) => (
                    <motion.div
                      key={m.id ?? m.userId ?? i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    >
                      <MemberCard m={m} t={t} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {substitutes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  {t('teams.detail.substitutes')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {substitutes.map((m, i) => (
                    <motion.div
                      key={m.id ?? m.userId ?? i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    >
                      <MemberCard m={m} t={t} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Matchs récents */}
      <Card hover={false} className="mt-6">
        <h2 className="text-lg font-bold text-white mb-4">{t('teams.detail.matches')}</h2>
        {matches.length === 0 ? (
          <p className="text-center text-gray-500 py-6">{t('teams.detail.noMatches')}</p>
        ) : (
          <div className="space-y-2">
            {matches.map((m, i) => (
              <motion.div
                key={m.id ?? i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
              >
                <MatchRow m={m} t={t} />
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
