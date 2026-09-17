'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Scale,
  Trophy,
  Eye,
  Megaphone,
  HeartHandshake,
  CalendarDays,
  BarChart3,
  Radio,
  Share2,
  Shield,
  MapPin,
  ArrowRight,
  Target,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Badge, Button } from '@/components/ui';
import PublicShell from '@/components/landing/PublicShell';
import ContactSection from '@/components/landing/ContactSection';
import Sponsors from '@/components/landing/Sponsors';
import CountUp from '@/components/about/CountUp';
import FaqAccordion from '@/components/about/FaqAccordion';
import { getAboutContent } from '@/content/about';
import { ORGANISATION } from '@/content/organisation';

type FigureKey = 'streamAudience' | 'socialReach' | 'teams' | 'offlineEvents';
type Figures = Record<FigureKey, number>;

const VALUE_ICONS = {
  community: { icon: Users, color: 'text-neon-blue', ring: 'bg-neon-blue/10' },
  fairplay: { icon: Scale, color: 'text-neon-green', ring: 'bg-neon-green/10' },
  excellence: { icon: Trophy, color: 'text-neon-gold', ring: 'bg-neon-gold/10' },
  transparency: { icon: Eye, color: 'text-neon-purple', ring: 'bg-neon-purple/10' },
} as const;

const FIGURE_ICONS: Record<FigureKey, { icon: any; color: string }> = {
  streamAudience: { icon: Radio, color: 'text-neon-pink' },
  socialReach: { icon: Share2, color: 'text-neon-blue' },
  teams: { icon: Shield, color: 'text-neon-purple' },
  offlineEvents: { icon: MapPin, color: 'text-neon-gold' },
};

const REASON_ICONS = {
  visibility: { icon: Megaphone, color: 'text-neon-blue', ring: 'bg-neon-blue/10' },
  audience: { icon: HeartHandshake, color: 'text-neon-pink', ring: 'bg-neon-pink/10' },
  events: { icon: CalendarDays, color: 'text-neon-gold', ring: 'bg-neon-gold/10' },
  content: { icon: BarChart3, color: 'text-neon-green', ring: 'bg-neon-green/10' },
} as const;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant="neon" size="sm" className="mb-3 uppercase tracking-[0.2em]">
      {children}
    </Badge>
  );
}

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
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <motion.div {...fadeUp} className="max-w-3xl">
          <Eyebrow>{c.hero.eyebrow}</Eyebrow>
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight">
            {c.hero.title.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="text-gradient">{c.hero.title.split(' ').slice(-1)}</span>
          </h1>
          <p className="text-gray-400 mt-5 text-lg leading-relaxed">{c.hero.subtitle}</p>
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Button variant="primary" size="lg" onClick={() => scrollTo('sponsor')}>
              {c.hero.ctaPrimary} <ArrowRight size={18} />
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push('/teams')}>
              {c.hero.ctaSecondary}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Story + mission */}
      <section id="story" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 scroll-mt-24">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-10">
          <motion.article {...fadeUp} className="lg:col-span-3 card-gaming p-7 sm:p-10">
            <Eyebrow>{c.story.eyebrow}</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{c.story.title}</h2>
            <div className="mt-5 space-y-4 text-gray-400 leading-relaxed">
              {c.story.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </motion.article>

          <motion.aside
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 rounded-xl border border-neon-blue/30 bg-gradient-to-br from-neon-blue/10 via-gaming-card to-neon-purple/10 p-7 sm:p-10 flex flex-col justify-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-neon-blue/15 flex items-center justify-center mb-5">
              <Target size={28} className="text-neon-blue" />
            </div>
            <Eyebrow>{c.mission.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-bold text-white">{c.mission.title}</h2>
            <p className="text-gray-400 mt-4 leading-relaxed">{c.mission.text}</p>
          </motion.aside>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 scroll-mt-24">
        <div className="text-center mb-10">
          <Eyebrow>{c.values.eyebrow}</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{c.values.title}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {c.values.items.map((v, i) => {
            const meta = VALUE_ICONS[v.key];
            const Icon = meta.icon;
            return (
              <motion.div
                key={v.key}
                {...fadeUp}
                transition={{ delay: i * 0.08 }}
                className="card-gaming p-7"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${meta.ring}`}>
                  <Icon size={26} className={meta.color} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Target figures */}
      {figures && (
        <section id="figures" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 scroll-mt-24">
          <div className="text-center mb-10">
            <Eyebrow>{c.figures.eyebrow}</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{c.figures.title}</h2>
            <p className="text-gray-400 mt-3 max-w-2xl mx-auto">{c.figures.subtitle}</p>
          </div>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {c.figures.items.map((f, i) => {
              const meta = FIGURE_ICONS[f.key];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={f.key}
                  {...fadeUp}
                  transition={{ delay: i * 0.08 }}
                  className="card-gaming p-5 sm:p-7 text-center flex flex-col"
                >
                  <Icon size={24} className={`${meta.color} mx-auto mb-3`} />
                  {/* dt is first in the DOM (valid dl) but shown under the number. */}
                  <dt className="order-2 mt-2 text-sm font-semibold text-gray-200">{f.label}</dt>
                  <dd className="order-1 text-3xl sm:text-4xl font-bold text-white tabular-nums">
                    <CountUp value={figures[f.key] ?? 0} locale={numberLocale} />
                    <span className={meta.color}>+</span>
                  </dd>
                  <dd className="order-3 mt-1 text-xs text-gray-500">{f.hint}</dd>
                </motion.div>
              );
            })}
          </dl>
        </section>
      )}

      {/* Why sponsor us */}
      <section id="sponsor" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 scroll-mt-24">
        <div className="text-center mb-10">
          <Eyebrow>{c.sponsor.eyebrow}</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{c.sponsor.title}</h2>
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">{c.sponsor.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {c.sponsor.items.map((r, i) => {
            const meta = REASON_ICONS[r.key];
            const Icon = meta.icon;
            return (
              <motion.div
                key={r.key}
                {...fadeUp}
                transition={{ delay: i * 0.08 }}
                className="card-gaming p-7 flex gap-5"
              >
                <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${meta.ring}`}>
                  <Icon size={26} className={meta.color} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1.5">{r.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{r.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <Button variant="primary" size="lg" onClick={() => scrollTo('contact')}>
            {c.sponsor.cta} <ArrowRight size={18} />
          </Button>
        </div>
        <div className="mt-14">
          <Sponsors />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 scroll-mt-24">
        <div className="text-center mb-8">
          <Eyebrow>{c.faq.eyebrow}</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{c.faq.title}</h2>
        </div>
        <FaqAccordion items={c.faq.items} />
        <p className="text-center text-sm text-gray-500 mt-6">
          {t('about.legalHint')}{' '}
          <Link href="/legal/donnees-personnelles" className="text-neon-blue hover:underline">
            {t('footer.link.privacy')}
          </Link>
          {' · '}
          <Link href="/legal/securite" className="text-neon-blue hover:underline">
            {t('footer.link.security')}
          </Link>
        </p>
      </section>

      {/* Contact */}
      <section id="contact" className="px-4 pb-20 pt-4 max-w-7xl mx-auto scroll-mt-24">
        <ContactSection />
        <p className="text-center text-xs text-gray-500 mt-6">
          {ORGANISATION.contactEmail}
        </p>
      </section>
    </PublicShell>
  );
}
