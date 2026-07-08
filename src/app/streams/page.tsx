'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Calendar, Filter } from 'lucide-react';
import { streams } from '@/mocks/streams';
import type { Stream } from '@/mocks/types';
import { useT } from '@/lib/i18n';
import { PageHeader, SectionCard, Badge, Button } from '@/components/ui';

const FILTERS = ['All', 'Live', 'Replays', 'Highlights'] as const;

export default function StreamsPage() {
  const t = useT();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [season, setSeason] = useState('All Seasons');
  const [tournament, setTournament] = useState('All Tournaments');

  const filtered = streams.filter((s) => {
    if (filter === 'All') return true;
    if (filter === 'Live') return s.type === 'live';
    if (filter === 'Replays') return s.type === 'replay';
    if (filter === 'Highlights') return s.type === 'highlight';
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Play size={28} />}
        title="Streams"
        subtitle="Watch live matches, replays and highlights"
        variant="blue"
      />

      <SectionCard className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={16} style={{ color: 'var(--sidebar-text)' }} />
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: filter === f ? 'var(--accent-primary)' : 'var(--surface-bg)',
                color: filter === f ? 'var(--badge-success-text)' : 'var(--page-text)',
                border: '1px solid var(--card-border)',
              }}
            >
              {f}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)', color: 'var(--page-text)' }}
            >
              <option>All Seasons</option>
              <option>Season 14</option>
              <option>Season 13</option>
            </select>
            <select
              value={tournament}
              onChange={(e) => setTournament(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)', color: 'var(--page-text)' }}
            >
              <option>All Tournaments</option>
              <option>MPL Indonesia</option>
              <option>MPL Philippines</option>
            </select>
          </div>
        </div>
      </SectionCard>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--sidebar-text)' }}>No streams for this filter.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
              className="glass-card overflow-hidden hover:-translate-y-1"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <div className="relative w-full aspect-video" style={{ background: 'var(--surface-bg)' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play size={40} style={{ color: 'var(--accent-primary)' }} />
                </div>
                {s.type === 'live' && (
                  <span className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: '#ef4444', color: '#fff' }}>
                    LIVE
                  </span>
                )}
                <span className="absolute bottom-3 right-3 rounded-lg px-2 py-1 text-xs font-medium" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                  {s.duration}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-bold" style={{ color: 'var(--page-text)' }}>{s.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--sidebar-text)' }}>
                  {s.tournament && <Badge variant="purple" size="sm">{s.tournament}</Badge>}
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} /> {s.date}
                  </span>
                </div>
                {s.teams?.length ? (
                  <p className="mt-2 text-xs" style={{ color: 'var(--sidebar-text)' }}>{s.teams.join(' vs ')}</p>
                ) : null}
                <Button size="sm" className="mt-3 w-full">
                  <Play size={14} /> Watch
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
