'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Coins, Package } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui';
import { api } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { PanelSkeleton, fmtPct } from '@/components/game/hero-meta/shared';
import { useMeta } from '@/components/game/hero-meta/useMeta';
import { CatalogIcon, HeroUsageList, RichText, StatsFilters, StatsSource, UsageSummary } from './shared';

export type CatalogItem = {
  id: string;
  gameId: number | null;
  name: string;
  icon: string | null;
  gold: number | null;
  type: string | null;
  stats: string | null;
  passive: string | null;
  description: string | null;
  categoryId: number | null;
  category: string | null;
  tier: number | null;
  isComponent: boolean;
  buildsFrom: number[];
  buildsInto: number[];
};

function ItemNode({
  item,
  onSelect,
  current = false,
  size = 44,
}: {
  item: CatalogItem;
  onSelect?: (gameId: number) => void;
  current?: boolean;
  size?: number;
}) {
  return (
    <button
      type="button"
      disabled={current}
      onClick={() => item.gameId != null && onSelect?.(item.gameId)}
      title={item.name}
      className={cn(
        'flex w-[76px] flex-col items-center gap-1 rounded p-1 text-center transition-colors',
        current ? 'cursor-default' : 'hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      )}
    >
      <CatalogIcon src={item.icon} alt={item.name} size={size} className={current ? 'ring-2 ring-primary' : undefined} />
      <span className={cn('line-clamp-2 text-[10px] leading-tight', current ? 'font-semibold text-ink-1' : 'text-ink-2')}>{item.name}</span>
      {item.gold != null && <span className="text-[10px] text-accent-gold num">{item.gold}</span>}
    </button>
  );
}

/** Build path: items it builds into, the item, its components (and theirs). */
function BuildTree({
  item,
  byGameId,
  onSelect,
}: {
  item: CatalogItem;
  byGameId: Map<number, CatalogItem>;
  onSelect: (gameId: number) => void;
}) {
  const t = useT();
  const resolve = (ids: number[]) => ids.map((id) => byGameId.get(id)).filter((x): x is CatalogItem => !!x);
  const into = resolve(item.buildsInto);
  const from = resolve(item.buildsFrom);

  if (!into.length && !from.length) return <p className="text-sm text-ink-3">{t('catalog.items.noRecipe')}</p>;

  return (
    <div className="flex flex-col items-center gap-2">
      {into.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('catalog.items.buildsInto')}</p>
          <div className="flex flex-wrap justify-center gap-1">
            {into.map((it) => (
              <ItemNode key={it.id} item={it} onSelect={onSelect} size={40} />
            ))}
          </div>
          <ArrowDown size={16} className="text-ink-3" aria-hidden="true" />
        </>
      )}
      <ItemNode item={item} current size={52} />
      {from.length > 0 && (
        <>
          <ArrowDown size={16} className="text-ink-3" aria-hidden="true" />
          <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('catalog.items.buildsFrom')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {from.map((it) => {
              const parts = resolve(it.buildsFrom);
              return (
                <div key={it.id} className="flex flex-col items-center rounded-lg border border-line-subtle bg-surface-2/40 p-1.5">
                  <ItemNode item={it} onSelect={onSelect} size={40} />
                  {parts.length > 0 && (
                    <div className="mt-1 flex flex-wrap justify-center gap-0.5 border-t border-line-subtle pt-1">
                      {parts.map((p) => (
                        <ItemNode key={p.id} item={p} onSelect={onSelect} size={30} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ItemHeroes({ gameId, onSelectHero }: { gameId: number; onSelectHero?: (heroId: number) => void }) {
  const t = useT();
  const [rank, setRank] = useState('all');
  const [lane, setLane] = useState<string | null>(null);
  const { data, loading } = useMeta<any>(
    () => api.gameCatalog.itemHeroes(gameId, { rank, lane: lane ?? undefined, limit: 8 }),
    [gameId, rank, lane],
  );
  const heroes = data?.heroes ?? [];
  return (
    <div>
      <div className="mb-3">
        <StatsFilters rank={rank} lane={lane} onRank={setRank} onLane={setLane} />
      </div>
      {loading && !data ? (
        <PanelSkeleton rows={3} />
      ) : (
        <div className={cn(loading && 'opacity-60')}>
          {data?.available && <UsageSummary usage={data?.usage} />}
          {heroes.length ? (
            <div className="mt-3">
              <HeroUsageList heroes={heroes} onSelect={onSelectHero} />
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-ink-3">{data?.available ? t('catalog.items.noHeroes') : ''}</p>
          )}
          <StatsSource data={data} className="mt-3" />
        </div>
      )}
    </div>
  );
}

function ItemPartners({
  gameId,
  onSelect,
}: {
  gameId: number;
  onSelect: (gameId: number) => void;
}) {
  const t = useT();
  const { data, loading } = useMeta<any>(() => api.gameCatalog.synergies({ item: gameId, limit: 6 }), [gameId]);
  const pairs: any[] = data?.pairs ?? [];
  if (loading && !data) return <PanelSkeleton rows={1} />;
  if (!pairs.length) return <p className="text-sm text-ink-3">{data?.available ? t('catalog.synergies.none') : t('catalog.stats.unavailable')}</p>;
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {pairs.map((p) => {
        const other = p.items.find((i: any) => i.gameId !== gameId) ?? p.items[1];
        return (
          <button
            key={other.gameId}
            type="button"
            onClick={() => onSelect(other.gameId)}
            className="flex items-center gap-3 rounded border border-line-subtle bg-surface-2/40 p-2 text-left transition-colors hover:border-primary/50 hover:bg-surface-2"
          >
            <CatalogIcon src={other.icon} alt={other.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-1">{other.name}</p>
              <p className="text-[11px] text-ink-3">{t('catalog.synergies.together', { n: p.builds })}</p>
            </div>
            <span className={cn('text-xs font-semibold num', (p.winRate ?? 0) >= 50 ? 'text-accent-green' : 'text-accent-red')}>
              {fmtPct(p.winRate)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Item detail: stats, passive, build path, heroes building it and partners. */
export default function ItemDetailModal({
  item,
  byGameId,
  onSelect,
  onClose,
  onSelectHero,
}: {
  item: CatalogItem | null;
  byGameId: Map<number, CatalogItem>;
  onSelect: (gameId: number) => void;
  onClose: () => void;
  onSelectHero?: (heroId: number) => void;
}) {
  const t = useT();
  const body = useRef<HTMLDivElement>(null);
  // Following a build path link opens the new item from its top.
  useEffect(() => {
    body.current?.parentElement?.scrollTo({ top: 0 });
  }, [item?.gameId]);
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      size="xl"
      closeLabel={t('common.close')}
      title={item?.name}
      subtitle={item ? [item.category, item.tier ? t('catalog.items.tier', { n: item.tier }) : null].filter(Boolean).join(' · ') : undefined}
      icon={<Package size={18} />}
    >
      {item && (
        <div ref={body} className="space-y-6">
          <div className="flex flex-col gap-5 md:flex-row">
            <div className="flex shrink-0 items-start gap-4 md:w-60 md:flex-col">
              <CatalogIcon src={item.icon} alt={item.name} size={72} />
              <div className="flex flex-wrap gap-1.5">
                {item.category && <Badge variant="blue" size="sm">{item.category}</Badge>}
                <Badge variant={item.isComponent ? 'default' : 'purple'} size="sm">
                  {item.isComponent ? t('catalog.items.component') : t('catalog.items.final')}
                </Badge>
                {item.gold != null && (
                  <Badge variant="gold" size="sm">
                    <Coins size={12} aria-hidden="true" /> {item.gold}
                  </Badge>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('catalog.items.stats')}</h4>
                {item.stats ? <RichText text={item.stats} className="text-ink-1" /> : <p className="text-sm text-ink-3">—</p>}
              </div>
              {item.passive && (
                <div>
                  <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('catalog.items.passive')}</h4>
                  <RichText text={item.passive} />
                </div>
              )}
              {!item.stats && !item.passive && item.description && <RichText text={item.description} />}
            </div>
          </div>

          <section>
            <h3 className="mb-3 font-display text-base font-bold text-ink-1">{t('catalog.items.buildPath')}</h3>
            <div className="rounded-lg border border-line-subtle bg-surface-2/30 p-4">
              <BuildTree item={item} byGameId={byGameId} onSelect={onSelect} />
            </div>
          </section>

          {item.gameId != null && (
            <>
              <section>
                <h3 className="mb-1 font-display text-base font-bold text-ink-1">{t('catalog.items.heroesTitle')}</h3>
                <p className="mb-3 text-xs text-ink-3">{t('catalog.items.heroesHint')}</p>
                <ItemHeroes key={item.gameId} gameId={item.gameId} onSelectHero={onSelectHero} />
              </section>
              <section>
                <h3 className="mb-3 font-display text-base font-bold text-ink-1">{t('catalog.items.partnersTitle')}</h3>
                <ItemPartners key={item.gameId} gameId={item.gameId} onSelect={onSelect} />
              </section>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
