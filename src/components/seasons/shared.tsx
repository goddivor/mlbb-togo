'use client';

import { Badge } from '@/components/ui';
import type { Season, SeasonStatus } from '@/store/useSeasonStore';

export type TFn = (key: string, params?: Record<string, string | number>) => string;

/** Badge colour per lifecycle status. */
export const STATUS_VARIANT: Record<SeasonStatus, string> = {
  upcoming: 'blue',
  active: 'green',
  playoffs: 'gold',
  closed: 'default',
};

export function SeasonStatusBadge({
  status,
  t,
  size = 'sm',
  className,
}: {
  status: SeasonStatus;
  t: TFn;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANT[status] || 'default'} size={size} className={className}>
      {(status === 'active' || status === 'playoffs') && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {t('seasons.status.' + status)}
    </Badge>
  );
}

export function fmtSeasonDate(v: string | null | undefined, lang: string) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function seasonPeriod(s: Pick<Season, 'startDate' | 'endDate'>, lang: string) {
  const start = fmtSeasonDate(s.startDate, lang);
  const end = fmtSeasonDate(s.endDate, lang);
  if (!start && !end) return null;
  return `${start || '…'} → ${end || '…'}`;
}

/** Short label: "S3" when a number exists, else the name. */
export function seasonShortLabel(s: Pick<Season, 'number' | 'name'>) {
  return s.number ? `S${s.number}` : s.name;
}

/** Inline CSS variables for a season accent colour (falls back to the theme primary). */
export function seasonAccentStyle(color?: string | null): React.CSSProperties | undefined {
  if (!color) return undefined;
  return { ['--season-accent' as any]: color };
}

const MEDAL: Record<number, string> = {
  1: 'from-yellow-400 to-amber-600 text-black',
  2: 'from-slate-200 to-slate-400 text-black',
  3: 'from-orange-300 to-amber-800 text-black',
};

/** Frozen podium (top 3 of the summary). Used by the admin preview and the public page. */
export function SeasonPodium({
  podium,
  t,
  compact = false,
}: {
  podium: { placement: number; team: { id: string; name: string; image?: string | null } }[];
  t: TFn;
  compact?: boolean;
}) {
  if (!podium?.length) {
    return <p className="text-sm text-body dark:text-bodydark">{t('seasons.podium.empty')}</p>;
  }
  // Display order 2 - 1 - 3 like a real podium on wide screens.
  const order = [2, 1, 3].map((p) => podium.find((x) => x.placement === p)).filter(Boolean) as typeof podium;
  const height: Record<number, string> = { 1: 'h-24 sm:h-28', 2: 'h-16 sm:h-20', 3: 'h-12 sm:h-14' };
  return (
    <div className={`grid grid-cols-3 items-end gap-2 sm:gap-4 ${compact ? 'max-w-md' : 'max-w-2xl'} mx-auto`}>
      {order.map((p) => (
        <div key={p.placement} className="flex flex-col items-center gap-2 min-w-0">
          {p.team.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.team.image}
              alt={p.team.name}
              className={`${compact ? 'h-10 w-10' : 'h-14 w-14 sm:h-16 sm:w-16'} rounded-full object-cover ring-2 ring-white/60 dark:ring-strokedark`}
            />
          ) : (
            <div
              className={`${compact ? 'h-10 w-10 text-sm' : 'h-14 w-14 sm:h-16 sm:w-16 text-lg'} rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold`}
            >
              {p.team.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <p className="text-xs sm:text-sm font-semibold text-black dark:text-white text-center truncate w-full">
            {p.team.name}
          </p>
          <div
            className={`w-full ${height[p.placement] || 'h-12'} rounded-t-lg bg-gradient-to-t ${MEDAL[p.placement] || 'from-gray-300 to-gray-400'} flex items-start justify-center pt-2 font-black text-lg sm:text-xl shadow-default`}
          >
            {p.placement}
          </div>
        </div>
      ))}
    </div>
  );
}
