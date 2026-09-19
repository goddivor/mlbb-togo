'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Radio,
  Share2,
  Shield,
  MapPin,
  Shirt,
  Megaphone,
  Clapperboard,
  Gift,
  Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Badge, Button } from '@/components/ui';
import PublicShell from '@/components/landing/PublicShell';
import CountUp from '@/components/about/CountUp';
import FaqAccordion from '@/components/about/FaqAccordion';
import SponsorTiers, { useSponsors, type SponsorTier } from '@/components/sponsors/SponsorTiers';
import PartnershipForm from '@/components/sponsors/PartnershipForm';
import { getAboutContent } from '@/content/about';
import { getSponsorsContent, type SponsorActivation } from '@/content/sponsors';

type FigureKey = 'streamAudience' | 'socialReach' | 'teams' | 'offlineEvents';
type Figures = Record<FigureKey, number>;

interface Offer {
  id: string;
  name: string;
  tier: SponsorTier | null;
  priceLabel: string | null;
  benefits: string[];
  highlight: boolean;
}

const FIGURE_ICONS: Record<FigureKey, { icon: any; color: string }> = {
  streamAudience: { icon: Radio, color: 'text-neon-pink' },
  socialReach: { icon: Share2, color: 'text-neon-blue' },
  teams: { icon: Shield, color: 'text-neon-purple' },
  offlineEvents: { icon: MapPin, color: 'text-neon-gold' },
};

const ACTIVATION_ICONS: Record<SponsorActivation['key'], { icon: any; color: string; ring: string }> = {
  stream: { icon: Radio, color: 'text-neon-pink', ring: 'bg-neon-pink/10' },
  jersey: { icon: Shirt, color: 'text-neon-blue', ring: 'bg-neon-blue/10' },
  events: { icon: MapPin, color: 'text-neon-gold', ring: 'bg-neon-gold/10' },
  feed: { icon: Megaphone, color: 'text-neon-purple', ring: 'bg-neon-purple/10' },
  content: { icon: Clapperboard, color: 'text-neon-green', ring: 'bg-neon-green/10' },
  prizes: { icon: Gift, color: 'text-orange-400', ring: 'bg-orange-400/10' },
};

const TIER_BADGE: Record<SponsorTier, string> = {
  title: 'gold',
  gold: 'gold',
  silver: 'default',
  partner: 'blue',
};

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

