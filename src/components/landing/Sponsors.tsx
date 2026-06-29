'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';

interface Sponsor {
  id: string;
  logo: string;
  name?: string;
  url?: string;
}

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const t = useT();

  useEffect(() => {
    api.esport.sponsors().then((list: any) => {
      if (Array.isArray(list)) setSponsors(list);
    });
  }, []);

  if (!sponsors.length) return null;

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 mb-6">
        {t('sponsors.title')}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
        {sponsors.map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.id}
            src={s.logo}
            alt={s.name || 'Sponsor'}
            className="h-24 sm:h-32 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
          />
        ))}
      </div>
    </div>
  );
}
