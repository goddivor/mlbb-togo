'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Trash2, Eye, Edit } from 'lucide-react';
import { useTeamStore, useAdminStore } from '@/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { PageHeader, Button, EmptyState } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function AdminTeams() {
  const { teams, setTeams, deleteTeam } = useTeamStore();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { addAdminLog } = useAdminStore();

  useEffect(() => {
    api.teams.list().then(setTeams);
  }, [setTeams]);

  const filtered = teams.filter((t: any) => t.name.toLowerCase().includes(search.toLowerCase()));

  // Deletion confirmed via ConfirmModal
  const confirmDelete = () => {
    const team = deleteTarget;
    deleteTeam(team.id);
    api.teams.remove(team.id).catch(() => {});
    addAdminLog({ action: 'team_delete', admin: 'TogoKing', target: team.name, details: 'Équipe supprimée' });
    toast.success(`${team.name} supprimée`);
    setDeleteTarget(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={<Users size={28} />}
        title="Gestion des Équipes"
        subtitle={`${filtered.length} équipes`}
        variant="purple"
      />

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une équipe..." className="w-full pl-10 pr-4 py-2.5 bg-gaming-surface border border-gaming-border rounded-lg text-gray-100 placeholder-gray-500 focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50" />
      </div>

      {/* Teams grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((team: any, i: number) => (
          <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-gaming-card border border-gaming-border rounded-xl p-5 hover:border-neon-purple/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white font-bold text-lg">{team.tag}</div>
                <div>
                  <h3 className="text-white font-semibold">{team.name}</h3>
                  <p className="text-gray-500 text-sm">#{team.rank} • {team.region}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-gaming-surface rounded-lg"><p className="text-green-400 font-bold">{team.wins}</p><p className="text-gray-500 text-xs">W</p></div>
              <div className="text-center p-2 bg-gaming-surface rounded-lg"><p className="text-red-400 font-bold">{team.losses}</p><p className="text-gray-500 text-xs">L</p></div>
              <div className="text-center p-2 bg-gaming-surface rounded-lg"><p className="text-neon-blue font-bold">{team.winRate}%</p><p className="text-gray-500 text-xs">WR</p></div>
            </div>
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-400"><Users size={14} /> {team.members.length}/{team.maxMembers} membres</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1"><Eye size={14} /> Voir</Button>
              <Button variant="secondary" size="sm" className="flex-1"><Edit size={14} /> Éditer</Button>
              <Button variant="danger" size="sm" onClick={() => setDeleteTarget(team)}><Trash2 size={14} /></Button>
            </div>
          </motion.div>
        ))}
      </div>
      {filtered.length === 0 && (
        <EmptyState icon={<Users size={28} />} title="Aucune équipe" description="Aucune équipe ne correspond à votre recherche." />
      )}

      {/* Deletion */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title="Supprimer l'équipe"
        message={deleteTarget ? `Voulez-vous vraiment supprimer l'équipe « ${deleteTarget.name} » ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
