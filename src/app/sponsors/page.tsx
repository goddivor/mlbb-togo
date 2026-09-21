'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Radio,
  MapPin,
  Shirt,
  Megaphone,
  Clapperboard,
  Gift,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { cn } from '@/lib/helpers';
import { Badge, Button, type Accent } from '@/components/ui';
import PublicShell from '@/components/landing/PublicShell';
import FaqAccordion from '@/components/about/FaqAccordion';
import PublicHero from '@/components/about/PublicHero';
import { FigureGrid, IconCard, SectionHeading, type Figures } from '@/components/about/PublicBlocks';
import SponsorTiers, { useSponsors, type SponsorTier } from '@/components/sponsors/SponsorTiers';
import PartnershipForm from '@/components/sponsors/PartnershipForm';
import { getAboutContent } from '@/content/about';
import { getSponsorsContent, type SponsorActivation } from '@/content/sponsors';

interface Offer {
  id: string;
  name: string;
  tier: SponsorTier | null;
  priceLabel: string | null;
  benefits: string[];
  highlight: boolean;
}

const ACTIVATION_ICONS: Record<SponsorActivation['key'], { icon: any; accent: Accent }> = {
  stream: { icon: Radio, accent: 'red' },
  jersey: { icon: Shirt, accent: 'cyan' },
  events: { icon: MapPin, accent: 'gold' },
  feed: { icon: Megaphone, accent: 'violet' },
  content: { icon: Clapperboard, accent: 'green' },
  prizes: { icon: Gift, accent: 'gold' },
};

const TIER_BADGE: Record<SponsorTier, string> = {
  title: 'tier-gold',
  gold: 'tier-gold',
  silver: 'tier-silver',
  partner: 'tier-bronze',
};

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
      <PublicHero
        accent="gold"
        eyebrow={c.hero.eyebrow}
        title={c.hero.title}
        subtitle={c.hero.subtitle}
        actions={
          <>
            <Button variant="primary" size="lg" onClick={() => scrollTo('offers')}>
              {c.hero.ctaPrimary} <ArrowRight size={18} />
            </Button>
            <Button variant="outline" size="lg" onClick={() => scrollTo('partnership')}>
              {c.hero.ctaSecondary}
            </Button>
          </>
        }
      />

      {/* Pitch */}
      <section id="pitch" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          <article className="rounded-lg border border-line-subtle bg-surface-1 p-7 shadow-elev-1 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1 sm:p-10 lg:col-span-3">
            <p className="eyebrow mb-3">{c.pitch.eyebrow}</p>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight2 text-ink-1 sm:text-3xl">{c.pitch.title}</h2>
            <div className="mt-5 space-y-4 leading-relaxed text-ink-2">
              {c.pitch.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </article>
          <aside className="cut-corners relative flex flex-col justify-center overflow-hidden border border-accent-gold/30 bg-surface-1 p-7 sm:p-10 lg:col-span-2">
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rotate-45 bg-accent-gold/10" />
            <p className="eyebrow mb-5 !text-accent-gold">{t('sponsors.tiersTitle')}</p>
            <ul className="space-y-4">
              {(['title', 'gold', 'silver', 'partner'] as SponsorTier[]).map((tier) => (
                <li key={tier} className="flex items-start gap-3">
                  <Badge variant={TIER_BADGE[tier]} size="sm" className="mt-0.5 w-24 shrink-0 justify-center uppercase">
                    {t(`sponsors.tier.${tier}`)}
                  </Badge>
                  <div>
                    <p className="text-sm font-semibold text-ink-1">{c.tiers[tier].label}</p>
                    <p className="text-xs text-ink-3">{c.tiers[tier].desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* Target figures (same counters as the About page) */}
      {figures && (
        <section id="figures" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 sm:px-6">
          <SectionHeading eyebrow={c.figures.eyebrow} title={c.figures.title} subtitle={c.figures.subtitle} />
          <FigureGrid figures={figures} items={about.figures.items} locale={numberLocale} />
        </section>
      )}

      {/* Offers */}
      <section id="offers" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 sm:px-6">
        <SectionHeading eyebrow={c.offers.eyebrow} title={c.offers.title} subtitle={c.offers.subtitle} />
        {offers.length === 0 ? (
          <p className="mx-auto max-w-2xl rounded-lg border border-line-subtle bg-surface-1 p-8 text-center text-ink-2">{c.offers.empty}</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {offers.map((o) => (
              <div
                key={o.id}
                className={cn(
                  'relative flex w-full flex-col rounded-lg border bg-surface-1 p-6 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1 sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]',
                  o.highlight ? 'border-accent-gold/60 shadow-glow-gold' : 'border-line-subtle shadow-elev-1'
                )}
              >
                {o.highlight && (
                  <Badge variant="gold" size="sm" className="absolute -top-3 left-6 uppercase tracking-wider">
                    {t('sponsors.offer.popular')}
                  </Badge>
                )}
                {o.tier && (
                  <Badge variant={TIER_BADGE[o.tier]} size="sm" className="mb-3 w-fit uppercase">
                    {t(`sponsors.tier.${o.tier}`)}
                  </Badge>
                )}
                <h3 className="font-display text-xl font-bold uppercase tracking-tight2 text-ink-1">{o.name}</h3>
                <p className="num mt-1 font-display text-lg font-bold text-primary">{o.priceLabel || t('sponsors.offer.onQuote')}</p>
                <ul className="mt-5 flex-1 space-y-2">
                  {o.benefits.map((b) => (
                    <li key={b} className="flex gap-2 text-sm text-ink-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-accent-green" /> <span>{b}</span>
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
              </div>
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-sm text-ink-3">{c.offers.custom}</p>
      </section>

      {/* Activations */}
      <section id="activations" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 sm:px-6">
        <SectionHeading eyebrow={c.activations.eyebrow} title={c.activations.title} subtitle={c.activations.subtitle} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.activations.items.map((a) => {
            const meta = ACTIVATION_ICONS[a.key];
            return <IconCard key={a.key} horizontal icon={meta.icon} accent={meta.accent} title={a.title} desc={a.desc} />;
          })}
        </div>
      </section>

      {/* Current season sponsors */}
      {sponsors && sponsors.items.length > 0 && (
        <section id="current" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 sm:px-6">
          <SectionHeading
            eyebrow={c.current.eyebrow}
            title={
              <>
                {c.current.title}
                {sponsors.season && <span className="text-accent-gold"> {sponsors.season.name}</span>}
              </>
            }
            subtitle={c.current.subtitle}
          />
          <SponsorTiers data={sponsors} showCta={false} />
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 pb-20 sm:px-6">
          <SectionHeading eyebrow={c.faq.eyebrow} title={c.faq.title} className="mb-8" />
          <FaqAccordion items={faq} idPrefix="sponsor-faq" />
        </section>
      )}

      {/* Partnership form */}
      <section id="partnership" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 pt-4 sm:px-6">
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