export default function SponsorsPage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const c = useMemo(() => getSponsorsContent(lang), [lang]);
  const about = useMemo(() => getAboutContent(lang), [lang]);
  const [figures, setFigures] = useState<Figures | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [faq, setFaq] = useState<{ q: string; a: string }[]>([]);
  const [selectedOffer, setSelectedOffer] = useState('');
  const sponsors = useSponsors('current');

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  useEffect(() => {
    api.esport
      .figures()
      .then((f: any) => {
        if (f && typeof f === 'object') setFigures(f);
      })
      .catch(() => {});
    api.sponsors
      .offers()
      .then((list: any) => {
        if (Array.isArray(list)) setOffers(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.sponsors
      .faq(lang)
      .then((d: any) => {
        if (d && Array.isArray(d.items)) setFaq(d.items);
      })
      .catch(() => {});
  }, [lang]);

  const chooseOffer = (id: string) => {
    setSelectedOffer(id);
    scrollTo('partnership');
  };

  const numberLocale = lang === 'en' ? 'en-US' : 'fr-FR';

  return (
    <PublicShell>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <motion.div {...fadeUp} className="max-w-3xl">
          <Eyebrow>{c.hero.eyebrow}</Eyebrow>
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight">
            {c.hero.title.split(' ').slice(0, -2).join(' ')}{' '}
            <span className="text-gradient">{c.hero.title.split(' ').slice(-2).join(' ')}</span>
          </h1>
          <p className="text-gray-400 mt-5 text-lg leading-relaxed">{c.hero.subtitle}</p>
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Button variant="primary" size="lg" onClick={() => scrollTo('offers')}>
              {c.hero.ctaPrimary} <ArrowRight size={18} />
            </Button>
            <Button variant="outline" size="lg" onClick={() => scrollTo('partnership')}>
              {c.hero.ctaSecondary}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Pitch */}
      <section id="pitch" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 scroll-mt-24">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-10">
          <motion.article {...fadeUp} className="lg:col-span-3 card-gaming p-7 sm:p-10">
            <Eyebrow>{c.pitch.eyebrow}</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{c.pitch.title}</h2>
            <div className="mt-5 space-y-4 text-gray-400 leading-relaxed">
              {c.pitch.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </motion.article>
          <motion.aside
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 rounded-xl border border-neon-gold/30 bg-gradient-to-br from-neon-gold/10 via-gaming-card to-neon-purple/10 p-7 sm:p-10 flex flex-col justify-center"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-gold mb-4">{t('sponsors.tiersTitle')}</p>
            <ul className="space-y-3">
              {(['title', 'gold', 'silver', 'partner'] as SponsorTier[]).map((tier) => (
                <li key={tier} className="flex gap-3">
                  <Star size={16} className="mt-1 shrink-0 text-neon-gold" />
                  <div>
                    <p className="text-sm font-semibold text-white">{c.tiers[tier].label}</p>
                    <p className="text-xs text-gray-400">{c.tiers[tier].desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.aside>
        </div>
      </section>

      {/* Target figures (same counters as the About page) */}
      {figures && (
        <section id="figures" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 scroll-mt-24">
          <div className="text-center mb-10">
            <Eyebrow>{c.figures.eyebrow}</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{c.figures.title}</h2>
            <p className="text-gray-400 mt-3 max-w-2xl mx-auto">{c.figures.subtitle}</p>
          </div>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {about.figures.items.map((f, i) => {
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

      {/* Offers */}
      <section id="offers" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 scroll-mt-24">
        <div className="text-center mb-10">
          <Eyebrow>{c.offers.eyebrow}</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{c.offers.title}</h2>
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">{c.offers.subtitle}</p>
        </div>
        {offers.length === 0 ? (
          <p className="text-center text-gray-400 card-gaming p-8 max-w-2xl mx-auto">{c.offers.empty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {offers.map((o, i) => (
              <motion.div
                key={o.id}
                {...fadeUp}
                transition={{ delay: i * 0.06 }}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  o.highlight
                    ? 'border-neon-gold/60 bg-gradient-to-b from-neon-gold/10 to-gaming-card shadow-[0_0_40px_-12px_rgba(250,204,21,0.5)]'
                    : 'border-gaming-border bg-gaming-card/70'
                }`}
              >
                {o.highlight && (
                  <Badge variant="gold" size="sm" className="absolute -top-3 left-6 uppercase tracking-wider">
                    {t('sponsors.offer.popular')}
                  </Badge>
                )}
                {o.tier && (
                  <Badge variant={TIER_BADGE[o.tier]} size="sm" className="w-fit mb-3">
                    {t(`sponsors.tier.${o.tier}`)}
                  </Badge>
                )}
                <h3 className="text-xl font-bold text-white">{o.name}</h3>
                <p className="text-neon-blue font-semibold mt-1">{o.priceLabel || t('sponsors.offer.onQuote')}</p>
                <ul className="mt-5 space-y-2 flex-1">
                  {o.benefits.map((b) => (
                    <li key={b} className="flex gap-2 text-sm text-gray-300">
                      <Check size={16} className="mt-0.5 shrink-0 text-neon-green" /> <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={o.highlight ? 'primary' : 'outline'}
                  size="sm"
                  className="mt-6 w-full"
                  onClick={() => chooseOffer(o.id)}
                >
                  {c.offers.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
        <p className="text-center text-sm text-gray-500 mt-8">{c.offers.custom}</p>
      </section>

      {/* Activations */}
      <section id="activations" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 scroll-mt-24">
        <div className="text-center mb-10">
          <Eyebrow>{c.activations.eyebrow}</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{c.activations.title}</h2>
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">{c.activations.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {c.activations.items.map((a, i) => {
            const meta = ACTIVATION_ICONS[a.key];
            const Icon = meta.icon;
            return (
              <motion.div key={a.key} {...fadeUp} transition={{ delay: i * 0.06 }} className="card-gaming p-7 flex gap-5">
                <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${meta.ring}`}>
                  <Icon size={26} className={meta.color} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1.5">{a.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{a.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Current season sponsors */}
      {sponsors && sponsors.items.length > 0 && (
        <section id="current" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 scroll-mt-24">
          <div className="text-center mb-10">
            <Eyebrow>{c.current.eyebrow}</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {c.current.title}
              {sponsors.season && <span className="text-gradient"> · {sponsors.season.name}</span>}
            </h2>
            <p className="text-gray-400 mt-3">{c.current.subtitle}</p>
          </div>
          <SponsorTiers data={sponsors} showCta={false} />
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 scroll-mt-24">
          <div className="text-center mb-8">
            <Eyebrow>{c.faq.eyebrow}</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{c.faq.title}</h2>
          </div>
          <FaqAccordion items={faq} idPrefix="sponsor-faq" />
        </section>
      )}

      {/* Partnership form */}
      <section id="partnership" className="px-4 sm:px-6 pb-20 pt-4 max-w-7xl mx-auto scroll-mt-24">
        <PartnershipForm
          offers={offers}
          selectedOfferId={selectedOffer}
          onOfferChange={setSelectedOffer}
          eyebrow={c.form.eyebrow}
          title={c.form.title}
          subtitle={c.form.subtitle}
        />
      </section>
    </PublicShell>
  );
}
