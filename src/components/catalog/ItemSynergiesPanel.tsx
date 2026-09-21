'use client';

import { useState } from 'react';
import { Link2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { EmptyState, SectionCard } from '@/components/ui';
import { PanelSkeleton, fmtPct } from '@/components/game/hero-meta/shared';
import { useMeta } from '@/components/game/hero-meta/useMeta';
import { CatalogIcon, StatsFilters, StatsSource } from './shared';

function PairItem({ item, onSelect }: { item: any; onSelect: (gameId: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.gameId)}
      className="flex min-w-0 flex-1 items-center gap-2 rounded p-1 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <CatalogIcon src={item.icon} alt={item.name} size={36} />
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm font-semibold leading-tight text-ink-1">{item.name}</span>
        {item.category && <span className="block truncate text-[11px] text-ink-3">{item.category}</span>}
      </span>
    </button>
  );
}

/** Item pairs most often bought together in the top Academy builds. */
export default function ItemSynergiesPanel({ onSelectItem }: { onSelectItem: (gameId: number) => void }) {
  const t = useT();
  const [rank, setRank] = useState('all');
  const [lane, setLane] = useState<string | null>(null);
  const { data, loading } = useMeta<any>(
    () => api.gameCatalog.synergies({ rank, lane: lane ?? undefined, limit: 40 }),
    [rank, lane],
  );
  const pairs: any[] = data?.pairs ?? [];
  const max = Math.max(...pairs.map((p) => p.builds), 1);

  return (
    <div className="space-y-4">
      <SectionCard className="!p-4">
        <p className="mb-3 text-sm text-ink-2">{t('catalog.synergies.intro')}</p>
        <StatsFilters rank={rank} lane={lane} onRank={setRank} onLane={setLane} />
      </SectionCard>

      {loading && !data ? (
        <PanelSkeleton rows={6} />
      ) : !pairs.length ? (
        <EmptyState
          className="!min-h-[30vh]"
          icon={<Link2 size={26} />}
          title={data?.available ? t('catalog.synergies.none') : t('catalog.stats.unavailableTitle')}
          description={data?.available ? undefined : t('catalog.stats.unavailable')}
        />
      ) : (
        <SectionCard className={cn('!p-0', loading && 'opacity-60')}>
          <div className="hidden grid-cols-[2rem_minmax(0,1fr)_7rem_6rem_5rem] items-center gap-3 border-b border-line-subtle px-4 py-2.5 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3 md:grid">
            <span>#</span>
            <span>{t('catalog.synergies.pair')}</span>
            <span className="text-right">{t('catalog.synergies.builds')}</span>
            <span className="text-right">{t('catalog.usage.heroes')}</span>
            <span className="text-right">{t('catalog.win')}</span>
          </div>
          <ol>
            {pairs.map((p, i) => (
              <li
                key={`${p.items[0].gameId}-${p.items[1].gameId}`}
                className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-line-subtle px-4 py-3 last:border-b-0 md:grid-cols-[2rem_minmax(0,1fr)_7rem_6rem_5rem]"
              >
                <span className="text-sm font-bold text-ink-3 num">{i + 1}</span>
                <div className="flex min-w-0 items-center gap-1">
                  <PairItem item={p.items[0]} onSelect={onSelectItem} />
                  <Plus size={14} className="shrink-0 text-ink-3" aria-hidden="true" />
                  <PairItem item={p.items[1]} onSelect={onSelectItem} />
                </div>
                <div className="col-start-2 flex items-center justify-between gap-3 md:col-start-auto md:block md:text-right">
                  <div className="flex items-center gap-2 md:justify-end">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
                      <div className="h-full rounded-full bg-accent-cyan" style={{ width: `${(p.builds / max) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-ink-1 num">{p.builds}</span>
                  </div>
                  <span className="text-[11px] text-ink-3 num">{fmtPct(p.share)}</span>
                  <span className="text-xs text-ink-2 md:hidden">
                    {p.heroes} {t('catalog.usage.heroes')} ·{' '}
                    <b className={cn('num', (p.winRate ?? 0) >= 50 ? 'text-accent-green' : 'text-accent-red')}>{fmtPct(p.winRate)}</b>
                  </span>
                </div>
                <span className="hidden text-right text-sm text-ink-2 num md:block">{p.heroes}</span>
                <span
                  className={cn(
                    'hidden text-right text-sm font-semibold num md:block',
                    (p.winRate ?? 0) >= 50 ? 'text-accent-green' : 'text-accent-red',
                  )}
                >
                  {fmtPct(p.winRate)}
                </span>
              </li>
            ))}
          </ol>
        </SectionCard>
      )}
      <StatsSource data={data} />
    </div>
  );
}
