'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Swords, Crown } from 'lucide-react';
import { playersRankings, squadsRankings, heroesRankings } from '@/mocks/rankings';
import type { Player, Squad, Hero } from '@/mocks/types';
import { useT } from '@/lib/i18n';
import { PageHeader, SectionCard, Badge, Button } from '@/components/ui';

const TABS = [
  { id: 'players', label: 'Players', icon: Users },
  { id: 'squads', label: 'Squads', icon: Swords },
  { id: 'heroes', label: 'Heroes', icon: Trophy },
] as const;

export default function RankingsPage() {
  const t = useT();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('players');
  const [page, setPage] = useState(1);
  const perPage = 5;

  const playersPage = playersRankings.slice((page - 1) * perPage, page * perPage);
  const squadsPage = squadsRankings.slice((page - 1) * perPage, page * perPage);
  const heroesPage = heroesRankings.slice((page - 1) * perPage, page * perPage);

  const totalPages = (() => {
    if (tab === 'players') return Math.max(1, Math.ceil(playersRankings.length / perPage));
    if (tab === 'squads') return Math.max(1, Math.ceil(squadsRankings.length / perPage));
    return Math.max(1, Math.ceil(heroesRankings.length / perPage));
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Trophy size={28} />}
        title="Rankings"
        subtitle="Top players, squads and heroes"
        variant="blue"
      />

      <SectionCard className="!p-4">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setPage(1); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? 'var(--accent-primary)' : 'var(--surface-bg)',
                color: tab === t.id ? 'var(--badge-success-text)' : 'var(--page-text)',
                border: '1px solid var(--card-border)',
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </SectionCard>

      {tab === 'players' && (
        <div className="space-y-3">
          {playersPage.map((p: Player, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="glass-card flex items-center gap-4 p-4"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <span className="text-lg font-black w-8 text-center" style={{ color: 'var(--accent-primary)' }}>{idx + 1 + (page - 1) * perPage}</span>
              <div className="w-12 h-12 rounded-xl overflow-hidden" style={{ background: 'var(--surface-bg)' }}>
                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
                  {(p.displayName || p.username)?.[0]?.toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--page-text)' }}>{p.displayName || p.username}</p>
                <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>{p.squad?.name || 'Free Agent'} · {p.country}</p>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--sidebar-text)' }}>
                <Badge variant="neon" size="sm">{p.gameRank}</Badge>
                <span>WR {p.winRate}%</span>
                <span>MVP {p.mvp}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'squads' && (
        <div className="space-y-3">
          {squadsPage.map((s: Squad, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="glass-card flex items-center gap-4 p-4"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <span className="text-lg font-black w-8 text-center" style={{ color: 'var(--accent-primary)' }}>{idx + 1 + (page - 1) * perPage}</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
                {s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--page-text)' }}>{s.name}</p>
                <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>Coach: {s.coach} · {s.region}</p>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--sidebar-text)' }}>
                <Badge variant="green" size="sm">{s.wins}W</Badge>
                <Badge variant="danger" size="sm">{s.losses}L</Badge>
                <span>WR {s.winRate}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'heroes' && (
        <div className="space-y-3">
          {heroesPage.map((h: Hero, idx) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="glass-card flex items-center gap-4 p-4"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <span className="text-lg font-black w-8 text-center" style={{ color: 'var(--accent-primary)' }}>{idx + 1 + (page - 1) * perPage}</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
                {h.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--page-text)' }}>{h.name}</p>
                <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>{h.role}</p>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--sidebar-text)' }}>
                <span>Pick {h.pickRate}%</span>
                <span>Ban {h.banRate}%</span>
                <Badge variant="neon" size="sm">WR {h.winRate}%</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
        <span className="text-xs" style={{ color: 'var(--sidebar-text)' }}>{page} / {totalPages}</span>
        <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
