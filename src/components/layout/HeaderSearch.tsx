'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Swords,
  Users,
  Shield,
  Megaphone,
  Radio,
  Users2,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useT } from '@/lib/i18n';

const LINKS = [
  { href: '/dashboard', key: 'header.dashboard', icon: LayoutDashboard },
  { href: '/heroes', key: 'header.heroes', icon: Swords },
  { href: '/players', key: 'header.players', icon: Users },
  { href: '/teams', key: 'header.teams', icon: Shield },
  { href: '/recruitment', key: 'header.recruitment', icon: Megaphone },
  { href: '/stream', key: 'header.stream', icon: Radio },
  { href: '/friends', key: 'header.friends', icon: Users2 },
];

/** Mobile search: a round icon button that opens a quick-navigation modal. */
export default function HeaderSearch() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
    setQ('');
  }, [open]);

  const results = useMemo(() => {
    const items = LINKS.map((l) => ({ ...l, label: t(l.key) }));
    const s = q.trim().toLowerCase();
    return s ? items.filter((l) => l.label.toLowerCase().includes(s)) : items;
  }, [q, t]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        aria-label={t('search.title')}
        onClick={() => setOpen(true)}
        className="flex h-12 w-12 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray text-black hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
      >
        <Search size={18} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('search.title')} size="md">
        <div className="p-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bodydark2">
              <Search size={18} />
            </span>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) go(results[0].href);
              }}
              placeholder={t('search.placeholder')}
              className="w-full rounded-lg border border-stroke bg-transparent py-3 pl-10 pr-4 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
            />
          </div>

          <div className="mt-3 space-y-1">
            {results.length === 0 ? (
              <p className="py-6 text-center text-sm text-bodydark2">{t('search.empty')}</p>
            ) : (
              results.map((l) => {
                const Icon = l.icon;
                return (
                  <button
                    key={l.href}
                    type="button"
                    onClick={() => go(l.href)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-2 dark:hover:bg-meta-4"
                  >
                    <Icon size={18} className="text-primary" />
                    <span className="text-black dark:text-white">{l.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
