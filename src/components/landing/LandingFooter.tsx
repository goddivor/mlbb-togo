'use client';

import Link from 'next/link';
import { Facebook, Instagram, Youtube, Twitch, Send } from 'lucide-react';
import { useT } from '@/lib/i18n';

const columns = [
  {
    titleKey: 'footer.col.discover',
    links: [
      { key: 'footer.link.home', href: '/' },
      { key: 'footer.link.heroes', href: '/heroes' },
      { key: 'footer.link.rankings', href: '/players' },
      { key: 'footer.link.teams', href: '/teams' },
    ],
  },
  {
    titleKey: 'footer.col.community',
    links: [
      { key: 'footer.link.forum', href: '/forum' },
      { key: 'footer.link.tournaments', href: '/tournaments' },
      { key: 'footer.link.events', href: '/events' },
      { key: 'footer.link.matches', href: '/matches' },
    ],
  },
  {
    titleKey: 'footer.col.account',
    links: [
      { key: 'footer.link.login', href: '/login' },
      { key: 'footer.link.register', href: '/register' },
    ],
  },
];

const socials = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: Twitch, href: '#', label: 'Twitch' },
  { icon: Send, href: '#', label: 'WhatsApp' },
];

export default function LandingFooter() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-gaming-border bg-gaming-darker/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Marque */}
          <div className="col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mlbb-togo-logo.png" alt="MLBB Togo" className="h-9 w-auto mb-4" />
            <p className="text-sm text-gray-400 max-w-xs">{t('footer.desc')}</p>
            <div className="flex items-center gap-3 mt-5">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-gaming-surface text-gray-400 hover:text-neon-blue hover:bg-neon-blue/10 transition-colors"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Colonnes de liens */}
          {columns.map((col) => (
            <div key={col.titleKey}>
              <h3 className="text-white font-semibold mb-4">{t(col.titleKey)}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.key}>
                    <Link href={l.href} className="text-sm text-gray-400 hover:text-neon-blue transition-colors">
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bas de page */}
        <div className="mt-10 pt-6 border-t border-gaming-border flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© {year} MLBB Togo — {t('footer.copyright')}</p>
          <p>{t('footer.moonton')}</p>
        </div>
      </div>
    </footer>
  );
}
