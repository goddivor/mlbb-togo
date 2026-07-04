'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  MapPin, Calendar, Trophy, Star, Flame, Target, Edit,
  Shield, Swords, Crown, Award, TrendingUp,
} from 'lucide-react';
import { Card, Badge, Avatar, Button, Tabs, StatCard, ProgressBar, LoadingSpinner, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { MLBB_RANKS, MLBB_ROLES, BADGES } from '@/lib/constants';
import { calculateWinRate, getRankName, formatDate } from '@/lib/helpers';
import { useT } from '@/lib/i18n';

function ProfileView({ player }: { player: any }) {
  const t = useT();
  const [activeTab, setActiveTab] = useState('stats');
  const [isEditing, setIsEditing] = useState(false);
  const [team, setTeam] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    api.matches.list().then(setMatches);
    if (player?.teamId) {
      api.teams.list().then((teams: any[]) => {
        setTeam(teams.find((t: any) => t.id === player.teamId) || null);
      });
    }
  }, [player?.teamId]);

  if (!player) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const winRate = calculateWinRate(player.wins, player.losses);
  const playerBadges = BADGES.filter((b) => (player.badges || []).includes(b.id));

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

      {/* Profile header */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Avatar name={player.username} size="xl" online={player.isOnline} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">
                {player.username}
              </h1>
              {player.isOnline && (
                <Badge variant="green" size="sm">🟢 {t('profileView.online')}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="neon" size="lg">
                <Crown size={14} className="mr-1" style={{ color: '#00d4ff' }} />
                {getRankName(player.rank)}
              </Badge>
              <Badge variant="purple" size="lg">
                {MLBB_ROLES.find((r) => r.id === player.role)?.icon} {player.role}
              </Badge>
              {team && (
                <Badge variant="gold" size="lg">
                  <Shield size={14} className="mr-1" />
                  {team.name}
                </Badge>
              )}
            </div>

            {player.bio && (
              <p className="mt-3 text-sm text-gray-400">
                {player.bio}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {player.city}, {player.country}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {t('profileView.memberSince')} {formatDate(player.joinedAt)}
              </span>
            </div>
          </div>

          <Button variant="secondary" onClick={() => setIsEditing(!isEditing)}>
            <Edit size={16} />
            {t('profileView.editProfile')}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('profileView.stat.wins')} value={player.wins} icon={<TrendingUp size={16} />} trend={5} />
        <StatCard label="Win Rate" value={`${winRate}%`} icon={<Target size={16} />} />
        <StatCard label="MVP" value={player.mvpCount} icon={<Star size={16} />} />
        <StatCard label={t('profileView.stat.streak')} value={`${player.streak}🔥`} icon={<Flame size={16} />} />
      </div>

      <Tabs
        tabs={[
          { id: 'stats', label: t('profileView.tab.stats'), icon: Target },
          { id: 'badges', label: t('profileView.tab.badges'), icon: Award },
          { id: 'heroes', label: t('profileView.tab.heroes'), icon: Swords },
          { id: 'history', label: t('profileView.tab.history'), icon: Trophy },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Card>
            <h3 className="font-bold mb-4 text-white">{t('profileView.winLossRatio')}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-400">{t('profileView.wins')}</span>
                  <span className="text-green-400 font-bold">{player.wins}</span>
                </div>
                <ProgressBar value={parseFloat(winRate as string)} color="green" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-400">{t('profileView.losses')}</span>
                  <span className="text-red-400 font-bold">{player.losses}</span>
                </div>
                <ProgressBar value={100 - parseFloat(winRate as string)} color="red" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-amber-400">MVP Rate</span>
                  <span className="text-amber-400 font-bold">
                    {((player.mvpCount / (player.wins + player.losses)) * 100).toFixed(1)}%
                  </span>
                </div>
                <ProgressBar value={(player.mvpCount / (player.wins + player.losses)) * 100} color="yellow" />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-4 text-white">{t('profileView.rankProgression')}</h3>
            <div className="space-y-3">
              {MLBB_RANKS.map((rank) => (
                <div key={rank.id} className={`flex items-center gap-3 p-2 rounded-lg ${
                  player.rank === rank.id ? 'bg-neon-blue/10 border border-neon-blue/30' : ''
                }`}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rank.color }} />
                  <span className={`text-sm flex-1 ${player.rank === rank.id ? 'text-neon-blue font-bold' : 'text-gray-300'}`}>
                    {rank.name}
                  </span>
                  {player.rank === rank.id && (
                    <Badge variant="neon" size="sm">{t('profileView.current')}</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="md:col-span-2">
            <h3 className="font-bold mb-4 text-white">{t('profileView.generalStats')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t('profileView.totalMatches'), value: player.wins + player.losses },
                { label: t('profileView.bestStreak'), value: `${player.streak}🔥` },
                { label: t('profileView.mainRole'), value: player.role },
                { label: t('profileView.country'), value: player.country },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 rounded-lg bg-gaming-surface/50">
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playerBadges.map((badge) => (
            <Card key={badge.id}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-2xl">
                  {badge.icon}
                </div>
                <div>
                  <h4 className="font-bold text-white">{badge.name}</h4>
                  <p className="text-xs text-gray-400">{badge.description}</p>
                </div>
              </div>
            </Card>
          ))}
          {playerBadges.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={<Award size={28} />} title={t('profileView.noBadges')} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'heroes' && (
        <Card>
          <h3 className="font-bold mb-4 text-white">{t('profileView.favoriteHeroes')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(player.favoriteHeroes || []).map((hero: string) => (
              <div key={hero} className="flex items-center gap-3 p-3 rounded-lg bg-gaming-surface/50">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold text-white">
                  {hero[0]}
                </div>
                <div>
                  <p className="font-medium text-sm text-white">{hero}</p>
                  <p className="text-xs text-gray-400">{player.role}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {matches.filter((m: any) => m.status === 'completed').map((match: any) => (
            <Card key={match.id}>
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  match.team1.score > match.team2.score ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {match.team1.score > match.team2.score ? 'WIN' : 'LOSS'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-white">{match.team1.name}</span>
                    <span className="text-gray-500">{match.team1.score} - {match.team2.score}</span>
                    <span className="font-medium text-white">{match.team2.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{match.tournament} • {formatDate(match.date)}</p>
                </div>
                {match.mvp === player.username && (
                  <Badge variant="gold" size="sm">⭐ MVP</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlayerProfile() {
  const { id } = useParams();
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    api.users.get(String(id)).then(setPlayer);
  }, [id]);

  return <ProfileView player={player} />;
}
