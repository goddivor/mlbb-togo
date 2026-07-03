'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Search, Trash2, Eye, Edit, Calendar, Users as UsersIcon } from 'lucide-react';
import { useTournamentStore, useAdminStore } from '@/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { PageHeader, SectionCard, Select, Badge, Button, EmptyState } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function AdminTournaments() {
  const { tournaments, setTournaments, deleteTournament } = useTournamentStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { addAdminLog } = useAdminStore();

  useEffect(() => {
    api.tournaments.list().then(setTournaments);
  }, [setTournaments]);

  const filtered = tournaments.filter((t: any) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Suppression confirmée via ConfirmModal
  const confirmDelete = () => {
    const t = deleteTarget;
    deleteTournament(t.id);
    api.tournaments.remove(t.id).catch(() => {});
    addAdminLog({ action: 'tournament_delete', admin: 'TogoKing', target: t.name, details: 'Tournoi supprimé' });
    toast.success(`${t.name} supprimé`);
    setDeleteTarget(null);
  };

  const statusVariants: Record<string, any> = { upcoming: 'blue', ongoing: 'green', completed: 'default', cancelled: 'red' };
  const statusLabels: Record<string, string> = { upcoming: 'À venir', ongoing: 'En cours', completed: 'Terminé', cancelled: 'Annulé' };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={<Trophy size={28} />}
        title="Gestion des Tournois"
        subtitle={`${filtered.length} tournois`}
        variant="gold"
      />

      {/* Filtres */}
      <SectionCard className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un tournoi..." className="w-full pl-10 pr-4 py-2.5 bg-gaming-surface border border-gaming-border rounded-lg text-gray-100 placeholder-gray-500 focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50" />
          </div>
          <Select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)} className="sm:w-56">
            <option value="all">Tous les statuts</option>
            <option value="upcoming">À venir</option>
            <option value="ongoing">En cours</option>
            <option value="completed">Terminé</option>
          </Select>
        </div>
      </SectionCard>

      {/* Liste des tournois */}
      <div className="space-y-4">
        {filtered.map((t: any, i: number) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-gaming-card border border-gaming-border rounded-xl p-5 hover:border-amber-400/30 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{t.name}</h3>
                  <Badge variant={statusVariants[t.status] || 'default'} size="sm">{statusLabels[t.status]}</Badge>
                </div>
                <p className="text-gray-400 text-sm mb-3">{t.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {t.startDate} → {t.endDate}</span>
                  <span className="flex items-center gap-1"><UsersIcon size={14} /> {t.registeredTeams.length}/{t.maxTeams} équipes</span>
                  <span className="text-amber-400 font-medium">{t.prizePool}</span>
                  <span className="text-gray-500">{t.format}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Eye size={14} /> Voir</Button>
                <Button variant="secondary" size="sm"><Edit size={14} /> Éditer</Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(t)}><Trash2 size={14} /></Button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <EmptyState icon={<Trophy size={28} />} title="Aucun tournoi" description="Aucun tournoi ne correspond à votre recherche." />
        )}
      </div>

      {/* Suppression */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title="Supprimer le tournoi"
        message={deleteTarget ? `Voulez-vous vraiment supprimer « ${deleteTarget.name} » ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
