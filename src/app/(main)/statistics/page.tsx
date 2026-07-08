'use client';

import { motion } from 'framer-motion';
import { BarChart3, Users, TrendingUp } from 'lucide-react';
import { squadsStats } from '@/mocks/statistics';
import type { Squad } from '@/mocks/types';
import { useT } from '@/lib/i18n';
import { PageHeader, SectionCard, Badge, Button } from '@/components/ui';

export default function StatisticsPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BarChart3 size={28} />}
        title="Statistics"
        subtitle="Squad stats, player metrics and performance charts"
        variant="blue"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {squadsStats.map((s: Squad, idx) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card p-5 hover:-translate-y-1"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
                {s.name[0]}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--page-text)' }}>{s.name}</p>
                <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>Coach: {s.coach} · {s.region}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border p-3" style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)' }}>
                <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--sidebar-text)' }}>Wins</p>
                <p className="text-lg font-bold" style={{ color: 'var(--badge-success-text)' }}>{s.wins}</p>
              </div>
              <div className="rounded-xl border p-3" style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)' }}>
                <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--sidebar-text)' }}>Losses</p>
                <p className="text-lg font-bold" style={{ color: 'var(--badge-danger-text)' }}>{s.losses}</p>
              </div>
              <div className="rounded-xl border p-3 col-span-2" style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)' }}>
                <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--sidebar-text)' }}>Win Rate</p>
                <p className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>{s.winRate}%</p>
              </div>
            </div>

            <div className="rounded-xl border p-3" style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)' }}>
              <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: 'var(--sidebar-text)' }}>Performance</p>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                <div className="h-full rounded-full" style={{ width: `${s.winRate}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }} />
              </div>
            </div>

            <Button size="sm" variant="secondary" className="mt-4 w-full">
              <TrendingUp size={14} /> View Details
            </Button>
          </motion.div>
        ))}
      </div>

      <SectionCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-bg)', color: 'var(--accent-primary)' }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--page-text)' }}>Win Rate Trends</p>
            <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>Placeholder for Chart.js integration</p>
          </div>
        </div>
        <div className="h-48 rounded-xl border flex items-center justify-center text-sm" style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)', color: 'var(--sidebar-text)' }}>
          Chart placeholder — connect to API later
        </div>
      </SectionCard>
    </div>
  );
}
