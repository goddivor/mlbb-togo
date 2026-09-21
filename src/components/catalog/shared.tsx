'use client';

import { catalogIconSrc } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { Tabs } from '@/components/ui';
import { HeroPortrait, LANE_KEYS, RankTierTabs, fmtPct } from '@/components/game/hero-meta/shared';

export type HeroUsage = {
  heroId: number;
  name: string | null;
  image: string | null;
  lane: string;
  usage: number;
  builds: number;
  winRate: number | null;
};

export type UsageStat = { builds: number; heroes: number; share: number; weight: number; winRate: number | null };

/** Catalog icon (item, spell, emblem, talent) through the image proxy. */
export function CatalogIcon({
  src,
  alt,
  size = 40,
  round = false,
  className,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  round?: boolean;
  className?: string;
}) {
  const shape = round ? 'rounded-full' : 'rounded';
  if (!src) return <div className={cn('shrink-0 bg-surface-3', shape, className)} style={{ width: size, height: size }} aria-hidden="true" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={catalogIconSrc(src, size * 2)}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      className={cn('shrink-0 bg-surface-3 object-cover ring-1 ring-inset ring-line-subtle', shape, className)}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Game text: keeps line breaks and turns Moonton `<font color>` markup into
 * colored spans (other tags are stripped, nothing is injected as HTML).
 */
export function RichText({ text, className }: { text?: string | null; className?: string }) {
  if (!text) return null;
  const normalized = text.replace(/<br\s*\/?>/gi, '\n');
  const re = /<font\s+color="?#?([0-9a-fA-F]{3,8})"?>([\s\S]*?)<\/font>/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized)) !== null) {
    if (m.index > last) nodes.push(normalized.slice(last, m.index).replace(/<[^>]+>/g, ''));
    nodes.push(
      <span key={key++} style={{ color: `#${m[1]}` }}>
        {m[2].replace(/<[^>]+>/g, '')}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < normalized.length) nodes.push(normalized.slice(last).replace(/<[^>]+>/g, ''));
  return <p className={cn('whitespace-pre-line text-sm leading-relaxed text-ink-2', className)}>{nodes}</p>;
}

/** Rank tier + lane filters of the catalog statistics (`lane` null = every lane). */
export function StatsFilters({
  rank,
  lane,
  onRank,
  onLane,
}: {
  rank: string;
  lane: string | null;
  onRank: (v: string) => void;
  onLane: (v: string | null) => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('catalog.filters.meta')}</span>
      <RankTierTabs value={rank} onChange={onRank} />
      <Tabs
        size="sm"
        tabs={[{ id: 'all', label: t('catalog.lane.all') }, ...LANE_KEYS.map((l) => ({ id: l, label: t(`heroMeta.lane.${l}`) }))]}
        active={lane ?? 'all'}
        onChange={(id: string) => onLane(id === 'all' ? null : id)}
      />
    </div>
  );
}

/** Source line, or the unavailable notice when Moonton could not be reached. */
export function StatsSource({ data, className }: { data: { available?: boolean; buildsAnalysed?: number; heroesCovered?: number } | null; className?: string }) {
  const t = useT();
  if (!data?.available) return <p className={cn('text-xs text-ink-3', className)}>{t('catalog.stats.unavailable')}</p>;
  return (
    <p className={cn('text-xs text-ink-3', className)}>
      {t('catalog.stats.source', { builds: data.buildsAnalysed ?? 0, heroes: data.heroesCovered ?? 0 })}
    </p>
  );
}

/** Heroes using an entry the most (clickable rows). */
export function HeroUsageList({
  heroes,
  onSelect,
  compact = false,
}: {
  heroes: HeroUsage[];
  onSelect?: (heroId: number) => void;
  compact?: boolean;
}) {
  const t = useT();
  const max = Math.max(...heroes.map((h) => h.usage), 1);
  return (
    <ul className="space-y-1.5">
      {heroes.map((h, i) => (
        <li key={h.heroId}>
          <button
            type="button"
            onClick={() => onSelect?.(h.heroId)}
            className="group flex w-full items-center gap-3 rounded px-2 py-1.5 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="w-4 shrink-0 text-right text-[11px] font-semibold text-ink-3 num">{i + 1}</span>
            <HeroPortrait src={h.image} name={h.name} size={compact ? 28 : 34} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-ink-1 group-hover:text-primary">{h.name ?? `#${h.heroId}`}</span>
                <span className="shrink-0 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-ink-2">
                  {t(`heroMeta.lane.${h.lane}`)}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full bg-accent-cyan" style={{ width: `${Math.max((h.usage / max) * 100, 4)}%` }} />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-semibold text-accent-cyan num" title={t('catalog.usage.hint')}>
                {fmtPct(h.usage)}
              </p>
              <p className={cn('text-[11px] num', (h.winRate ?? 0) >= 50 ? 'text-accent-green' : 'text-accent-red')}>
                {t('catalog.win')} {fmtPct(h.winRate)}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Compact usage summary (builds, heroes, weighted win rate). */
export function UsageSummary({ usage }: { usage: UsageStat | null | undefined }) {
  const t = useT();
  if (!usage) return <p className="text-xs text-ink-3">{t('catalog.usage.none')}</p>;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      <span>
        <b className="font-semibold text-ink-1 num">{usage.builds}</b> {t('catalog.usage.builds')}
      </span>
      <span>
        <b className="font-semibold text-ink-1 num">{usage.heroes}</b> {t('catalog.usage.heroes')}
      </span>
      <span>
        {t('catalog.win')}{' '}
        <b className={cn('font-semibold num', (usage.winRate ?? 0) >= 50 ? 'text-accent-green' : 'text-accent-red')}>
          {fmtPct(usage.winRate)}
        </b>
      </span>
    </div>
  );
}
