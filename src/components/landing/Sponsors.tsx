'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useT } from '@/lib/i18n';
import SponsorTiers, { useSponsors } from '@/components/sponsors/SponsorTiers';

/** Landing strip: sponsors of the current season (tiered sizes) + sponsoring CTA. */
export default function Sponsors() {
  const t = useT();
  const data = useSponsors('current');

  if (!data || data.items.length === 0) return null;

  return (
    <div className="border-y border-line-subtle py-12 text-center">
      <p className="eyebrow mb-2">{t('sponsors.eyebrow')}</p>
      <h2 className="mb-8 font-display text-2xl font-bold uppercase tracking-tight2 text-ink-1">{t('sponsors.title')}</h2>
      <SponsorTiers data={data} compact className="[&_img]:grayscale [&_img:hover]:grayscale-0" />
      <Link
        href="/sponsors"
        className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:text-ink-1"
      >
        {t('sponsors.becomeSponsor')} <ArrowRight size={14} />
      </Link>
    </div>
  );
}
