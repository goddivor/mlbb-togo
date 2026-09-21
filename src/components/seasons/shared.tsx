'use client';

import Link from 'next/link';
import { CalendarDays, Flag, Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/helpers';
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
  const live = status === 'active' || status === 'playoffs';
  return (
    <Badge variant={STATUS_VARIANT[status] || 'default'} size={size} className={className} pulse={live}>
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

/** Season accent with the design-system primary as fallback. */
export function seasonAccent(color?: string | null): string {
  return color || 'rgb(var(--primary))';
}

/* ------------------------------------------------------------------ */
/* SeasonHero: angled art band themed by the season colour/banner      */
/* ------------------------------------------------------------------ */

/**
 * Themed hero band shared by the league portal, the season pages and the
 * hall of fame. Always dark (public routes are forced dark and the banner art
 * needs a dark overlay), the season colour washes the right edge and the
 * bottom edge is chamfered like the design-system banners.
 */
export function SeasonHero({
  season,
  t,
  lang,
  eyebrow,
  title,
  meta,
  actions,
  aside,
  size = 'lg',
  className,
}: {
  season: Pick<Season, 'name' | 'number' | 'status' | 'theme' | 'slogan' | 'banner' | 'color' | 'startDate' | 'endDate' | 'playoffsStartDate' | 'closedAt'>;
  t: TFn;
  lang: string;
  /** Uppercase label above the title (defaults to "Season N"). */
  eyebrow?: React.ReactNode;
  /** Defaults to the season name. */
  title?: React.ReactNode;
  /** Extra meta chips after the period. */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  /** Right-hand block (champion, MVP…). */
  aside?: React.ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const accent = seasonAccent(season.color);
  const period = seasonPeriod(season, lang);
  const closedOn = fmtSeasonDate(season.closedAt, lang);
  const minH = size === 'lg' ? 'min-h-[22rem] md:min-h-[26rem]' : 'min-h-[14rem] md:min-h-[16rem]';
  return (
    <section
      className={cn('relative overflow-hidden rounded-lg cut-banner border border-line-subtle bg-[#0a0e19]', minH, className)}
      style={seasonAccentStyle(season.color)}
    >
      {season.banner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={season.banner} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: `radial-gradient(900px 420px at 85% 15%, ${accent}, transparent 62%)`, opacity: 0.55 }}
        />
      )}
      {/* Angled colour wash + dark overlay so the white copy reads on any art. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(90deg, rgb(10 14 25 / 0.94) 0%, rgb(10 14 25 / 0.72) 55%, ${accent} 140%)` }}
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0e19]/90 to-transparent" />
      <div
        aria-hidden="true"
        className="absolute -right-24 top-0 h-full w-72 -skew-x-12 opacity-25"
        style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }}
      />

      <div className={cn('relative flex h-full flex-col justify-end gap-5 p-6 md:flex-row md:items-end md:justify-between md:p-10', minH)}>
        <div className="min-w-0 max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SeasonStatusBadge status={season.status} t={t} size="md" className="bg-black/40 backdrop-blur" />
            <span className="eyebrow !text-white/80">
              {eyebrow ?? (season.number != null ? t('seasons.numberLabel', { n: season.number }) : t('league.kicker'))}
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-2 h-10 w-1.5 shrink-0 -skew-x-12 rounded-sm md:h-14" style={{ background: accent }} />
            <h1
              className={cn(
                'font-display font-bold uppercase leading-[0.95] tracking-tight2 text-white',
                size === 'lg' ? 'text-4xl sm:text-6xl md:text-7xl' : 'text-3xl sm:text-4xl md:text-5xl'
              )}
            >
              {title ?? season.name}
            </h1>
          </div>
          {season.theme && (
            <p className="mt-3 inline-flex items-center gap-2 pl-4 font-display text-lg font-semibold sm:text-2xl" style={{ color: accent }}>
              <Sparkles size={18} /> {season.theme}
            </p>
          )}
          {season.slogan && <p className="mt-1.5 max-w-2xl pl-4 text-base italic text-white/75 sm:text-lg">« {season.slogan} »</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-4 text-sm text-white/70">
            {period && (
              <span className="inline-flex items-center gap-1.5 num">
                <CalendarDays size={14} /> {period}
              </span>
            )}
            {season.playoffsStartDate && (
              <span className="inline-flex items-center gap-1.5 num">
                <Flag size={14} /> {t('seasons.playoffsFrom', { date: fmtSeasonDate(season.playoffsStartDate, lang) || '' })}
              </span>
            )}
            {closedOn && (
              <span className="inline-flex items-center gap-1.5 num">
                <Lock size={14} /> {t('seasons.closedOn', { date: closedOn })}
              </span>
            )}
            {meta}
          </div>
          {actions && <div className="mt-6 flex flex-wrap gap-3 pl-4">{actions}</div>}
        </div>
        {aside && <div className="shrink-0 md:pb-1">{aside}</div>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Podium                                                              */
/* ------------------------------------------------------------------ */

export const PLACE_TIER: Record<number, 'tier-gold' | 'tier-silver' | 'tier-bronze'> = {
  1: 'tier-gold',
  2: 'tier-silver',
  3: 'tier-bronze',
};

/** Team logo square used by the podiums (chamfered, tier ring). */
export function PodiumTeamLogo({
  team,
  placement,
  className,
}: {
  team: { name: string; image?: string | null };
  placement: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center overflow-hidden rounded-md cut-corners-sm', PLACE_TIER[placement] ?? 'bg-surface-2', className)}>
      {team.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.image} alt={team.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        <span className="font-display font-bold">{team.name?.[0]?.toUpperCase() || '?'}</span>
      )}
    </div>
  );
}

/** Frozen podium (top 3 of the summary). Used by the admin preview and the public pages. */
export function SeasonPodium({
  podium,
  t,
  compact = false,
  linkTeams = false,
}: {
  podium: { placement: number; team: { id: string; name: string; image?: string | null } }[];
  t: TFn;
  compact?: boolean;
  /** Wrap each column in a link to the team page. */
  linkTeams?: boolean;
}) {
  if (!podium?.length) {
    return <p className="text-sm text-ink-2">{t('seasons.podium.empty')}</p>;
  }
  // Display order 2 - 1 - 3 like a real podium on wide screens.
  const order = [2, 1, 3].map((p) => podium.find((x) => x.placement === p)).filter(Boolean) as typeof podium;
  const height: Record<number, string> = compact
    ? { 1: 'h-20', 2: 'h-14', 3: 'h-10' }
    : { 1: 'h-28 sm:h-36', 2: 'h-20 sm:h-24', 3: 'h-14 sm:h-16' };
  return (
    <div className={cn('mx-auto grid grid-cols-3 items-end gap-2 sm:gap-4', compact ? 'max-w-md' : 'max-w-2xl')}>
      {order.map((p) => {
        const col = (
          <div className="group flex min-w-0 flex-col items-center gap-2">
            <PodiumTeamLogo
              team={p.team}
              placement={p.placement}
              className={cn(
                'transition-transform duration-base ease-out group-hover:-translate-y-0.5',
                compact ? 'h-10 w-10 text-sm' : p.placement === 1 ? 'h-20 w-20 text-2xl sm:h-24 sm:w-24' : 'h-14 w-14 text-lg sm:h-16 sm:w-16'
              )}
            />
            <p className={cn('w-full truncate text-center font-display font-bold text-ink-1', compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base')}>
              {p.team.name}
            </p>
            <div
              className={cn(
                'flex w-full items-start justify-center rounded-t-md pt-2 font-display font-bold num',
                height[p.placement] || 'h-12',
                PLACE_TIER[p.placement] ?? 'bg-surface-3 text-ink-2',
                compact ? 'text-lg' : 'text-2xl sm:text-3xl'
              )}
            >
              {p.placement}
            </div>
          </div>
        );
        return linkTeams && p.team.id ? (
          <Link key={p.placement} href={`/teams/${p.team.id}`} className="block min-w-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
            {col}
          </Link>
        ) : (
          <div key={p.placement} className="min-w-0">
            {col}
          </div>
        );
      })}
    </div>
  );
}
