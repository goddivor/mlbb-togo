'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessagesSquare, Plus, Heart, MessageCircle, Eye, Pin, Search,
  TrendingUp, Clock,
} from 'lucide-react';
import { Card, SectionCard, Badge, Avatar, Button, PageHeader, EmptyState, Input, Select, Textarea } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { useForumStore, useAuthStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { timeAgo, getRankName } from '@/lib/helpers';
import { useT } from '@/lib/i18n';

export default function Forum() {
  const t = useT();
  const { posts, categories, setPosts, addPost, likePost } = useForumStore();
  const { userProfile } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('recent');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const [newCategory, setNewCategory] = useState('strategies');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    api.posts.list().then(setPosts);
  }, [setPosts]);

  const filteredPosts = posts
    .filter((p: any) => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      if (activeSort === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (activeSort === 'popular') return b.likes - a.likes;
      if (activeSort === 'comments') return b.comments.length - a.comments.length;
      return 0;
    });

  const handleLike = (id: string) => {
    likePost(id);
    api.posts.like(id).catch(() => {});
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const post = {
      id: 'post_' + Date.now(),
      category: newCategory,
      title: newTitle,
      content: newContent,
      authorId: userProfile?.id || 'me',
      authorName: userProfile?.username || t('forum.you'),
      authorRank: userProfile?.rank || 'warrior',
      likes: 0,
      views: 0,
      comments: [],
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
    addPost(post);
    api.posts.create(post).catch(() => {});
    setShowCreate(false);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      <PageHeader
        icon={<MessagesSquare size={28} />}
        title={t('forum.title')}
        subtitle={t('forum.subtitle')}
        variant="danger"
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            {t('forum.newPost')}
          </Button>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">

        <div className="lg:w-64 flex-shrink-0">
          <SectionCard>
            <h3 className="font-bold text-sm mb-3 text-white">{t('forum.categories')}</h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-neon-blue/10 text-neon-blue'
                    : 'text-gray-400 hover:bg-gaming-surface'
                }`}
              >
                📋 {t('forum.allCategories')}
              </button>
              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-neon-blue/10 text-neon-blue'
                      : 'text-gray-400 hover:bg-gaming-surface'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="flex-1">

          <SectionCard className="!p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder={t('forum.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none bg-gaming-surface border border-gaming-border text-white placeholder-gray-500 focus:border-neon-blue/50"
                />
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'recent', label: t('forum.sortRecent'), icon: Clock },
                  { id: 'popular', label: t('forum.sortPopular'), icon: TrendingUp },
                  { id: 'comments', label: t('forum.sortDiscussed'), icon: MessageCircle },
                ].map((sort) => (
                  <button
                    key={sort.id}
                    onClick={() => setActiveSort(sort.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      activeSort === sort.id
                        ? 'bg-neon-blue/10 text-neon-blue'
                        : 'text-gray-400 hover:bg-gaming-surface'
                    }`}
                  >
                    <sort.icon size={14} />
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <div className="space-y-4">
            {filteredPosts.map((post: any, index: number) => {
              const category = categories.find((c: any) => c.id === post.category);

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="cursor-pointer" onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}>
                    <div className="flex gap-4">
                      <Avatar name={post.authorName} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {post.isPinned && <Pin size={14} className="text-amber-400" />}
                          <Badge variant="purple" size="sm">{category?.icon} {category?.name}</Badge>
                          <span className="text-xs text-gray-500">
                            {timeAgo(post.createdAt)}
                          </span>
                        </div>
                        <h3 className="font-bold text-base mb-1 text-white">
                          {post.title}
                        </h3>
                        <p className="text-sm line-clamp-2 mb-3 text-gray-400">
                          {post.content}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Avatar name={post.authorName} size="sm" />
                            <span className="font-medium text-gray-300">
                              {post.authorName}
                            </span>
                            <Badge variant="neon" size="sm">{getRankName(post.authorRank)}</Badge>
                          </div>
                          <div className="flex items-center gap-3 ml-auto">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                              className="flex items-center gap-1 hover:text-red-400 transition-colors"
                            >
                              <Heart size={14} className="text-red-400" />
                              {post.likes}
                            </button>
                            <span className="flex items-center gap-1">
                              <MessageCircle size={14} />
                              {post.comments.length}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye size={14} />
                              {post.views}
                            </span>
                          </div>
                        </div>

                        {selectedPost === post.id && post.comments.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t border-gaming-border"
                          >
                            <p className="text-xs text-gray-400 mb-3">{t('forum.comments')} ({post.comments.length})</p>
                            {post.comments.map((comment: any) => (
                              <div key={comment.id} className="flex gap-3 mb-3">
                                <Avatar name={comment.authorName} size="sm" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white">
                                      {comment.authorName}
                                    </span>
                                    <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
                                  </div>
                                  <p className="text-sm mt-0.5 text-gray-400">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div className="flex gap-2 mt-3">
                              <input
                                type="text"
                                placeholder={t('forum.addComment')}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none bg-gaming-surface border border-gaming-border text-white placeholder-gray-500 focus:border-neon-blue/50"
                              />
                              <Button size="sm">{t('forum.send')}</Button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {filteredPosts.length === 0 && (
            <EmptyState
              icon={<MessagesSquare size={28} />}
              title={t('forum.noPostsFound')}
              description={t('forum.beFirstToPost')}
            />
          )}
        </div>
      </div>

      {/* Modale de création de sujet */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('forum.newPost')}
        icon={<MessagesSquare size={20} />}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label={t('forum.category')}
            value={newCategory}
            onChange={(e: any) => setNewCategory(e.target.value)}
          >
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </Select>
          <Input
            label={t('forum.postTitle')}
            type="text"
            value={newTitle}
            onChange={(e: any) => setNewTitle(e.target.value)}
            placeholder={t('forum.postTitlePlaceholder')}
          />
          <Textarea
            label={t('forum.content')}
            value={newContent}
            onChange={(e: any) => setNewContent(e.target.value)}
            placeholder={t('forum.contentPlaceholder')}
            rows={5}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1">{t('forum.cancel')}</Button>
            <Button onClick={handleCreate} className="flex-1">{t('forum.publish')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
