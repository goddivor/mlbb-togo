'use client';

import Link from 'next/link';
import { Facebook, Instagram, Youtube, Twitch, Send } from 'lucide-react';
import { useT } from '@/lib/i18n';

const columns = [
  {
    titleKey: 'footer.col.discover',
    links: [
      { key: 'footer.link.home', href: '/' },
      { key: 'footer.link.heroes', href: '/dashboard/heroes' },
      { key: 'footer.link.rankings', href: '/dashboard/players' },
      { key: 'footer.link.teams', href: '/dashboard/teams' },
    ],
  },
  {
    titleKey: 'footer.col.community',
    links: [
      { key: 'footer.link.forum', href: '/dashboard/forum' },
      { key: 'footer.link.tournaments', href: '/dashboard/tournaments' },
      { key: 'footer.link.events', href: '/dashboard/events' },
      { key: 'footer.link.matches', href: '/dashboard/matches' },
      { key: 'nav.league', href: '/league' },
      { key: 'sponsors.becomeSponsor', href: '/sponsors' },
    ],
  },
  {
    titleKey: 'footer.col.legal',
    links: [
      { key: 'footer.link.about', href: '/about' },
      { key: 'footer.link.legalNotice', href: '/legal/mentions-legales' },
      { key: 'footer.link.security', href: '/legal/securite' },
      { key: 'footer.link.cookies', href: '/legal/cookies' },
      { key: 'footer.link.privacy', href: '/legal/donnees-personnelles' },
    ],
  },
];

// Official accounts: an icon is only shown once its URL is filled in, so the
// footer never renders dead "#" links.
const socials = [
  { icon: Facebook, href: '', label: 'Facebook' },
  { icon: Instagram, href: '', label: 'Instagram' },
  { icon: Youtube, href: '', label: 'YouTube' },
  { icon: Twitch, href: '', label: 'Twitch' },
  { icon: Send, href: '', label: 'WhatsApp' },
].filter((s) => s.href);

export default function LandingFooter() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-line-subtle bg-surface-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">

          <div className="col-span-2 md:col-span-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mlbb-togo-logo.png" alt="MLBB Togo" className="h-9 w-auto mb-4" />
            <p className="text-sm text-ink-2 max-w-xs">{t('footer.desc')}</p>
            {socials.length > 0 && (
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
                    className="w-9 h-9 flex items-center justify-center rounded cut-corners-sm bg-surface-2 text-ink-2 hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
            )}
          </div>

          {columns.map((col) => (
            <div key={col.titleKey}>
              <h3 className="eyebrow mb-4 !text-ink-1">{t(col.titleKey)}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.key}>
                    <Link href={l.href} className="text-sm text-ink-2 hover:text-primary transition-colors">
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-line-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-3">
          <p>© {year} MLBB Togo — {t('footer.copyright')}</p>
          <p>{t('footer.moonton')}</p>
        </div>
      </div>
    </footer>
  );
}
