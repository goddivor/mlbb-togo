'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Search, Crown, UserPlus } from 'lucide-react';
import { Card, Badge, Avatar, Button, Tabs } from '@/components/ui';
import { useThemeStore, useTeamStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { generateId } from '@/lib/helpers';

export default function Teams() {
  const { theme } = useThemeStore();
  const { teams, setTeams, addTeam } = useTeamStore();
  const [players, setPlayers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', tag: '', description: '' });

  useEffect(() => {
    api.teams.list().then(setTeams);
    api.users.list().then(setPlayers);
  }, [setTeams]);

  const filteredTeams = teams.filter((t: any) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'recruiting' && !t.isRecruiting) return false;
    return true;
  });

  const handleCreate = () => {
    const team = {
      id: generateId(),
      name: newTeam.name || 'Nouvelle équipe',
      tag: newTeam.tag || 'TAG',
      description: newTeam.description,
      captainId: null,
      members: [],
      maxMembers: 5,
      wins: 0,
      winRate: 0,
      rank: teams.length + 1,
      isRecruiting: true,
      lookingFor: [],
      achievements: [],
    };
    // Optimiste : mise à jour immédiate du store
    addTeam(team);
    // Tentative d'appel API en arrière-plan (ignore l'échec si hors-ligne)
    api.teams.create(team).catch(() => {});
    setNewTeam({ name: '', tag: '', description: '' });
    setShowCreate(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <Shield className="inline w-8 h-8 mr-2 text-neon-purple" />
            Équipes
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Créez ou rejoignez une équipe pour dominer les tournois
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Créer une équipe
        </Button>
      </div>

      {/* Search & Tabs */}
      <Card className="mb-6" hover={false}>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Rechercher une équipe..."
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
          <Tabs
            tabs={[
              { id: 'all', label: 'Toutes' },
              { id: 'recruiting', label: 'Recrutent' },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </Card>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTeams.map((team: any, index: number) => {
          const members = players.filter((p: any) => (team.members || []).includes(p.id));

          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                {/* Team Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-xl font-black text-white shadow-neon-purple">
                    {team.tag}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {team.name}
                      </h3>
                      {team.rank <= 3 && (
                        <Crown size={16} className={team.rank === 1 ? 'text-yellow-400' : team.rank === 2 ? 'text-gray-300' : 'text-orange-400'} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={team.isRecruiting ? 'green' : 'default'} size="sm">
                        {team.isRecruiting ? '🟢 Recrute' : '🔴 Fermé'}
                      </Badge>
                      <Badge variant="neon" size="sm">#{team.rank}</Badge>
                    </div>
                  </div>
                </div>

                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {team.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 rounded-lg bg-gaming-surface/50">
                    <p className={`text-lg font-bold text-green-400`}>{team.wins}</p>
                    <p className="text-[10px] text-gray-400">Victoires</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gaming-surface/50">
                    <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{team.winRate}%</p>
                    <p className="text-[10px] text-gray-400">Win Rate</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gaming-surface/50">
                    <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{(team.members || []).length}/{team.maxMembers}</p>
                    <p className="text-[10px] text-gray-400">Membres</p>
                  </div>
                </div>

                {/* Members */}
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-2">Membres</p>
                  <div className="flex items-center gap-2">
                    {members.map((member: any) => (
                      <Avatar key={member.id} name={member.username} size="sm" online={member.isOnline} />
                    ))}
                    {team.isRecruiting && (
                      <div className="w-8 h-8 rounded-lg border-2 border-dashed border-gaming-border flex items-center justify-center">
                        <UserPlus size={14} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Looking For */}
                {team.isRecruiting && (team.lookingFor || []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-2">Recherche</p>
                    <div className="flex gap-1.5">
                      {team.lookingFor.map((role: string) => (
                        <Badge key={role} variant="purple" size="sm">{role}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements */}
                {(team.achievements || []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-2">🏆 Achievements</p>
                    <div className="flex flex-wrap gap-1.5">
                      {team.achievements.map((ach: string) => (
                        <Badge key={ach} variant="gold" size="sm">{ach}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1">
                    Voir le profil
                  </Button>
                  {team.isRecruiting && (
                    <Button size="sm" className="flex-1">
                      <UserPlus size={14} />
                      Rejoindre
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Create Team Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg rounded-2xl border p-6 ${
              theme === 'dark' ? 'bg-gaming-card border-gaming-border' : 'bg-white border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Créer une équipe
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom de l&apos;équipe</label>
                <input
                  type="text"
                  placeholder="Ex: Thunder Titans"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border bg-gaming-surface text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/50 ${
                    theme === 'dark' ? 'border-gaming-border' : 'border-gray-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tag (3-4 caractères)</label>
                <input
                  type="text"
                  placeholder="Ex: TTT"
                  maxLength={4}
                  value={newTeam.tag}
                  onChange={(e) => setNewTeam({ ...newTeam, tag: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border bg-gaming-surface text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/50 ${
                    theme === 'dark' ? 'border-gaming-border' : 'border-gray-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea
                  placeholder="Décrivez votre équipe..."
                  rows={3}
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border bg-gaming-surface text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/50 resize-none ${
                    theme === 'dark' ? 'border-gaming-border' : 'border-gray-200'
                  }`}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handleCreate} className="flex-1">
                  Créer l&apos;équipe
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
