'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Swords } from 'lucide-react';
import { api, mlbbImg } from '@/lib/api';
import { PageHeader, SectionCard, Button, EmptyState, LoadingSpinner } from '@/components/ui';
import HeroDetailModal from '@/components/game/HeroDetailModal';
import { useT } from '@/lib/i18n';

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

  return (
    <div className="space-y-6">
      <PageHeader
        variant="default"
        icon={<Swords size={28} className="text-white" />}
        title={t('heroes.title')}
        subtitle={loading ? t('heroes.loading') : `${heroes.length} ${t('heroes.count')}`}
      />

      {/* Filters: search + roles */}
      <SectionCard className="flex flex-col gap-3 !p-4">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bodydark2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('heroes.search')}
            className="pl-9 pr-3 py-2 w-full text-sm rounded-sm bg-gray-2 border border-stroke text-black placeholder-bodydark2 focus:outline-none focus:border-primary dark:bg-meta-4 dark:border-strokedark dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <Button
              key={r.key}
              size="sm"
              variant={role === r.key ? 'primary' : 'outline'}
              onClick={() => setRole(r.key)}
            >
              {t(r.labelKey)}
            </Button>
          ))}
        </div>
      </SectionCard>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search size={26} />} title={t('heroes.none')} />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filtered.map((h, i) => (
            <motion.button
              key={h.heroId ?? i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.4) }}
              onClick={() => setSelected(h.heroId)}
              className="group rounded-sm overflow-hidden border border-stroke bg-white shadow-default hover:border-primary transition-colors text-left dark:border-strokedark dark:bg-boxdark"
            >
              <div className="aspect-square bg-gray dark:bg-meta-4 overflow-hidden">
                {h.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mlbbImg(h.image, 160)}
                    alt={h.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold text-black dark:text-white truncate">{h.name}</p>
                <p className="text-[10px] text-body dark:text-bodydark truncate">{(h.roles || []).join(' · ')}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <HeroDetailModal heroId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
