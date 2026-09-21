'use client';

import { useMemo, useState } from 'react';
import { Timer, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { Badge, EmptyState, PageHeader, SectionCard, Skeleton } from '@/components/ui';
import HeroDetailModal from '@/components/game/HeroDetailModal';
import { useMeta } from '@/components/game/hero-meta/useMeta';
import { CatalogIcon, HeroUsageList, RichText, StatsFilters, StatsSource, UsageSummary } from '@/components/catalog/shared';

export default function SpellsPage() {
  const t = useT();
  const [rank, setRank] = useState('all');
  const [lane, setLane] = useState<string | null>(null);
  const [hero, setHero] = useState<number | null>(null);
  const { data, loading } = useMeta<any>(
    () => api.gameCatalog.spells({ rank, lane: lane ?? undefined, limit: 5 }),
    [rank, lane],
  );

  // Most used first; spells without statistics keep the catalog order.
  const spells: any[] = useMemo(
    () =>
      [...(data?.spells ?? [])]
        .map((s, i) => ({ ...s, order: i }))
        .sort((a, b) => (b.usage?.builds ?? -1) - (a.usage?.builds ?? -1) || a.order - b.order),
    [data],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.section.catalog')}
        icon={<Zap size={20} />}
        title={t('catalog.spells.title')}
        subtitle={t('catalog.spells.subtitle')}
      />

      <SectionCard className="!p-4">
        <StatsFilters rank={rank} lane={lane} onRank={setRank} onLane={setLane} />
      </SectionCard>

      {loading && !data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : !spells.length ? (
        <EmptyState icon={<Zap size={26} />} title={t('catalog.spells.empty')} />
      ) : (
        <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3', loading && 'opacity-60')}>
          {spells.map((s) => (
            <SectionCard key={s.id} className="flex flex-col !p-5">
              <div className="flex items-start gap-3">
                <CatalogIcon src={s.icon} alt={s.name} size={52} round />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-bold text-ink-1">{s.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {s.cooldown && (
                      <Badge variant="blue" size="sm">
                        <Timer size={12} aria-hidden="true" /> {s.cooldown}
                      </Badge>
                    )}
                    {s.usage && (
                      <Badge variant="purple" size="sm">
                        {t('catalog.spells.share', { n: s.usage.share.toFixed(1) })}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <RichText text={s.description} className="mt-3" />
              <div className="mt-auto pt-4">
                <div className="border-t border-line-subtle pt-3">
                  {data?.available && <UsageSummary usage={s.usage} />}
                  {s.heroes?.length > 0 && (
                    <>
                      <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
                        {t('catalog.spells.heroes')}
                      </p>
                      <HeroUsageList heroes={s.heroes} onSelect={setHero} compact />
                    </>
                  )}
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
      <StatsSource data={data} />

      <HeroDetailModal heroId={hero} onClose={() => setHero(null)} onSelectHero={setHero} />
    </div>
  );
}
