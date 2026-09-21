'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { cn } from '@/lib/helpers';
import { mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useThemeStore } from '@/store/useStore';
import { Skeleton, Tabs } from '@/components/ui';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler);

export const RANK_TIERS = ['all', 'epic', 'legend', 'mythic', 'honor', 'glory'] as const;
export const WINDOWS = [1, 3, 7, 15, 30] as const;
export const TREND_WINDOWS = [7, 15, 30] as const;
export const LANE_KEYS = ['exp', 'mid', 'roam', 'jungle', 'gold'] as const;

/** Chart colors that follow the light/dark theme. */
export function useChartTheme() {
  const theme = useThemeStore((s: any) => s.theme);
  const dark = theme === 'dark';
  return {
    dark,
    green: dark ? '#4ade80' : '#16a34a',
    red: dark ? '#f87171' : '#dc2626',
    cyan: dark ? '#22d3ee' : '#0891b2',
    violet: dark ? '#a78bfa' : '#7c3aed',
    grid: dark ? 'rgba(174,183,192,0.12)' : 'rgba(100,116,139,0.15)',
    tick: dark ? '#AEB7C0' : '#64748B',
  };
}

export const fmtPct = (v?: number | null, digits = 1) => (v == null ? '—' : `${v.toFixed(digits)}%`);

/** Signed change in points, colored (positive = green unless `invert`). */
export function Delta({ value, invert = false, className }: { value?: number | null; invert?: boolean; className?: string }) {
  const t = useT();
  if (value == null) return null;
  const good = invert ? value < 0 : value > 0;
  const flat = Math.abs(value) < 0.005;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold num',
        flat ? 'text-ink-3' : good ? 'text-accent-green' : 'text-accent-red',
        className,
      )}
    >
      <Icon size={13} aria-hidden="true" />
      {value > 0 ? '+' : ''}
      {value.toFixed(2)} {t('heroMeta.points')}
    </span>
  );
}

/** Rank tier selector (compact segmented tabs, scrollable on mobile). */
export function RankTierTabs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT();
  return (
    <Tabs
      size="sm"
      tabs={RANK_TIERS.map((r) => ({ id: r, label: t(`heroMeta.rank.${r}`) }))}
      active={value}
      onChange={onChange}
    />
  );
}

/** Window selector in days. */
export function WindowTabs({
  value,
  onChange,
  options = WINDOWS as readonly number[],
}: {
  value: number;
  onChange: (v: number) => void;
  options?: readonly number[];
}) {
  const t = useT();
  return (
    <Tabs
      size="sm"
      tabs={options.map((d) => ({ id: String(d), label: t('heroMeta.days', { n: d }) }))}
      active={String(value)}
      onChange={(id: string) => onChange(Number(id))}
    />
  );
}

export function LaneTabs({ lanes, value, onChange }: { lanes: string[]; value: string | null; onChange: (v: string) => void }) {
  const t = useT();
  const list = lanes.length ? lanes : [...LANE_KEYS];
  return (
    <Tabs
      size="sm"
      tabs={list.map((l) => ({ id: l, label: t(`heroMeta.lane.${l}`) }))}
      active={value ?? list[0]}
      onChange={onChange}
    />
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-center gap-2">{children}</div>;
}

export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function Unavailable() {
  const t = useT();
  return <p className="py-10 text-center text-sm text-ink-3">{t('heroes.metaUnavailable')}</p>;
}

/** Small square hero portrait through the image proxy. */
export function HeroPortrait({ src, name, size = 40 }: { src?: string | null; name?: string | null; size?: number }) {
  if (!src) return <div className="shrink-0 rounded bg-surface-3" style={{ width: size, height: size }} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mlbbImg(src, size * 2)}
      alt={name || ''}
      referrerPolicy="no-referrer"
      loading="lazy"
      className="shrink-0 rounded cut-corners-sm bg-surface-3 object-cover"
      style={{ width: size, height: size }}
    />
  );
}
