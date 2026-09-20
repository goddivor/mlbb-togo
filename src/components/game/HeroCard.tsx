'use client';

import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { mlbbImg } from '@/lib/api';
import RoleIcon, { roleLabel } from './RoleIcon';

/** Subset of the `/mlbb/heroes` items (+ `/mlbb/heroes/:id` for the painting). */
export type HeroCardHero = {
  heroId?: number | string;
  name: string;
  image?: string | null;
  painting?: string | null;
  imageBig?: string | null;
  roles?: string[] | null;
  lanes?: string[] | null;
};

/** Subset of `/mlbb/heroes/:id/meta`. */
export type HeroCardMeta = {
  winRate?: number | null;
  pickRate?: number | null;
  banRate?: number | null;
  available?: boolean;
};

function MiniBar({ label, short, value, accent, max = 100 }: { label: string; short: string; value?: number | null; accent: string; max?: number }) {
  const v = Number(value ?? 0);
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3" title={label} aria-label={label}>{short}</span>
        <span className="font-display text-xs font-bold num text-ink-1">{value == null ? '—' : `${v}%`}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3">
        <div className={cn('h-full rounded-full', accent)} style={{ width: `${Math.min(100, (v / max) * 100)}%` }} />
      </div>
    </div>
  );
}

export default function HeroCard({
  hero,
  meta,
  onClick,
  size = 'md',
  className,
}: {
  hero: HeroCardHero;
  meta?: HeroCardMeta | null;
  onClick?: (hero: HeroCardHero) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const t = useT();
  const art = hero.painting || hero.imageBig || hero.image;
  // Remote (Moonton CDN) art goes through the image proxy; local assets are used as-is.
  const artSrc = art ? (/^https?:/i.test(art) ? mlbbImg(art, 480) : art) : null;
  const roles = (hero.roles || []).slice(0, 2);
  const lanes = (hero.lanes || []).slice(0, 2);
  const Comp: any = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick ? () => onClick(hero) : undefined}
      className={cn(
        'group relative block w-full self-start overflow-hidden rounded-lg border border-line-subtle bg-surface-1 text-left shadow-elev-1 transition-[transform,box-shadow,border-color] duration-base ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elev-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        className
      )}
    >
      <div className={cn('relative overflow-hidden bg-surface-2', size === 'sm' ? 'aspect-square' : 'aspect-[4/5]')}>
        {artSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artSrc}
            alt={hero.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-top transition-transform duration-slow ease-out group-hover:scale-105"
          />
        )}
        {/* Gradient mask so the name sits on the art. */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="mb-1.5 flex items-center gap-1">
            {roles.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 rounded bg-surface-0/70 px-1.5 py-0.5 text-[10px] font-semibold text-ink-1 backdrop-blur-sm">
                <RoleIcon role={r} size={11} />
                {roleLabel(t, r)}
              </span>
            ))}
            {lanes.map((l) => (
              <span key={l} className="rounded bg-accent-violet/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-violet backdrop-blur-sm">
                {l}
              </span>
            ))}
          </div>
          <h3 className="font-display text-base font-bold leading-tight tracking-tight2 text-ink-1">{hero.name}</h3>
        </div>
      </div>
      {size === 'md' && (
        <div className="grid grid-cols-3 gap-3 px-3 py-2.5">
          <MiniBar label={t('heroes.winRate')} short="WR" value={meta?.winRate} accent="bg-accent-green" />
          <MiniBar label={t('heroes.pickRate')} short="Pick" value={meta?.pickRate} accent="bg-accent-cyan" max={40} />
          <MiniBar label={t('heroes.banRate')} short="Ban" value={meta?.banRate} accent="bg-accent-red" max={60} />
        </div>
      )}
    </Comp>
  );
}
