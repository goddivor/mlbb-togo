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

  // Suppression confirmée via ConfirmModal
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={<Users size={28} />}
        title="Gestion des Utilisateurs"
        subtitle={`${filtered.length} utilisateurs trouvés`}
        variant="blue"
      />

      {/* Filtres */}
      <SectionCard className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un joueur..." className="w-full pl-10 pr-4 py-2.5 bg-gaming-surface border border-gaming-border rounded-lg text-gray-100 placeholder-gray-500 focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50" />
          </div>
          <Select value={roleFilter} onChange={(e: any) => setRoleFilter(e.target.value)} className="sm:w-56">
            <option value="all">Tous les rôles</option>
            <option value="user">Utilisateur</option>
            <option value="moderator">Modérateur</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
      </SectionCard>

      {/* Table utilisateurs */}
      <div className="bg-gaming-card border border-gaming-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gaming-surface border-b border-gaming-border">
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Joueur</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium hidden md:table-cell">Rang</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium hidden lg:table-cell">Rôle MLBB</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Statut</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Rôle</th>
                <th className="text-right p-4 text-gray-400 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paginated.map((user: any, i: number) => (
                  <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }} className="border-b border-gaming-border hover:bg-gaming-surface/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: getRankColor(user.rank) + '30', color: getRankColor(user.rank) }}>
                          {getInitials(user.username)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: getRankColor(user.rank) + '20', color: getRankColor(user.rank) }}>
                        {user.rank?.charAt(0).toUpperCase() + user.rank?.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-gray-300 text-sm capitalize">{user.role}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${user.isOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                        {user.isOnline ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={roleVariants[user.role_user || 'user']} size="sm">
                        {user.role_user === 'admin' ? 'Admin' : user.role_user === 'moderator' ? 'Mod' : 'User'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelectedUser(user); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gaming-surface text-gray-400 hover:text-white transition-colors" title="Voir"><Eye size={16} /></button>
                        <button onClick={() => handlePromote(user)} className="p-2 rounded-lg hover:bg-gaming-surface text-gray-400 hover:text-yellow-400 transition-colors" title="Promouvoir"><Crown size={16} /></button>
                        <button onClick={() => handleBan(user)} className="p-2 rounded-lg hover:bg-gaming-surface text-gray-400 hover:text-orange-400 transition-colors" title={user.banned ? 'Réactiver' : 'Suspendre'}><Ban size={16} /></button>
                        <button onClick={() => setDeleteTarget(user)} className="p-2 rounded-lg hover:bg-gaming-surface text-gray-400 hover:text-red-400 transition-colors" title="Supprimer"><Trash2 size={16} /></button>
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
          <div className="flex items-center justify-between p-4 border-t border-gaming-border">
            <p className="text-sm text-gray-400">Page {currentPage} sur {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-gaming-surface text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-gaming-surface text-gray-400 hover:text-white disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Profil utilisateur */}
      <Modal
        open={showModal && !!selectedUser}
        onClose={() => setShowModal(false)}
        title={selectedUser ? `Profil de ${selectedUser.username}` : ''}
        icon={<Eye size={18} />}
        size="md"
      >
        {selectedUser && (
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="text-white">{selectedUser.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Rang</span><span className="text-white">{selectedUser.rank}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Rôle</span><span className="text-white">{selectedUser.role}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Victoires</span><span className="text-green-400">{selectedUser.wins}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Défaites</span><span className="text-red-400">{selectedUser.losses}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Win Rate</span><span className="text-neon-blue">{selectedUser.winRate}%</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Ville</span><span className="text-white">{selectedUser.city}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Inscrit le</span><span className="text-white">{selectedUser.joinedAt}</span></div>
            <div className="pt-4">
              <Button variant="outline" className="w-full" onClick={() => setShowModal(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Suppression */}
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
