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

      {/* En-tête équipe */}
      <Card className="mb-6" hover={false}>
        {team.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.image}
            alt={team.name}
            referrerPolicy="no-referrer"
            className="w-full aspect-video object-cover rounded-xl border border-gaming-border mb-4"
          />
        ) : (
          <div className="w-full aspect-video rounded-xl border border-gaming-border bg-gaming-surface/40 flex items-center justify-center mb-4">
            <Shield size={64} className="text-neon-blue/40" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{team.name}</h1>
          {team.tag && (
            <Badge variant="neon" size="md">
              {team.tag}
            </Badge>
          )}
          {team.isRecruiting && (
            <Badge variant="green" size="md">
              {t('teams.detail.recruiting')}
            </Badge>
          )}
        </div>

        {team.description && (
          <p className="text-sm text-gray-400 mt-2 whitespace-pre-line">{team.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <Users size={15} className="text-neon-blue" />
            {team.memberCount ?? members.length} {t('teams.members')}
          </span>
          {foundedLabel && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={15} className="text-neon-blue" />
              {t('teams.detail.founded')} {foundedLabel}
            </span>
          )}
        </div>
      </Card>

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
    </div>
  );
}
