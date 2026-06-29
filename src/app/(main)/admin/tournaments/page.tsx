'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Search, Trash2, Eye, Edit, Calendar, Users as UsersIcon } from 'lucide-react';
import { useTournamentStore, useAdminStore } from '@/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminTournaments() {
  const { tournaments, setTournaments, deleteTournament } = useTournamentStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { addAdminLog } = useAdminStore();

  useEffect(() => {
    api.tournaments.list().then(setTournaments);
  }, [setTournaments]);

  const filtered = tournaments.filter((t: any) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = (t: any) => {
    deleteTournament(t.id);
    api.tournaments.remove(t.id).catch(() => {});
    addAdminLog({ action: 'tournament_delete', admin: 'TogoKing', target: t.name, details: 'Tournoi supprimé' });
    toast.success(`${t.name} supprimé`);
  };

  const statusColors: Record<string, string> = { upcoming: 'bg-blue-500/20 text-blue-400', ongoing: 'bg-green-500/20 text-green-400', completed: 'bg-gray-500/20 text-gray-400', cancelled: 'bg-red-500/20 text-red-400' };
  const statusLabels: Record<string, string> = { upcoming: 'À venir', ongoing: 'En cours', completed: 'Terminé', cancelled: 'Annulé' };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Trophy className="text-yellow-400" size={32} /> Gestion des Tournois</h1>
          <p className="text-gray-400 mt-1">{filtered.length} tournois</p>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un tournoi..." className="w-full pl-10 pr-4 py-2.5 bg-gaming-card border border-gaming-border rounded-lg text-white placeholder-gray-500 focus:border-neon-blue focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-gaming-card border border-gaming-border rounded-lg text-white focus:border-neon-blue focus:outline-none">
          <option value="all">Tous les statuts</option>
          <option value="upcoming">À venir</option>
          <option value="ongoing">En cours</option>
          <option value="completed">Terminé</option>
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((t: any, i: number) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-gaming-card border border-gaming-border rounded-xl p-5 hover:border-yellow-400/30 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{t.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{t.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {t.startDate} → {t.endDate}</span>
                  <span className="flex items-center gap-1"><UsersIcon size={14} /> {t.registeredTeams.length}/{t.maxTeams} équipes</span>
                  <span className="text-yellow-400 font-medium">{t.prizePool}</span>
                  <span className="text-gray-500">{t.format}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="py-2 px-3 bg-gaming-darker text-gray-300 rounded-lg hover:text-white transition-colors text-sm flex items-center gap-1"><Eye size={14} /> Voir</button>
                <button className="py-2 px-3 bg-gaming-darker text-gray-300 rounded-lg hover:text-yellow-400 transition-colors text-sm flex items-center gap-1"><Edit size={14} /> Éditer</button>
                <button onClick={() => handleDelete(t)} className="py-2 px-3 bg-gaming-darker text-gray-300 rounded-lg hover:text-red-400 transition-colors text-sm"><Trash2 size={14} /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
