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
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 mb-6">
        {t('sponsors.title')}
      </p>
      <SponsorTiers data={data} compact className="[&_img]:grayscale [&_img:hover]:grayscale-0" />
      <Link
        href="/sponsors"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-neon-blue hover:underline"
      >
        {t('sponsors.becomeSponsor')} <ArrowRight size={14} />
      </Link>
    </div>
  );
}
