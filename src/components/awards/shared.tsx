'use client';

import Link from 'next/link';
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

/** Round trophy badge with the category icon (or the award visual when set). */
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
      className={`relative shrink-0 rounded-full bg-gradient-to-br ${CATEGORY_GRADIENT[category]} ${dims[size]} flex items-center justify-center text-black shadow-lg ring-2 ring-white/40 ${className}`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
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
      className={`shrink-0 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center overflow-hidden ring-2 ring-white/30 ${dims[size]} ${className}`}
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
  if (!team) return <span className={`text-xs text-gray-500 ${className}`}>{t('awards.noTeam')}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-gray-300 ${className}`}>
      {team.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.image} alt="" className="h-5 w-5 rounded-full object-cover" />
      ) : (
        <span className="h-5 w-5 rounded-full bg-white/10 text-[10px] flex items-center justify-center">{team.name?.[0]}</span>
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
      <div className={`grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {cells.map((c) => (
          <div key={c.label} className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-center min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 truncate">{c.label}</p>
            <p className="text-sm font-bold text-white tabular-nums truncate">{c.value}</p>
          </div>
        ))}
      </div>
      {!compact && criteria.basis && (
        <p className="text-[11px] text-gray-500">
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
    <article
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-4 transition-colors hover:border-white/20"
      style={accent ? { boxShadow: `0 0 40px -24px ${accent}` } : undefined}
    >
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${CATEGORY_GRADIENT[award.category]} opacity-20 blur-2xl`} />
      <header className="flex items-center gap-3">
        <TrophyVisual category={award.category} imageUrl={award.imageUrl} size="sm" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 inline-flex items-center gap-1">
            <Icon size={12} /> {t('awards.kicker')}
          </p>
          <h3 className="font-bold text-white leading-tight truncate">{categoryLabel(t, award)}</h3>
        </div>
        {award.lane && <RoleIcon role={award.lane} size={22} className="ml-auto opacity-80" />}
      </header>
      <div className="flex items-center gap-3">
        <PlayerAvatar user={award.user} size="lg" />
        <div className="min-w-0 flex-1">
          {award.user ? (
            <Link href={`/players/${award.user.id}`} className="block font-black text-lg text-white truncate hover:text-primary transition-colors">
              {award.user.displayName || award.user.username}
            </Link>
          ) : (
            <p className="font-semibold text-gray-400">{t('awards.noPlayer')}</p>
          )}
          <TeamChip team={award.team} t={t} />
        </div>
      </div>
      {award.description && <p className="text-sm text-gray-400 line-clamp-3">{award.description}</p>}
      <CriteriaStats criteria={award.criteria} t={t} compact />
    </article>
  );
}

/** Large MVP hero card. */
export function MvpHero({ award, t, accent }: { award: AwardItem; t: TFn; accent?: string | null }) {
  const color = accent || '#f59e0b';
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-yellow-400/30 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent p-6 sm:p-10"
      style={{ boxShadow: `0 0 100px -30px ${color}` }}
    >
      <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-yellow-400/20 blur-3xl" />
      <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="relative">
          <PlayerAvatar user={award.user} size="xl" className="ring-4 ring-yellow-400/60" />
          <TrophyVisual category="mvp" imageUrl={award.imageUrl} size="sm" className="absolute -bottom-2 -right-2" />
        </div>
        <div className="flex-1 min-w-0 text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-400 inline-flex items-center gap-2">
            <Crown size={14} /> {t('awards.mvpKicker')}
          </p>
          <h2 className="mt-1 text-3xl sm:text-5xl font-black text-white truncate">
            {award.user ? award.user.displayName || award.user.username : t('awards.noPlayer')}
          </h2>
          <div className="mt-2 flex justify-center md:justify-start">
            <TeamChip team={award.team} t={t} className="text-sm" />
          </div>
          {award.description && <p className="mt-3 text-gray-300 max-w-xl">{award.description}</p>}
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="font-semibold text-white inline-flex items-center gap-2">
          <Trophy size={16} className="text-yellow-400" /> {label}
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-gray-500">{t('awards.source.' + source)}</span>
      </div>
      {entries.length ? (
        <SeasonPodium podium={entries as any} t={t} compact={compact} />
      ) : (
        <p className="text-sm text-gray-500 text-center py-6">{t('awards.podium.none')}</p>
      )}
    </div>
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {block(t('awards.podium.regular'), podiums.regular, podiums.source.regular)}
      {block(t('awards.podium.playoffs'), podiums.playoffs, podiums.source.playoffs)}
    </div>
  );
}

export function SponsorsStrip({ sponsors, t, title }: { sponsors: Sponsor[]; t: TFn; title?: string }) {
  if (!sponsors?.length) return null;
  return (
    <div>
      {title !== '' && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 mb-3">{title ?? t('awards.sponsors')}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {sponsors.map((s) => {
          const img = (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logo} alt={s.name || ''} className="h-10 max-w-[8rem] object-contain" />
          );
          return (
            <div key={s.id} className="rounded-xl bg-white/90 px-3 py-2 flex items-center" title={s.name || undefined}>
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
