'use client';

import Link from 'next/link';
import { cn } from '@/lib/helpers';
import { Card, StatTile } from '@/components/ui';
import { Crown, Coins, Sparkles, Swords, Shield, Sword, Star, Trophy, type LucideIcon } from 'lucide-react';
import { avatarSrc } from '@/lib/api';
import type { Season } from '@/store/useSeasonStore';
import { SeasonPodium, type TFn } from '@/components/seasons/shared';
import RoleIcon from '@/components/game/RoleIcon';

// ---------------------------------------------------------------------------
// Types (mirror the /awards API)
// ---------------------------------------------------------------------------

export type AwardCategory = 'mvp' | 'best_gold' | 'best_mid' | 'best_jungle' | 'best_roam' | 'best_exp' | 'custom';
export const FIXED_CATEGORIES: AwardCategory[] = ['mvp', 'best_gold', 'best_jungle', 'best_mid', 'best_exp', 'best_roam'];

export type UserRef = { id: string; username: string; displayName: string; avatar: string | null };
export type TeamRef = { id: string; name: string; image?: string | null };

export type AwardCriteria = {
  games?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  avgKills?: number;
  avgDeaths?: number;
  avgAssists?: number;
  kda?: number;
  mvpCount?: number;
  role?: string | null;
  topHeroes?: { key: string; count: number }[];
  basis?: 'mvp' | 'kda';
  minGames?: number;
};

export type AwardItem = {
  id: string;
  seasonId: string;
  category: AwardCategory;
  lane: string | null;
  title: string | null;
  userId: string | null;
  user: UserRef | null;
  teamId: string | null;
  team: TeamRef | null;
  description: string | null;
  imageUrl: string | null;
  criteria: AwardCriteria | null;
  sort: number;
};

export type PodiumEntry = { placement: number; teamId: string; team: TeamRef };
export type PodiumSource = {
  regular: 'manual' | 'summary' | 'standings' | 'none';
  playoffs: 'manual' | 'summary' | 'matches' | 'none';
};
export type PodiumsView = { regular: PodiumEntry[]; playoffs: PodiumEntry[]; source: PodiumSource };

export type Sponsor = { id: string; name: string | null; logo: string; url: string | null; seasonIds?: string[] };

export type SeasonAwards = {
  season: Season;
  awards: AwardItem[];
  mvp: AwardItem | null;
  podiums: PodiumsView;
  sponsors: Sponsor[];
  matches: { total: number; completed: number };
};

export type HofSeason = {
  season: Season;
  podiums: PodiumsView;
  champion: TeamRef | null;
  mvp: AwardItem | null;
  awards: AwardItem[];
  awardsCount: number;
  sponsors: Sponsor[];
};

// ---------------------------------------------------------------------------
// Category visuals
// ---------------------------------------------------------------------------

export const CATEGORY_ICON: Record<AwardCategory, LucideIcon> = {
  mvp: Crown,
  best_gold: Coins,
  best_mid: Sparkles,
  best_jungle: Swords,
  best_roam: Shield,
  best_exp: Sword,
  custom: Star,
};

/** Gradient per category (trophy visual). */
export const CATEGORY_GRADIENT: Record<AwardCategory, string> = {
  mvp: 'from-yellow-300 via-amber-400 to-orange-500',
  best_gold: 'from-amber-300 to-yellow-600',
  best_mid: 'from-fuchsia-400 to-purple-600',
  best_jungle: 'from-emerald-400 to-teal-600',
  best_roam: 'from-sky-400 to-blue-600',
  best_exp: 'from-rose-400 to-red-600',
  custom: 'from-slate-300 to-slate-500',
};

export function categoryLabel(t: TFn, a: Pick<AwardItem, 'category' | 'title'>) {
  if (a.category === 'custom') return a.title || t('awards.category.custom');
  return t('awards.category.' + a.category);
}

export function laneOf(category: AwardCategory): string | null {
  const map: Record<string, string> = { best_gold: 'gold', best_mid: 'mid', best_jungle: 'jungle', best_roam: 'roam', best_exp: 'exp' };
  return map[category] ?? null;
}

