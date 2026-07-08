'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Trophy } from 'lucide-react';
import { awards, awardCategories } from '@/mocks/awards';
import type { Award } from '@/mocks/types';
import { useT } from '@/lib/i18n';
import { PageHeader, SectionCard, Badge, Button } from '@/components/ui';

export default function AwardsPage() {
  const t = useT();
  const [category, setCategory] = useState<string>('All');

  const filtered = category === 'All' ? awards : awards.filter((a) => a.category === category);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Trophy size={28} />}
        title="Awards"
        subtitle="Season awards and honors"
        variant="gold"
      />

      <SectionCard className="!p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategory('All')}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: category === 'All' ? 'var(--accent-primary)' : 'var(--surface-bg)',
              color: category === 'All' ? 'var(--badge-success-text)' : 'var(--page-text)',
              border: '1px solid var(--card-border)',
            }}
          >
            All
          </button>
          {awardCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: category === cat ? 'var(--accent-primary)' : 'var(--surface-bg)',
                color: category === cat ? 'var(--badge-success-text)' : 'var(--page-text)',
                border: '1px solid var(--card-border)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a: Award, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.5) }}
            className="glass-card p-5 hover:-translate-y-1"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff' }}>
                {a.category.includes('MVP') || a.category.includes('Best Squad') ? <Crown size={20} /> : <Medal size={20} />}
              </div>
              <div>
                <Badge variant="gold" size="sm">{a.category}</Badge>
                <p className="text-xs mt-1" style={{ color: 'var(--sidebar-text)' }}>{a.season}</p>
              </div>
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--page-text)' }}>{a.name}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--sidebar-text)' }}>{a.description}</p>
            {a.stats && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(a.stats).map(([k, v]) => (
                  <span key={k} className="rounded-lg px-2 py-1 text-[11px] font-medium" style={{ background: 'var(--surface-bg)', color: 'var(--page-text)', border: '1px solid var(--card-border)' }}>
                    {k}: {String(v)}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
