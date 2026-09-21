'use client';

import { useMemo, useState } from 'react';
import { Gem } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { Badge, EmptyState, PageHeader, SectionCard, Skeleton } from '@/components/ui';
import HeroDetailModal from '@/components/game/HeroDetailModal';
import { useMeta } from '@/components/game/hero-meta/useMeta';
import { CatalogIcon, HeroUsageList, StatsFilters, StatsSource, UsageSummary } from '@/components/catalog/shared';

export default function EmblemsPage() {
  const t = useT();
  const [rank, setRank] = useState('all');
  const [lane, setLane] = useState<string | null>(null);
  const [hero, setHero] = useState<number | null>(null);
  const { data, loading } = useMeta<any>(
    () => api.gameCatalog.emblems({ rank, lane: lane ?? undefined, limit: 5 }),
    [rank, lane],
  );

  const emblems: any[] = useMemo(
    () =>
      [...(data?.emblems ?? [])]
        .map((e, i) => ({ ...e, order: i }))
        .sort((a, b) => (b.usage?.builds ?? -1) - (a.usage?.builds ?? -1) || a.order - b.order),
    [data],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.section.catalog')}
        icon={<Gem size={20} />}
        title={t('catalog.emblems.title')}
        subtitle={t('catalog.emblems.subtitle')}
      />

      <SectionCard className="!p-4">
        <StatsFilters rank={rank} lane={lane} onRank={setRank} onLane={setLane} />
      </SectionCard>

      {loading && !data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : !emblems.length ? (
        <EmptyState icon={<Gem size={26} />} title={t('catalog.emblems.empty')} />
      ) : (
        <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3', loading && 'opacity-60')}>
          {emblems.map((e) => (
            <SectionCard key={e.id} className="flex flex-col !p-5">
              <div className="flex items-start gap-3">
                <CatalogIcon src={e.icon} alt={e.name} size={52} round />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-bold text-ink-1">{e.name}</h3>
                  {e.usage && (
                    <Badge variant="purple" size="sm" className="mt-1">
                      {t('catalog.spells.share', { n: e.usage.share.toFixed(1) })}
                    </Badge>
                  )}
                </div>
              </div>

              {e.attributes?.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {e.attributes.map((a: string) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-ink-1">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan" aria-hidden="true" />
                      {a}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto pt-4">
                <div className="border-t border-line-subtle pt-3">
                  {data?.available && <UsageSummary usage={e.usage} />}
                  {e.talents?.some((tal: any) => tal.name) && (
                    <>
                      <p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
                        {t('catalog.emblems.talents')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {e.talents.filter((tal: any) => tal.name).map((tal: any) => (
                          <div
                            key={tal.id}
                            title={tal.description ?? undefined}
                            className="flex items-center gap-1.5 rounded bg-surface-2/60 py-1 pl-1 pr-2 ring-1 ring-inset ring-line-subtle"
                          >
                            <CatalogIcon src={tal.icon} alt={tal.name} size={24} round />
                            <span className="text-xs font-medium text-ink-1">{tal.name}</span>
                            <span className="text-[10px] text-ink-3 num">{tal.builds}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {e.heroes?.length > 0 && (
                    <>
                      <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
                        {t('catalog.emblems.heroes')}
                      </p>
                      <HeroUsageList heroes={e.heroes} onSelect={setHero} compact />
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
