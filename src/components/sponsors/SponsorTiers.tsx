'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge } from '@/components/ui';

export type SponsorTier = 'title' | 'gold' | 'silver' | 'partner';

export interface PublicSponsor {
  id: string;
  name: string | null;
  logo: string;
  url: string | null;
  tier: SponsorTier;
  description: string | null;
}

export interface SponsorsPayload {
  season: { id: string; name: string; slug: string | null; status: string } | null;
  items: PublicSponsor[];
  byTier: Partial<Record<SponsorTier, PublicSponsor[]>>;
}

export const TIER_ORDER: SponsorTier[] = ['title', 'gold', 'silver', 'partner'];

/** Logo size and accent per tier (title sponsors are the most prominent). */
const TIER_STYLE: Record<SponsorTier, { logo: string; ring: string; badge: string }> = {
  title: { logo: 'h-24 sm:h-32', ring: 'border-accent-gold/40 bg-accent-gold/5', badge: 'tier-gold' },
  gold: { logo: 'h-20 sm:h-24', ring: 'border-accent-gold/25 bg-surface-1', badge: 'tier-gold' },
  silver: { logo: 'h-16 sm:h-20', ring: 'border-line-strong bg-surface-1', badge: 'tier-silver' },
  partner: { logo: 'h-12 sm:h-16', ring: 'border-line-subtle bg-surface-1', badge: 'tier-bronze' },
};

/** Fetches the sponsors of a season (or every active one) and caches them per key. */
export function useSponsors(seasonKey?: string) {
  const [data, setData] = useState<SponsorsPayload | null>(null);
  useEffect(() => {
    let cancelled = false;
    api.sponsors
      .list(seasonKey)
      .then((d: any) => {
        if (!cancelled && d && Array.isArray(d.items)) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [seasonKey]);
  return data;
}

function SponsorLogo({ sponsor, cls }: { sponsor: PublicSponsor; cls: string }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sponsor.logo}
      alt={sponsor.name || 'Sponsor'}
      referrerPolicy="no-referrer"
      className={`${cls} w-auto max-w-[14rem] object-contain opacity-90 transition-opacity hover:opacity-100`}
    />
  );
  return sponsor.url ? (
    <a href={sponsor.url} target="_blank" rel="noreferrer sponsored" title={sponsor.name || undefined}>
      {img}
    </a>
  ) : (
    <span title={sponsor.name || undefined}>{img}</span>
  );
}

/**
 * Sponsors grouped by tier. `compact` renders a single strip (league banner);
 * otherwise each tier gets its own labelled row.
 */
export default function SponsorTiers({
  data,
  compact = false,
  showCta = true,
  className = '',
}: {
  data: SponsorsPayload | null;
  compact?: boolean;
  showCta?: boolean;
  className?: string;
}) {
  const t = useT();
  if (!data || data.items.length === 0) return null;
  const tiers = TIER_ORDER.filter((k) => (data.byTier[k] ?? []).length > 0);

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-8 sm:gap-12 ${className}`}>
        {data.items.map((s) => (
          <SponsorLogo key={s.id} sponsor={s} cls={TIER_STYLE[s.tier].logo} />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {tiers.map((tier) => {
        const style = TIER_STYLE[tier];
        return (
          <div key={tier} className={`cut-corners border p-5 sm:p-7 ${style.ring}`}>
            <div className="mb-6 flex justify-center">
              <Badge variant={style.badge} className="uppercase tracking-eyebrow">
                {t(`sponsors.tier.${tier}`)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
              {(data.byTier[tier] ?? []).map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-2 max-w-[14rem]">
                  <SponsorLogo sponsor={s} cls={style.logo} />
                  {s.name && <p className="text-sm font-semibold text-ink-1 text-center">{s.name}</p>}
                  {s.description && <p className="text-xs text-ink-3 text-center line-clamp-2">{s.description}</p>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {showCta && (
        <p className="text-center text-sm">
          <Link href="/sponsors" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:text-ink-1">
            {t('sponsors.becomeSponsor')} <ArrowRight size={14} />
          </Link>
        </p>
      )}
    </div>
  );
}
