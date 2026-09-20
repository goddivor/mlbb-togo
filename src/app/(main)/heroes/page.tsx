'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, Swords } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader, SectionCard, EmptyState, Skeleton, StatTile, Tabs } from '@/components/ui';
import { HeroCard } from '@/components/game';
import HeroDetailModal from '@/components/game/HeroDetailModal';
import { useT } from '@/lib/i18n';
import { still, transitionBase } from '@/lib/motion';
import type { Variants } from 'framer-motion';

// Large grid: cap the entrance delay so the last card never waits.
const cardIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { ...transitionBase, delay: Math.min(i * 0.012, 0.35) } }),
};

const ROLES: Array<{ key: string; labelKey: string }> = [
  { key: 'all', labelKey: 'heroes.role.all' },
  { key: 'Tank', labelKey: 'role.tank' },
  { key: 'Fighter', labelKey: 'role.fighter' },
  { key: 'Assassin', labelKey: 'role.assassin' },
  { key: 'Mage', labelKey: 'role.mage' },
  { key: 'Marksman', labelKey: 'role.marksman' },
  { key: 'Support', labelKey: 'role.support' },
];

export default function HeroesPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const [heroes, setHeroes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    api.mlbb
      .heroes()
      .then((d: any) => setHeroes(d?.heroes || []))
      .catch(() => setHeroes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return heroes.filter((h) => {
      const okRole = role === 'all' || (h.roles || []).includes(role);
      const okName = !q || (h.name || '').toLowerCase().includes(q);
      return okRole && okName;
    });
  }, [heroes, role, query]);

  const roleTabs = useMemo(
    () =>
      ROLES.map((r) => ({
        id: r.key,
        label: t(r.labelKey),
        count: r.key === 'all' ? heroes.length : heroes.filter((h) => (h.roles || []).includes(r.key)).length,
      })),
    [heroes, t],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.section.catalog')}
        icon={<Swords size={20} />}
        title={t('heroes.title')}
        subtitle={loading ? t('heroes.loading') : `${heroes.length} ${t('heroes.count')}`}
      />

      {/* Filters: search + roles */}
      <SectionCard className="!p-0">
        <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('heroes.search')}
              className="w-full rounded border border-line-strong bg-surface-1 py-2.5 pl-9 pr-3 text-sm text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
            />
          </div>
          <StatTile label={t('heroes.title')} value={loading ? '—' : filtered.length} accent="cyan" align="right" />
        </div>
        <div className="mt-2 overflow-x-auto overflow-y-hidden px-4">
          <Tabs
            variant="underline"
            size="sm"
            tabs={roleTabs}
            active={role}
            onChange={(id: string) => setRole(id)}
            className="min-w-max whitespace-nowrap border-b-0"
          />
        </div>
      </SectionCard>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" aria-busy="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-line-subtle bg-surface-1">
              <Skeleton className="aspect-[4/5] w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search size={26} />} title={t('heroes.none')} />
      ) : (
        <motion.div
          key={`${role}-${query}`}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6"
          initial="hidden"
          animate="visible"
        >
          {filtered.map((h, i) => (
            <motion.div key={h.heroId ?? i} custom={i} variants={reduce ? still : cardIn}>
              <HeroCard hero={h} size="sm" onClick={() => setSelected(h.heroId)} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <HeroDetailModal heroId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
