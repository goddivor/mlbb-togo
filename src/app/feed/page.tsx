'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Send } from 'lucide-react';
import { feedPosts } from '@/mocks/feed';
import type { FeedPost } from '@/mocks/types';
import { useT } from '@/lib/i18n';
import { PageHeader, SectionCard, Badge, Button } from '@/components/ui';

const TYPE_LABEL: Record<string, { label: string; variant: any }> = {
  tournament: { label: 'Tournament', variant: 'neon' },
  result: { label: 'Result', variant: 'green' },
  sponsor: { label: 'Sponsor', variant: 'gold' },
  recruitment: { label: 'Recruitment', variant: 'purple' },
  announcement: { label: 'Announcement', variant: 'neon' },
  highlight: { label: 'Highlight', variant: 'default' },
  award: { label: 'Award', variant: 'gold' },
};

export default function FeedPage() {
  const t = useT();
  const [posts, setPosts] = useState<FeedPost[]>(feedPosts);
  const [text, setText] = useState('');

  const post = () => {
    if (!text.trim()) return;
    const newPost: FeedPost = {
      id: `f${Date.now()}`,
      author: { name: 'You', avatar: '', role: 'Player' },
      date: new Date().toISOString(),
      type: 'announcement',
      content: text.trim(),
      likes: 0,
      comments: 0,
      shares: 0,
    };
    setPosts([newPost, ...posts]);
    setText('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Share2 size={28} />}
        title="Feed"
        subtitle="Latest news, results and announcements"
        variant="blue"
      />

      <SectionCard className="!p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
            Y
          </div>
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share something with the community..."
              className="w-full rounded-xl border p-3 text-sm outline-none transition-all duration-300 focus:shadow-lg"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)', minHeight: 80 }}
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={post} disabled={!text.trim()}>
                <Send size={14} /> Post
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="space-y-4">
        {posts.map((post: FeedPost, idx) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="glass-card p-5"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
                {post.author.name[0]}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--page-text)' }}>{post.author.name}</p>
                <p className="text-[11px]" style={{ color: 'var(--sidebar-text)' }}>{post.author.role} · {new Date(post.date).toLocaleString()}</p>
              </div>
              <div className="ml-auto">
                <Badge variant={TYPE_LABEL[post.type]?.variant || 'default'} size="sm">{TYPE_LABEL[post.type]?.label || post.type}</Badge>
              </div>
            </div>
            <p className="text-sm whitespace-pre-line" style={{ color: 'var(--page-text)' }}>{post.content}</p>
            <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: 'var(--sidebar-text)' }}>
              <button type="button" className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <Heart size={16} /> {post.likes}
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <MessageCircle size={16} /> {post.comments}
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <Share2 size={16} /> {post.shares}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
