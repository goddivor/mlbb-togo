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

  // Deletion confirmed via ConfirmModal
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
    <div className="space-y-6">
      <PageHeader
        icon={<Trophy size={28} />}
        title="Gestion des Tournois"
        subtitle={`${filtered.length} tournois`}
        variant="gold"
      />

      {/* Filters */}
      <SectionCard className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bodydark2 z-10" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un tournoi..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white" />
          </div>
          <Select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)} className="sm:w-56">
            <option value="all">Tous les statuts</option>
            <option value="upcoming">À venir</option>
            <option value="ongoing">En cours</option>
            <option value="completed">Terminé</option>
          </Select>
        </div>
      </SectionCard>

      {/* Tournaments list */}
      <div className="space-y-4">
        {filtered.map((t: any, i: number) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-sm shadow-default p-5 transition-colors hover:border-primary">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-black dark:text-white">{t.name}</h3>
                  <Badge variant={statusVariants[t.status] || 'default'} size="sm">{statusLabels[t.status]}</Badge>
                </div>
                <p className="text-body dark:text-bodydark text-sm mb-3">{t.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-body dark:text-bodydark">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {t.startDate} → {t.endDate}</span>
                  <span className="flex items-center gap-1"><UsersIcon size={14} /> {t.registeredTeams.length}/{t.maxTeams} équipes</span>
                  <span className="text-warning font-medium">{t.prizePool}</span>
                  <span className="text-bodydark2">{t.format}</span>
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

      {/* Deletion */}
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
