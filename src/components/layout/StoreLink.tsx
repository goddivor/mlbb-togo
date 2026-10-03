'use client';

import { Store } from 'lucide-react';
import { useT } from '@/lib/i18n';

/** Partner shop, opened in a new tab from every dashboard top bar. */
const STORE_URL = 'https://themediatorstore.netlify.app/';

export default function StoreLink() {
  const t = useT();
  const label = t('header.store');

  return (
    <a
      href={STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="header-btn"
    >
      <Store size={18} />
    </a>
  );
}