export function fmtNum(n: number | undefined | null, digits = 0) {
  if (n == null || !Number.isFinite(n)) return '–';
  return n.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

/** Trophy badge with the category icon (or the award visual when set). */
export function TrophyVisual({
  category,
  imageUrl,
  size = 'md',
  className = '',
}: {
  category: AwardCategory;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const Icon = CATEGORY_ICON[category] ?? Trophy;
  const dims: Record<string, string> = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-20 w-20',
    xl: 'h-28 w-28',
  };
  const icons: Record<string, number> = { sm: 18, md: 26, lg: 36, xl: 52 };
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-md cut-corners-sm bg-gradient-to-br text-black shadow-elev-2',
        CATEGORY_GRADIENT[category],
        dims[size],
        className
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <Icon size={icons[size]} strokeWidth={2.2} />
      )}
    </div>
  );
}

export function PlayerAvatar({ user, size = 'md', className = '' }: { user: UserRef | null; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const dims: Record<string, string> = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-20 w-20 text-xl',
    xl: 'h-32 w-32 text-3xl',
  };
  const src = avatarSrc(user?.avatar);
  const name = user?.displayName || user?.username || '?';
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent-cyan to-accent-violet font-display font-bold text-on-primary ring-2 ring-line-strong',
        dims[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        name[0]?.toUpperCase() || '?'
      )}
    </div>
  );
}

export function TeamChip({ team, t, className = '' }: { team: TeamRef | null; t: TFn; className?: string }) {
  if (!team) return <span className={cn('text-xs text-ink-3', className)}>{t('awards.noTeam')}</span>;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-ink-2', className)}>
      {team.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.image} alt="" referrerPolicy="no-referrer" className="h-5 w-5 rounded cut-corners-sm object-cover" />
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-3 text-[10px] font-bold">{team.name?.[0]}</span>
      )}
      <span className="truncate">{team.name}</span>
    </span>
  );
}

/** Numbers that justified the award (transparent criteria). */
export function CriteriaStats({ criteria, t, compact = false }: { criteria: AwardCriteria | null; t: TFn; compact?: boolean }) {
  if (!criteria) return null;
  const cells: { label: string; value: string }[] = [];
  if (criteria.games != null) cells.push({ label: t('awards.criteria.games'), value: fmtNum(criteria.games) });
  if (criteria.kda != null) cells.push({ label: t('awards.criteria.kda'), value: fmtNum(criteria.kda, 2) });
  if (criteria.mvpCount != null) cells.push({ label: t('awards.criteria.mvp'), value: fmtNum(criteria.mvpCount) });
  if (criteria.winRate != null) cells.push({ label: t('awards.criteria.winRate'), value: `${fmtNum(criteria.winRate, 1)}%` });
  if (!compact && criteria.avgKills != null) {
    cells.push({
      label: t('awards.criteria.avg'),
      value: `${fmtNum(criteria.avgKills, 1)} / ${fmtNum(criteria.avgDeaths, 1)} / ${fmtNum(criteria.avgAssists, 1)}`,
    });
  }
  if (!cells.length) return null;
  return (
    <div className="space-y-1.5">
      <div className={cn('grid gap-2', compact ? 'grid-cols-4' : cells.length > 4 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4')}>
        {cells.map((c) => (
          <div key={c.label} className="min-w-0 rounded border border-line-subtle bg-surface-2/60 px-2 py-1.5">
            <StatTile label={<span className="truncate">{c.label}</span>} value={<span className="truncate text-base">{c.value}</span>} align="center" className="min-w-0" />
          </div>
        ))}
      </div>
      {!compact && criteria.basis && (
        <p className="text-[11px] text-ink-3">
          {t('awards.criteria.basis.' + criteria.basis)}
          {criteria.minGames ? ` · ${t('awards.criteria.minGames', { n: criteria.minGames })}` : ''}
        </p>
      )}
    </div>
  );
}

/** Award card: trophy visual, player, team, criteria numbers. */
export function AwardCard({ award, t, accent }: { award: AwardItem; t: TFn; accent?: string | null }) {
  const Icon = CATEGORY_ICON[award.category] ?? Trophy;
  return (
    <Card hover className="relative flex h-full flex-col gap-4 overflow-hidden p-5">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ background: accent || 'rgb(var(--accent-gold))' }} />
      <div aria-hidden="true" className={cn('absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-20 blur-2xl', CATEGORY_GRADIENT[award.category])} />
      <header className="flex items-center gap-3">
        <TrophyVisual category={award.category} imageUrl={award.imageUrl} size="sm" />
        <div className="min-w-0">
          <p className="eyebrow inline-flex items-center gap-1 !text-ink-3">
            <Icon size={11} /> {t('awards.kicker')}
          </p>
          <h3 className="mt-1 truncate font-display font-bold leading-tight text-ink-1">{categoryLabel(t, award)}</h3>
        </div>
        {award.lane && <RoleIcon role={award.lane} size={22} className="ml-auto opacity-80" />}
      </header>
      <div className="flex items-center gap-3">
        <PlayerAvatar user={award.user} size="lg" />
        <div className="min-w-0 flex-1">
          {award.user ? (
            <Link href={`/players/${award.user.id}`} className="block truncate font-display text-lg font-bold text-ink-1 transition-colors hover:text-primary">
              {award.user.displayName || award.user.username}
            </Link>
          ) : (
            <p className="font-semibold text-ink-2">{t('awards.noPlayer')}</p>
          )}
          <TeamChip team={award.team} t={t} />
        </div>
      </div>
      {award.description && <p className="line-clamp-3 text-sm text-ink-2">{award.description}</p>}
      <div className="mt-auto">
        <CriteriaStats criteria={award.criteria} t={t} compact />
      </div>
    </Card>
  );
}

