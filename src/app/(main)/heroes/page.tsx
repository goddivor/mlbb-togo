'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LayoutGrid, Rows3, Search, Swords } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader, SectionCard, EmptyState, Skeleton, StatTile, Tabs, DataTable, type DataColumn } from '@/components/ui';
import { HeroCard } from '@/components/game';
import HeroDetailModal from '@/components/game/HeroDetailModal';
import RoleIcon, { roleLabel } from '@/components/game/RoleIcon';
import { HeroPortrait, RankTierTabs, WindowTabs, fmtPct } from '@/components/game/hero-meta/shared';
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

type SortKey = 'name' | 'winRate' | 'pickRate' | 'banRate';

export default function HeroesPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const [heroes, setHeroes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [rank, setRank] = useState('all');
  const [days, setDays] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [rates, setRates] = useState<Map<number, any>>(new Map());
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    api.mlbb
      .heroes()
      .then((d: any) => setHeroes(d?.heroes || []))
      .catch(() => setHeroes([]))
      .finally(() => setLoading(false));
  }, []);

  // Live win/pick/ban for the selected rank tier and window (cached server side).
  useEffect(() => {
    let alive = true;
    setRatesLoading(true);
    api.heroes
      .metaRanking({ rank, days })
      .then((d: any) => {
        if (!alive) return;
        setRates(new Map((d?.heroes || []).map((h: any) => [Number(h.heroId), h])));
      })
      .catch(() => alive && setRates(new Map()))
      .finally(() => alive && setRatesLoading(false));
    return () => {
      alive = false;
    };
  }, [rank, days]);

  const onSort = (key: string) => {
    const k = key as SortKey;
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir(k === 'name' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = heroes
      .filter((h) => {
        const okRole = role === 'all' || (h.roles || []).includes(role);
        const okName = !q || (h.name || '').toLowerCase().includes(q);
        return okRole && okName;
      })
      .map((h) => ({ ...h, meta: rates.get(Number(h.heroId)) ?? null }));
    const dir = sortDir === 'asc' ? 1 : -1;
    return rows.sort((a, b) => {
      if (sortKey === 'name') return dir * String(a.name || '').localeCompare(String(b.name || ''));
      const av = a.meta?.[sortKey];
      const bv = b.meta?.[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // unknown rates always last
      if (bv == null) return -1;
      return dir * (av - bv);
    });
  }, [heroes, role, query, rates, sortKey, sortDir]);

  const columns: DataColumn<any>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('heroMeta.table.hero'),
        sortable: true,
        render: (h: any, i: number) => (
          <div className="flex items-center gap-2.5">
            <HeroPortrait src={h.image} name={h.name} size={36} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-1">{h.name}</p>
              {sortKey !== 'name' && h.meta?.[sortKey] != null && (
                <p className="text-[11px] text-ink-3 num">#{i + 1}</p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'roles',
        header: t('heroMeta.table.role'),
        hideBelow: 'sm',
        render: (h: any) => (
          <div className="flex flex-wrap gap-1.5">
            {(h.roles || []).slice(0, 2).map((r: string) => (
              <span key={r} className="inline-flex items-center gap-1 text-xs text-ink-2">
                <RoleIcon role={r} size={13} />
                {roleLabel(t, r)}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'winRate',
        header: t('heroMeta.table.win'),
        sortable: true,
        align: 'right',
        render: (h: any) => (
          <span className={h.meta?.winRate >= 50 ? 'font-semibold text-accent-green' : 'text-ink-1'}>
            {fmtPct(h.meta?.winRate, 2)}
          </span>
        ),
      },
      {
        key: 'pickRate',
        header: t('heroMeta.table.pick'),
        sortable: true,
        align: 'right',
        render: (h: any) => <span className="text-accent-cyan">{fmtPct(h.meta?.pickRate, 2)}</span>,
      },
      {
        key: 'banRate',
        header: t('heroMeta.table.ban'),
        sortable: true,
        align: 'right',
        render: (h: any) => <span className="text-accent-red">{fmtPct(h.meta?.banRate, 2)}</span>,
      },
    ],
    [t, sortKey],
  );

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
        <div className="flex flex-col gap-3 border-t border-line-subtle px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('heroMeta.filters.meta')}</span>
            <RankTierTabs value={rank} onChange={setRank} />
            <WindowTabs value={days} onChange={setDays} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={`${sortKey}:${sortDir}`}
              onChange={(e) => {
                const [k, d] = e.target.value.split(':');
                setSortKey(k as SortKey);
                setSortDir(d as 'asc' | 'desc');
              }}
              aria-label={t('heroMeta.sort.label')}
              className="rounded border border-line-strong bg-surface-1 px-2.5 py-1.5 text-xs text-ink-1 outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
            >
              <option value="name:asc">{t('heroMeta.sort.name')}</option>
              <option value="winRate:desc">{t('heroMeta.sort.winRate')}</option>
              <option value="pickRate:desc">{t('heroMeta.sort.pickRate')}</option>
              <option value="banRate:desc">{t('heroMeta.sort.banRate')}</option>
            </select>
            <Tabs
              size="sm"
              tabs={[
                { id: 'grid', label: t('heroMeta.view.grid'), icon: LayoutGrid },
                { id: 'table', label: t('heroMeta.view.table'), icon: Rows3 },
              ]}
              active={view}
              onChange={(id: 'grid' | 'table') => setView(id)}
            />
          </div>
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
      ) : view === 'table' ? (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(h: any, i) => h.heroId ?? i}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          onRowClick={(h: any) => setSelected(h.heroId)}
          loading={ratesLoading && rates.size === 0}
          dense
          maxHeight="70vh"
        />
      ) : (
        <motion.div
          key={`${role}-${query}-${sortKey}-${sortDir}`}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6"
          initial="hidden"
          animate="visible"
        >
          {filtered.map((h, i) => (
            <motion.div key={h.heroId ?? i} custom={i} variants={reduce ? still : cardIn}>
              <div className="relative">
                <HeroCard hero={h} size="sm" onClick={() => setSelected(h.heroId)} />
                {h.meta?.winRate != null && (
                  <span
                    className={`pointer-events-none absolute right-2 top-2 rounded bg-surface-0/75 px-1.5 py-0.5 text-[10px] font-bold num backdrop-blur-sm ${
                      h.meta.winRate >= 50 ? 'text-accent-green' : 'text-accent-red'
                    }`}
                    title={t('heroes.winRate')}
                  >
                    {fmtPct(h.meta.winRate)}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <HeroDetailModal heroId={selected} onClose={() => setSelected(null)} onSelectHero={setSelected} />
    </div>
  );
}
