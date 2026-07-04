'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Ban, Trash2, ChevronLeft, ChevronRight, Crown, Eye } from 'lucide-react';
import { usePlayerStore, useAdminStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { getRankColor, getInitials } from '@/lib/helpers';
import toast from 'react-hot-toast';
import { PageHeader, SectionCard, Select, Badge, Button, EmptyState } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function AdminUsers() {
  const { players, setPlayers, updatePlayer, deletePlayer } = usePlayerStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { addAdminLog } = useAdminStore();
  const perPage = 5;

  useEffect(() => {
    api.users.list().then(setPlayers);
  }, [setPlayers]);

  const filtered = players.filter((u: any) => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role_user === roleFilter;
    return matchSearch && matchRole;
  });

  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleBan = (user: any) => {
    const newBanned = !user.banned;
    updatePlayer(user.id, { isOnline: false, banned: newBanned });
    api.users.setBan(user.id, newBanned).catch(() => {});
    addAdminLog({ action: user.banned ? 'user_unban' : 'user_ban', admin: 'TogoKing', target: user.username, details: user.banned ? 'Compte réactivé' : 'Compte suspendu' });
    toast.success(user.banned ? `${user.username} réactivé` : `${user.username} suspendu`);
  };

  const handlePromote = (user: any) => {
    const roles = ['user', 'moderator', 'admin'];
    const currentIdx = roles.indexOf(user.role_user || 'user');
    const newRole = roles[Math.min(currentIdx + 1, roles.length - 1)];
    updatePlayer(user.id, { role_user: newRole });
    api.users.setRole(user.id, newRole).catch(() => {});
    addAdminLog({ action: 'user_promote', admin: 'TogoKing', target: user.username, details: `Promu ${newRole}` });
    toast.success(`${user.username} promu ${newRole}`);
  };

  // Deletion confirmed via ConfirmModal
  const confirmDelete = () => {
    const user = deleteTarget;
    deletePlayer(user.id);
    api.users.remove(user.id).catch(() => {});
    addAdminLog({ action: 'user_delete', admin: 'TogoKing', target: user.username, details: 'Compte supprimé' });
    toast.success(`${user.username} supprimé`);
    setDeleteTarget(null);
  };

  const roleVariants: Record<string, any> = { admin: 'red', moderator: 'gold', user: 'blue' };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users size={28} />}
        title="Gestion des Utilisateurs"
        subtitle={`${filtered.length} utilisateurs trouvés`}
        variant="blue"
      />

      {/* Filters */}
      <SectionCard className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bodydark2 z-10" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un joueur..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white" />
          </div>
          <Select value={roleFilter} onChange={(e: any) => setRoleFilter(e.target.value)} className="sm:w-56">
            <option value="all">Tous les rôles</option>
            <option value="user">Utilisateur</option>
            <option value="moderator">Modérateur</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
      </SectionCard>

      {/* Users table */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="py-4 px-4 font-medium text-black dark:text-white">Joueur</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white hidden md:table-cell">Rang</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white hidden lg:table-cell">Rôle MLBB</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Statut</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Rôle</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paginated.map((user: any, i: number) => (
                  <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }} className="border-b border-stroke transition-colors hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4">
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: getRankColor(user.rank) + '30', color: getRankColor(user.rank) }}>
                          {getInitials(user.username)}
                        </div>
                        <div>
                          <p className="text-black dark:text-white font-medium">{user.username}</p>
                          <p className="text-bodydark2 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4 hidden md:table-cell">
                      <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: getRankColor(user.rank) + '20', color: getRankColor(user.rank) }}>
                        {user.rank?.charAt(0).toUpperCase() + user.rank?.slice(1)}
                      </span>
                    </td>
                    <td className="py-5 px-4 hidden lg:table-cell text-body dark:text-bodydark text-sm capitalize">{user.role}</td>
                    <td className="py-5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${user.isOnline ? 'bg-success/10 text-success' : 'bg-gray text-body dark:bg-meta-4 dark:text-bodydark'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-success' : 'bg-bodydark2'}`} />
                        {user.isOnline ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </td>
                    <td className="py-5 px-4">
                      <Badge variant={roleVariants[user.role_user || 'user']} size="sm">
                        {user.role_user === 'admin' ? 'Admin' : user.role_user === 'moderator' ? 'Mod' : 'User'}
                      </Badge>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelectedUser(user); setShowModal(true); }} className="p-2 rounded-lg text-body hover:bg-gray-2 hover:text-black transition-colors dark:text-bodydark dark:hover:bg-meta-4 dark:hover:text-white" title="Voir"><Eye size={16} /></button>
                        <button onClick={() => handlePromote(user)} className="p-2 rounded-lg text-body hover:bg-gray-2 hover:text-warning transition-colors dark:text-bodydark dark:hover:bg-meta-4" title="Promouvoir"><Crown size={16} /></button>
                        <button onClick={() => handleBan(user)} className="p-2 rounded-lg text-body hover:bg-gray-2 hover:text-warning transition-colors dark:text-bodydark dark:hover:bg-meta-4" title={user.banned ? 'Réactiver' : 'Suspendre'}><Ban size={16} /></button>
                        <button onClick={() => setDeleteTarget(user)} className="p-2 rounded-lg text-body hover:bg-gray-2 hover:text-danger transition-colors dark:text-bodydark dark:hover:bg-meta-4" title="Supprimer"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState icon={<Users size={28} />} title="Aucun utilisateur" description="Aucun utilisateur ne correspond à votre recherche." />
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-stroke dark:border-strokedark">
            <p className="text-sm text-body dark:text-bodydark">Page {currentPage} sur {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-gray-2 text-body hover:text-black disabled:opacity-30 dark:bg-meta-4 dark:text-bodydark dark:hover:text-white"><ChevronLeft size={16} /></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-gray-2 text-body hover:text-black disabled:opacity-30 dark:bg-meta-4 dark:text-bodydark dark:hover:text-white"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* User profile */}
      <Modal
        open={showModal && !!selectedUser}
        onClose={() => setShowModal(false)}
        title={selectedUser ? `Profil de ${selectedUser.username}` : ''}
        icon={<Eye size={18} />}
        size="md"
      >
        {selectedUser && (
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-body dark:text-bodydark">Email</span><span className="text-black dark:text-white">{selectedUser.email}</span></div>
            <div className="flex justify-between"><span className="text-body dark:text-bodydark">Rang</span><span className="text-black dark:text-white">{selectedUser.rank}</span></div>
            <div className="flex justify-between"><span className="text-body dark:text-bodydark">Rôle</span><span className="text-black dark:text-white">{selectedUser.role}</span></div>
            <div className="flex justify-between"><span className="text-body dark:text-bodydark">Victoires</span><span className="text-success">{selectedUser.wins}</span></div>
            <div className="flex justify-between"><span className="text-body dark:text-bodydark">Défaites</span><span className="text-danger">{selectedUser.losses}</span></div>
            <div className="flex justify-between"><span className="text-body dark:text-bodydark">Win Rate</span><span className="text-primary">{selectedUser.winRate}%</span></div>
            <div className="flex justify-between"><span className="text-body dark:text-bodydark">Ville</span><span className="text-black dark:text-white">{selectedUser.city}</span></div>
            <div className="flex justify-between"><span className="text-body dark:text-bodydark">Inscrit le</span><span className="text-black dark:text-white">{selectedUser.joinedAt}</span></div>
            <div className="pt-4">
              <Button variant="outline" className="w-full" onClick={() => setShowModal(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deletion */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title="Supprimer l'utilisateur"
        message={deleteTarget ? `Voulez-vous vraiment supprimer le compte « ${deleteTarget.username} » ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
