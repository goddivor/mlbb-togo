'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Coins, Link2, Package, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { still, transitionBase } from '@/lib/motion';
import { EmptyState, PageHeader, SectionCard, Skeleton, StatTile, Tabs } from '@/components/ui';
import HeroDetailModal from '@/components/game/HeroDetailModal';
import ItemDetailModal, { type CatalogItem } from '@/components/catalog/ItemDetailModal';
import ItemSynergiesPanel from '@/components/catalog/ItemSynergiesPanel';
import { CatalogIcon } from '@/components/catalog/shared';

const cardIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { ...transitionBase, delay: Math.min(i * 0.01, 0.3) } }),
};

type View = 'items' | 'synergies';
type Kind = 'all' | 'final' | 'component';

const readView = (): View => {
  if (typeof window === 'undefined') return 'items';
  return new URLSearchParams(window.location.search).get('view') === 'synergies' ? 'synergies' : 'items';
};

export default function ItemsPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>('items');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number | null; name: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [kind, setKind] = useState<Kind>('all');
  const [selected, setSelected] = useState<number | null>(null);
  const [hero, setHero] = useState<number | null>(null);

  useEffect(() => {
    setView(readView());
    api.gameCatalog
      .items()
      .then((d: any) => {
        setItems(d?.items ?? []);
        setCategories(d?.categories ?? []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const changeView = (v: View) => {
    setView(v);
    const url = new URL(window.location.href);
    if (v === 'synergies') url.searchParams.set('view', 'synergies');
    else url.searchParams.delete('view');
    window.history.replaceState(null, '', url.toString());
  };

  const byGameId = useMemo(
    () => new Map(items.filter((i) => i.gameId != null).map((i) => [i.gameId as number, i])),
    [items],
  );
  const categoryOf = (i: CatalogItem) => (i.category ?? i.type ?? '').toLowerCase();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (category === 'all' || categoryOf(i) === category) &&
        (kind === 'all' || (kind === 'component') === i.isComponent) &&
        (!q || i.name.toLowerCase().includes(q)),
    );
  }, [items, query, category, kind]);

  const categoryTabs = useMemo(
    () => [
      { id: 'all', label: t('catalog.items.allCategories'), count: items.length },
      ...categories.map((c) => ({ id: c.name.toLowerCase(), label: c.name, count: c.count })),
    ],
    [categories, items.length, t],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.section.catalog')}
        icon={<Package size={20} />}
        title={t('catalog.items.title')}
        subtitle={loading ? t('catalog.loading') : t('catalog.items.subtitle', { n: items.length })}
        action={
          <Tabs
            size="sm"
            tabs={[
              { id: 'items', label: t('catalog.items.tab'), icon: Package },
              { id: 'synergies', label: t('catalog.synergies.tab'), icon: Link2 },
            ]}
            active={view}
            onChange={changeView}
          />
        }
      />

      {view === 'synergies' ? (
        <ItemSynergiesPanel onSelectItem={setSelected} />
      ) : (
        <>
          <SectionCard className="!p-0">
            <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('catalog.items.search')}
                  aria-label={t('catalog.items.search')}
                  className="w-full rounded border border-line-strong bg-surface-1 py-2.5 pl-9 pr-3 text-sm text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
                />
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <Tabs
                  size="sm"
                  tabs={[
                    { id: 'all', label: t('catalog.items.kind.all') },
                    { id: 'final', label: t('catalog.items.kind.final') },
                    { id: 'component', label: t('catalog.items.kind.component') },
                  ]}
                  active={kind}
                  onChange={(id: Kind) => setKind(id)}
                />
                <StatTile label={t('catalog.items.title')} value={loading ? '—' : filtered.length} accent="cyan" align="right" />
              </div>
            </div>
            <div className="mt-2 overflow-x-auto overflow-y-hidden px-4">
              <Tabs
                variant="underline"
                size="sm"
                tabs={categoryTabs}
                active={category}
                onChange={(id: string) => setCategory(id)}
                className="min-w-max whitespace-nowrap border-b-0"
              />
            </div>
          </SectionCard>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" aria-busy="true">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Search size={26} />} title={items.length ? t('catalog.items.none') : t('catalog.items.empty')} />
          ) : (
            <motion.div
              key={`${category}-${kind}-${query}`}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6"
              initial="hidden"
              animate="visible"
            >
              {filtered.map((it, i) => (
                <motion.button
                  key={it.id}
                  type="button"
                  custom={i}
                  variants={reduce ? still : cardIn}
                  onClick={() => it.gameId != null && setSelected(it.gameId)}
                  className="group flex flex-col items-center gap-2 rounded-lg border border-line-subtle bg-surface-1 p-3 text-center transition-[border-color,transform] duration-base hover:-translate-y-0.5 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <CatalogIcon src={it.icon} alt={it.name} size={56} />
                  <span className="line-clamp-2 min-h-[2.5em] text-sm font-semibold leading-tight text-ink-1 group-hover:text-primary">
                    {it.name}
                  </span>
                  <span className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-ink-3">
                    {it.category && <span>{it.category}</span>}
                    {it.tier != null && (
                      <span className="rounded bg-surface-3 px-1.5 py-0.5 font-semibold text-ink-2">
                        {t('catalog.items.tierShort', { n: it.tier })}
                      </span>
                    )}
                    {it.gold != null && (
                      <span className="inline-flex items-center gap-0.5 font-semibold text-accent-gold num">
                        <Coins size={11} aria-hidden="true" />
                        {it.gold}
                      </span>
                    )}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </>
      )}

      <ItemDetailModal
        item={selected != null ? byGameId.get(selected) ?? null : null}
        byGameId={byGameId}
        onSelect={setSelected}
        onClose={() => setSelected(null)}
        onSelectHero={(heroId) => {
          // One modal at a time: the hero sheet replaces the item sheet.
          setSelected(null);
          setHero(heroId);
        }}
      />
      <HeroDetailModal heroId={hero} onClose={() => setHero(null)} onSelectHero={setHero} />
    </div>
  );
}
