'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Search, Trash2, Eye, Pin, MessageSquare, Heart } from 'lucide-react';
import { useAdminStore } from '@/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { PageHeader, SectionCard, Select, Badge, Button, EmptyState } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { addAdminLog } = useAdminStore();

  useEffect(() => {
    api.posts.list().then(setPosts);
  }, []);

  const filtered = posts.filter((p: any) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.authorName.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // Deletion confirmed via ConfirmModal
  const confirmDelete = () => {
    const post = deleteTarget;
    setPosts(posts.filter((p) => p.id !== post.id));
    api.posts.remove(post.id).catch(() => {});
    addAdminLog({ action: 'post_delete', admin: 'TogoKing', target: post.title, details: 'Post supprimé' });
    toast.success('Post supprimé');
    setDeleteTarget(null);
  };

  const handlePin = (post: any) => {
    setPosts(posts.map((p) => (p.id === post.id ? { ...p, isPinned: !p.isPinned } : p)));
    toast.success(post.isPinned ? 'Post épinglé retiré' : 'Post épinglé');
  };

  const categories = ['all', 'strategies', 'recruitment', 'tournaments', 'general', 'guides'];
  const catLabels: Record<string, string> = { all: 'Toutes', strategies: 'Stratégies', recruitment: 'Recrutement', tournaments: 'Tournois', general: 'Général', guides: 'Guides' };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Newspaper size={28} />}
        title="Gestion des Posts"
        subtitle={`${filtered.length} posts`}
        variant="green"
      />

      {/* Filters */}
      <SectionCard className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bodydark2 z-10" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un post..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white" />
          </div>
          <Select value={categoryFilter} onChange={(e: any) => setCategoryFilter(e.target.value)} className="sm:w-56">
            {categories.map((c) => <option key={c} value={c}>{catLabels[c]}</option>)}
          </Select>
        </div>
      </SectionCard>

      {/* Posts list */}
      <div className="space-y-3">
        {filtered.map((post: any, i: number) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-sm shadow-default p-5 transition-colors hover:border-primary">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {post.isPinned && <Pin size={14} className="text-warning" />}
                  <h3 className="text-black dark:text-white font-medium">{post.title}</h3>
                </div>
                <p className="text-body dark:text-bodydark text-sm mb-2">Par {post.authorName} • {(post.createdAt || '').split('T')[0]}</p>
                <div className="flex items-center gap-4 text-sm text-body dark:text-bodydark">
                  <span className="flex items-center gap-1"><Heart size={12} /> {post.likes}</span>
                  <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.comments?.length || 0}</span>
                  <span className="flex items-center gap-1"><Eye size={12} /> {post.views}</span>
                  <Badge variant="default" size="sm">{post.category}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant={post.isPinned ? 'secondary' : 'outline'} size="sm" onClick={() => handlePin(post)}><Pin size={14} /></Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(post)}><Trash2 size={14} /></Button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <EmptyState icon={<Newspaper size={28} />} title="Aucun post" description="Aucun post ne correspond à votre recherche." />
        )}
      </div>

      {/* Deletion */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title="Supprimer le post"
        message={deleteTarget ? `Voulez-vous vraiment supprimer « ${deleteTarget.title} » ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