/** Large MVP hero card: the one glow element of the awards page. */
export function MvpHero({ award, t, accent }: { award: AwardItem; t: TFn; accent?: string | null }) {
  return (
    <section className="relative overflow-hidden rounded-lg cut-banner border border-accent-gold/40 bg-surface-1 shadow-glow-gold dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1">
      <div aria-hidden="true" className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-accent-gold/20 blur-3xl" />
      <div
        aria-hidden="true"
        className="absolute -right-16 top-0 h-full w-56 -skew-x-12 opacity-20"
        style={{ background: `linear-gradient(180deg, ${accent || 'rgb(var(--accent-gold))'}, transparent)` }}
      />
      <div className="relative flex flex-col items-center gap-6 p-6 sm:p-10 md:flex-row md:gap-10">
        <div className="relative">
          <PlayerAvatar user={award.user} size="xl" className="ring-4 ring-accent-gold/60" />
          <TrophyVisual category="mvp" imageUrl={award.imageUrl} size="sm" className="absolute -bottom-2 -right-2" />
        </div>
        <div className="min-w-0 flex-1 text-center md:text-left">
          <p className="eyebrow inline-flex items-center gap-2 !text-accent-gold">
            <Crown size={14} /> {t('awards.mvpKicker')}
          </p>
          <h2 className="mt-2 truncate font-display text-3xl font-bold uppercase leading-none tracking-tight2 text-ink-1 sm:text-5xl">
            {award.user ? award.user.displayName || award.user.username : t('awards.noPlayer')}
          </h2>
          <div className="mt-3 flex justify-center md:justify-start">
            <TeamChip team={award.team} t={t} className="text-sm" />
          </div>
          {award.description && <p className="mt-3 max-w-xl text-ink-2">{award.description}</p>}
          <div className="mt-5 max-w-xl">
            <CriteriaStats criteria={award.criteria} t={t} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Regular + playoffs podiums side by side. */
export function PodiumsBlock({ podiums, t, compact = false }: { podiums: PodiumsView; t: TFn; compact?: boolean }) {
  const block = (label: string, entries: PodiumEntry[], source: string) => (
    <Card className="min-w-0 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 font-display font-bold text-ink-1">
          <Trophy size={16} className="text-accent-gold" /> {label}
        </h3>
        <span className="eyebrow !text-ink-3">{t('awards.source.' + source)}</span>
      </div>
      {entries.length ? (
        <SeasonPodium podium={entries as any} t={t} compact={compact} linkTeams />
      ) : (
        <p className="py-6 text-center text-sm text-ink-3">{t('awards.podium.none')}</p>
      )}
    </Card>
  );
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {block(t('awards.podium.regular'), podiums.regular, podiums.source.regular)}
      {block(t('awards.podium.playoffs'), podiums.playoffs, podiums.source.playoffs)}
    </div>
  );
}

export function SponsorsStrip({ sponsors, t, title }: { sponsors: Sponsor[]; t: TFn; title?: string }) {
  if (!sponsors?.length) return null;
  return (
    <div>
      {title !== '' && <p className="eyebrow mb-3 !text-ink-3">{title ?? t('awards.sponsors')}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {sponsors.map((s) => {
          const img = (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logo} alt={s.name || ''} className="h-10 max-w-[8rem] object-contain" />
          );
          return (
            <div key={s.id} className="flex items-center rounded cut-corners-sm bg-white px-3 py-2" title={s.name || undefined}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer noopener">
                  {img}
                </a>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
