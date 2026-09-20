'use client';

import Link from 'next/link';
import { Trophy, Users, Shield, MessageSquare, Swords, Calendar, Sparkles, Flag, ArrowRight } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { SectionTitle, type Accent } from '@/components/ui';

const ACCENT_TEXT: Record<Accent, string> = {
  cyan: 'text-accent-cyan',
  violet: 'text-accent-violet',
  gold: 'text-accent-gold',
  red: 'text-accent-red',
  green: 'text-accent-green',
};
const ACCENT_SOFT: Record<Accent, string> = {
  cyan: 'bg-accent-cyan/10',
  violet: 'bg-accent-violet/10',
  gold: 'bg-accent-gold/15',
  red: 'bg-accent-red/10',
  green: 'bg-accent-green/10',
};

const features: { key: string; icon: any; href: string; accent: Accent }[] = [
  { key: 'tournaments', icon: Trophy, href: '/tournaments', accent: 'gold' },
  { key: 'rankings', icon: Users, href: '/players', accent: 'cyan' },
  { key: 'teams', icon: Shield, href: '/teams', accent: 'violet' },
  { key: 'forum', icon: MessageSquare, href: '/forum', accent: 'red' },
  { key: 'matches', icon: Swords, href: '/matches', accent: 'cyan' },
  { key: 'events', icon: Calendar, href: '/events', accent: 'green' },
  { key: 'heroes', icon: Sparkles, href: '/heroes', accent: 'violet' },
  { key: 'esport', icon: Flag, href: '#partners', accent: 'gold' },
];

export default function Features() {
  const t = useT();

  return (
    <div>
      <SectionTitle
        size="lg"
        eyebrow={t('features.eyebrow')}
        title={
          <span className="uppercase">
            {t('features.titlePre')} <span className="text-accent-cyan">MLBB Togo</span>
          </span>
        }
        description={<span className="block max-w-2xl text-base">{t('features.subtitle')}</span>}
        className="mb-10"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.key}
              href={f.href}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-lg border border-line-subtle bg-surface-1 p-6 shadow-elev-1 transition-[transform,box-shadow,border-color] duration-base ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-elev-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1')}
            >
              <span
                aria-hidden="true"
                className={cn('absolute -right-10 -top-10 h-24 w-24 rotate-45 transition-transform duration-slow group-hover:scale-125', ACCENT_SOFT[f.accent])}
              />
              <div className={cn('mb-5 flex h-11 w-11 items-center justify-center cut-corners-sm', ACCENT_SOFT[f.accent], ACCENT_TEXT[f.accent])}>
                <Icon size={22} />
              </div>
              <h3 className="font-display text-lg font-bold uppercase tracking-tight2 text-ink-1">{t(`feat.${f.key}.title`)}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-2">{t(`feat.${f.key}.desc`)}</p>
              <span className={cn('mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider', ACCENT_TEXT[f.accent])}>
                {t('features.discover')}
                <ArrowRight size={14} className="transition-transform duration-base group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
