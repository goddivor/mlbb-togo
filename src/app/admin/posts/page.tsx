'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Trash2, Eye, Pin, MessageSquare, Heart } from 'lucide-react';
import { useAdminStore } from '@/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
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

  const handleDelete = (post: any) => {
    setPosts(posts.filter((p) => p.id !== post.id));
    api.posts.remove(post.id).catch(() => {});
    addAdminLog({ action: 'post_delete', admin: 'TogoKing', target: post.title, details: 'Post supprimé' });
    toast.success('Post supprimé');
  };

  const handlePin = (post: any) => {
    setPosts(posts.map((p) => (p.id === post.id ? { ...p, isPinned: !p.isPinned } : p)));
    toast.success(post.isPinned ? 'Post épinglé retiré' : 'Post épinglé');
  };

  const categories = ['all', 'strategies', 'recruitment', 'tournaments', 'general', 'guides'];
  const catLabels: Record<string, string> = { all: 'Toutes', strategies: 'Stratégies', recruitment: 'Recrutement', tournaments: 'Tournois', general: 'Général', guides: 'Guides' };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><FileText className="text-green-400" size={32} /> Gestion des Posts</h1>
        <p className="text-gray-400 mt-1">{filtered.length} posts</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un post..." className="w-full pl-10 pr-4 py-2.5 bg-gaming-card border border-gaming-border rounded-lg text-white placeholder-gray-500 focus:border-neon-blue focus:outline-none" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2.5 bg-gaming-card border border-gaming-border rounded-lg text-white focus:border-neon-blue focus:outline-none">
          {categories.map((c) => <option key={c} value={c}>{catLabels[c]}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((post: any, i: number) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-gaming-card border border-gaming-border rounded-xl p-5 hover:border-green-400/30 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {post.isPinned && <Pin size={14} className="text-yellow-400" />}
                  <h3 className="text-white font-medium">{post.title}</h3>
                </div>
                <p className="text-gray-400 text-sm mb-2">Par {post.authorName} • {(post.createdAt || '').split('T')[0]}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Heart size={12} /> {post.likes}</span>
                  <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.comments?.length || 0}</span>
                  <span className="flex items-center gap-1"><Eye size={12} /> {post.views}</span>
                  <span className="px-2 py-0.5 bg-gaming-darker rounded text-xs">{post.category}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handlePin(post)} className={`py-2 px-3 rounded-lg text-sm transition-colors ${post.isPinned ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gaming-darker text-gray-300 hover:text-yellow-400'}`}><Pin size={14} /></button>
                <button onClick={() => handleDelete(post)} className="py-2 px-3 bg-gaming-darker text-gray-300 rounded-lg hover:text-red-400 transition-colors text-sm"><Trash2 size={14} /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
