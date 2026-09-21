'use client';

import { useState } from 'react';
import { api, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { Badge } from '@/components/ui';
import { FilterBar, LaneTabs, PanelSkeleton, RankTierTabs, fmtPct } from './shared';
import { useMeta } from './useMeta';

function Icon({ src, alt, size = 36, round = false }: { src?: string | null; alt: string; size?: number; round?: boolean }) {
  if (!src) return <div className={cn('shrink-0 bg-surface-3', round ? 'rounded-full' : 'rounded')} style={{ width: size, height: size }} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mlbbImg(src, size * 2)}
      alt={alt}
      title={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      className={cn('shrink-0 bg-surface-3 object-cover ring-1 ring-inset ring-line-subtle', round ? 'rounded-full' : 'rounded')}
      style={{ width: size, height: size }}
    />
  );
}

/** Academy builds (items, emblem, talents, spell) with their win and pick rates. */
export default function HeroMetaBuildsPanel({ heroId }: { heroId: number }) {
  const t = useT();
  const [rank, setRank] = useState('all');
  const [lane, setLane] = useState<string | null>(null);
  const { data, loading } = useMeta<any>(
    () => api.heroes.metaBuilds(heroId, { rank, lane: lane ?? undefined }),
    [heroId, rank, lane],
  );
  const builds: any[] = data?.builds ?? [];

  return (
    <div>
      <FilterBar>
        <RankTierTabs value={rank} onChange={setRank} />
        {data?.lanes?.length > 1 && <LaneTabs lanes={data.lanes} value={data.lane} onChange={setLane} />}
      </FilterBar>
      {loading && !data ? (
        <PanelSkeleton rows={2} />
      ) : !builds.length ? (
        <p className="py-6 text-center text-sm text-ink-3">{t('heroMeta.builds.empty')}</p>
      ) : (
        <div className={cn('space-y-3', loading && 'opacity-60')}>
          {builds.map((b, i) => (
            <div key={i} className="rounded-lg border border-line-subtle bg-surface-2/40 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-display text-sm font-bold text-ink-1">{t('heroMeta.builds.title', { n: i + 1 })}</span>
                <Badge variant="green" size="sm">
                  {t('heroes.winRate')} {fmtPct(b.winRate)}
                </Badge>
                <Badge variant="blue" size="sm">
                  {t('heroMeta.builds.usage')} {fmtPct(b.pickRate)}
                </Badge>
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                <div className="min-w-0">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('heroes.builds.items')}</p>
                  <div className="flex flex-wrap gap-2">
                    {b.items.map((it: any, j: number) => (
                      <div key={`${it.id}-${j}`} className="flex w-16 flex-col items-center gap-1 text-center">
                        <Icon src={it.icon} alt={it.name ?? `#${it.id}`} size={40} />
                        <span className="line-clamp-2 text-[10px] leading-tight text-ink-2">{it.name ?? `#${it.id}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {b.emblem && (
                  <div className="min-w-0">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('heroes.builds.emblem')}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Icon src={b.emblem.icon} alt={b.emblem.name ?? ''} size={36} round />
                      <span className="text-xs font-medium text-ink-1">{b.emblem.name}</span>
                      {b.talents.map((tal: any) => (
                        <Icon key={tal.id} src={tal.icon} alt={tal.name ?? `#${tal.id}`} size={30} round />
                      ))}
                    </div>
                    {b.talents.some((x: any) => x.name) && (
                      <p className="mt-1.5 text-[11px] text-ink-3">{b.talents.map((x: any) => x.name).filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                )}
                {b.spell && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('heroes.builds.battleSpell')}</p>
                    <div className="flex items-center gap-2" title={b.spell.description ?? undefined}>
                      <Icon src={b.spell.icon} alt={b.spell.name ?? ''} size={36} round />
                      <span className="text-xs font-medium text-ink-1">{b.spell.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <p className="text-xs text-ink-3">{t('heroMeta.builds.source')}</p>
        </div>
      )}
    </div>
  );
}
