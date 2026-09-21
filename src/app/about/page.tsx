'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Scale,
  Trophy,
  Eye,
  Megaphone,
  HeartHandshake,
  CalendarDays,
  BarChart3,
  ArrowRight,
  Target,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Button, Card, type Accent } from '@/components/ui';
import PublicShell from '@/components/landing/PublicShell';
import ContactSection from '@/components/landing/ContactSection';
import Sponsors from '@/components/landing/Sponsors';
import FaqAccordion from '@/components/about/FaqAccordion';
import PublicHero from '@/components/about/PublicHero';
import { FigureGrid, IconCard, SectionHeading, type Figures } from '@/components/about/PublicBlocks';
import { getAboutContent } from '@/content/about';
import { ORGANISATION } from '@/content/organisation';

const VALUE_ICONS: Record<string, { icon: any; accent: Accent }> = {
  community: { icon: Users, accent: 'cyan' },
  fairplay: { icon: Scale, accent: 'green' },
  excellence: { icon: Trophy, accent: 'gold' },
  transparency: { icon: Eye, accent: 'violet' },
};

const REASON_ICONS: Record<string, { icon: any; accent: Accent }> = {
  visibility: { icon: Megaphone, accent: 'cyan' },
  audience: { icon: HeartHandshake, accent: 'red' },
  events: { icon: CalendarDays, accent: 'gold' },
  content: { icon: BarChart3, accent: 'green' },
};

export default function AboutPage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const c = useMemo(() => getAboutContent(lang), [lang]);
  const [figures, setFigures] = useState<Figures | null>(null);
  const router = useRouter();
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  useEffect(() => {
    api.esport
      .figures()
      .then((f: any) => {
        if (f && typeof f === 'object') setFigures(f);
      })
      .catch(() => {}); // silent fallback: the section simply stays hidden
  }, []);

  const numberLocale = lang === 'en' ? 'en-US' : 'fr-FR';

  return (
    <PublicShell>
      <PublicHero
        eyebrow={c.hero.eyebrow}
        title={c.hero.title}
        subtitle={c.hero.subtitle}
        art="/cecilion_soul_vessel.png"
        actions={
          <>
            <Button variant="primary" size="lg" onClick={() => scrollTo('sponsor')}>
              {c.hero.ctaPrimary} <ArrowRight size={18} />
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push('/dashboard/teams')}>
              {c.hero.ctaSecondary}
            </Button>
          </>
        }
      />

      {/* Story + mission */}
      <section id="story" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          <Card className="lg:col-span-3 p-7 sm:p-10">
            <p className="eyebrow mb-3">{c.story.eyebrow}</p>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight2 text-ink-1 sm:text-3xl">{c.story.title}</h2>
            <div className="mt-5 space-y-4 leading-relaxed text-ink-2">
              {c.story.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Card>

          <aside className="cut-corners relative flex flex-col justify-center overflow-hidden border border-primary/30 bg-surface-1 p-7 sm:p-10 lg:col-span-2">
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rotate-45 bg-primary/10" />
            <div className="mb-5 flex h-12 w-12 items-center justify-center cut-corners-sm bg-primary/10 text-primary">
              <Target size={26} />
            </div>
            <p className="eyebrow mb-3">{c.mission.eyebrow}</p>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight2 text-ink-1">{c.mission.title}</h2>
            <p className="mt-4 leading-relaxed text-ink-2">{c.mission.text}</p>
          </aside>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 sm:px-6">
        <SectionHeading eyebrow={c.values.eyebrow} title={c.values.title} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.values.items.map((v) => {
            const meta = VALUE_ICONS[v.key];
            return <IconCard key={v.key} icon={meta.icon} accent={meta.accent} title={v.title} desc={v.desc} />;
          })}
        </div>
      </section>

      {/* Target figures */}
      {figures && (
        <section id="figures" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 sm:px-6">
          <SectionHeading eyebrow={c.figures.eyebrow} title={c.figures.title} subtitle={c.figures.subtitle} />
          <FigureGrid figures={figures} items={c.figures.items} locale={numberLocale} />
        </section>
      )}

      {/* Why sponsor us */}
      <section id="sponsor" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 sm:px-6">
        <SectionHeading eyebrow={c.sponsor.eyebrow} title={c.sponsor.title} subtitle={c.sponsor.subtitle} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {c.sponsor.items.map((r) => {
            const meta = REASON_ICONS[r.key];
            return <IconCard key={r.key} horizontal icon={meta.icon} accent={meta.accent} title={r.title} desc={r.desc} />;
          })}
        </div>
        <div className="mt-10 text-center">
          <Button variant="primary" size="lg" onClick={() => scrollTo('contact')}>
            {c.sponsor.cta} <ArrowRight size={18} />
          </Button>
        </div>
        <div className="mt-14">
          <Sponsors />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 pb-20 sm:px-6">
        <SectionHeading eyebrow={c.faq.eyebrow} title={c.faq.title} className="mb-8" />
        <FaqAccordion items={c.faq.items} />
        <p className="mt-6 text-center text-sm text-ink-3">
          {t('about.legalHint')}{' '}
          <Link href="/legal/donnees-personnelles" className="text-primary hover:underline">
            {t('footer.link.privacy')}
          </Link>
          {' / '}
          <Link href="/legal/securite" className="text-primary hover:underline">
            {t('footer.link.security')}
          </Link>
        </p>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 pt-4">
        <ContactSection />
        <p className="mt-6 text-center text-xs text-ink-3">{ORGANISATION.contactEmail}</p>
      </section>
    </PublicShell>
  );
}
