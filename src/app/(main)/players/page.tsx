'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Users, Flame, Crown } from 'lucide-react';
import { Card, Badge, Avatar, Tabs } from '@/components/ui';
import { useThemeStore, usePlayerStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { MLBB_RANKS, MLBB_ROLES } from '@/lib/constants';
import { calculateWinRate, getRankName } from '@/lib/helpers';

export default function Players() {
  const { theme } = useThemeStore();
  const { players, setPlayers } = usePlayerStore();
  const [search, setSearch] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('winRate');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    api.users.list().then(setPlayers);
  }, [setPlayers]);

  const filteredPlayers = players
    .filter((p: any) => {
      if (search && !p.username.toLowerCase().includes(search.toLowerCase())) return false;
      if (rankFilter && p.rank !== rankFilter) return false;
      if (roleFilter && p.role !== roleFilter) return false;
      if (activeTab === 'online' && !p.isOnline) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'winRate') return parseFloat(calculateWinRate(b.wins, b.losses) as string) - parseFloat(calculateWinRate(a.wins, a.losses) as string);
      if (sortBy === 'wins') return b.wins - a.wins;
      if (sortBy === 'mvp') return b.mvpCount - a.mvpCount;
      if (sortBy === 'streak') return b.streak - a.streak;
      return 0;
    });

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="mb-8">
        <h1 className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          <Users className="inline w-8 h-8 mr-2 text-neon-blue" />
          Joueurs
        </h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Découvrez les joueurs de la communauté MLBB Togo
        </p>
      </div>

      <Card className="mb-6" hover={false}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Rechercher un joueur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all duration-300 focus:outline-none ${
                  theme === 'dark'
                    ? 'bg-gaming-surface border border-gaming-border text-white placeholder-gray-500 focus:border-neon-blue/50'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500'
                }`}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              className={`px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none ${
                theme === 'dark'
                  ? 'bg-gaming-surface border border-gaming-border text-white focus:border-neon-blue/50'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary-500'
              }`}
            >
              <option value="">Tous les rangs</option>
              {MLBB_RANKS.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none ${
                theme === 'dark'
                  ? 'bg-gaming-surface border border-gaming-border text-white focus:border-neon-blue/50'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary-500'
              }`}
            >
              <option value="">Tous les rôles</option>
              {MLBB_ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none ${
                theme === 'dark'
                  ? 'bg-gaming-surface border border-gaming-border text-white focus:border-neon-blue/50'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary-500'
              }`}
            >
              <option value="winRate">Trier: Win Rate</option>
              <option value="wins">Trier: Victoires</option>
              <option value="mvp">Trier: MVP</option>
              <option value="streak">Trier: Série</option>
            </select>
          </div>
        </div>
      </Card>

      <Tabs
        tabs={[
          { id: 'all', label: `Tous (${players.length})`, icon: Users },
          { id: 'online', label: `En ligne (${players.filter((p: any) => p.isOnline).length})`, icon: Flame },
        ]}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPlayers.map((player: any, index: number) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/profile/${player.id}`}>
              <Card className="h-full group cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={player.username} size="lg" online={player.isOnline} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {player.username}
                      </h3>
                      {index < 3 && <Crown size={14} className="text-yellow-400 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="neon" size="sm">{getRankName(player.rank)}</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {calculateWinRate(player.wins, player.losses)}%
                    </p>
                    <p className="text-[10px] text-gray-400">Win Rate</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {player.wins}
                    </p>
                    <p className="text-[10px] text-gray-400">Victoires</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {player.mvpCount}
                    </p>
                    <p className="text-[10px] text-gray-400">MVP</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">
                      {MLBB_ROLES.find((r) => r.id === player.role)?.icon}
                    </span>
                    <span className="text-xs text-gray-400">{player.role}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Flame size={12} className="text-orange-400" />
                    {player.streak}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {(player.favoriteHeroes || []).slice(0, 3).map((hero: string) => (
                    <span key={hero} className={`text-[10px] px-2 py-0.5 rounded-full ${
                      theme === 'dark' ? 'bg-gaming-surface text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {hero}
                    </span>
                  ))}
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Aucun joueur trouvé
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Essayez de modifier vos filtres
          </p>
        </div>
      )}
    </div>
  );
}
