'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Trash2, Eye, Edit, Users } from 'lucide-react';
import { useTeamStore, useAdminStore } from '@/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminTeams() {
  const { teams, setTeams, deleteTeam } = useTeamStore();
  const [search, setSearch] = useState('');
  const { addAdminLog } = useAdminStore();

  useEffect(() => {
    api.teams.list().then(setTeams);
  }, [setTeams]);

  const filtered = teams.filter((t: any) => t.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = (team: any) => {
    deleteTeam(team.id);
    api.teams.remove(team.id).catch(() => {});
    addAdminLog({ action: 'team_delete', admin: 'TogoKing', target: team.name, details: 'Équipe supprimée' });
    toast.success(`${team.name} supprimée`);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Shield className="text-purple-400" size={32} /> Gestion des Équipes</h1>
          <p className="text-gray-400 mt-1">{filtered.length} équipes</p>
        </div>
      </motion.div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une équipe..." className="w-full pl-10 pr-4 py-2.5 bg-gaming-card border border-gaming-border rounded-lg text-white placeholder-gray-500 focus:border-neon-blue focus:outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((team: any, i: number) => (
          <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-gaming-card border border-gaming-border rounded-xl p-5 hover:border-neon-purple/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">{team.tag}</div>
                <div>
                  <h3 className="text-white font-semibold">{team.name}</h3>
                  <p className="text-gray-500 text-sm">#{team.rank} • {team.region}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-gaming-darker rounded-lg"><p className="text-green-400 font-bold">{team.wins}</p><p className="text-gray-500 text-xs">W</p></div>
              <div className="text-center p-2 bg-gaming-darker rounded-lg"><p className="text-red-400 font-bold">{team.losses}</p><p className="text-gray-500 text-xs">L</p></div>
              <div className="text-center p-2 bg-gaming-darker rounded-lg"><p className="text-neon-blue font-bold">{team.winRate}%</p><p className="text-gray-500 text-xs">WR</p></div>
            </div>
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-400"><Users size={14} /> {team.members.length}/{team.maxMembers} membres</div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-gaming-darker text-gray-300 rounded-lg hover:text-white transition-colors text-sm flex items-center justify-center gap-1"><Eye size={14} /> Voir</button>
              <button className="flex-1 py-2 bg-gaming-darker text-gray-300 rounded-lg hover:text-yellow-400 transition-colors text-sm flex items-center justify-center gap-1"><Edit size={14} /> Éditer</button>
              <button onClick={() => handleDelete(team)} className="py-2 px-3 bg-gaming-darker text-gray-300 rounded-lg hover:text-red-400 transition-colors text-sm"><Trash2 size={14} /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
