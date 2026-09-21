'use client';

import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import Features from '@/components/landing/Features';
import HeroShowcase from '@/components/landing/HeroShowcase';
import MtlSection from '@/components/landing/MtlSection';
import ContactSection from '@/components/landing/ContactSection';
import Sponsors from '@/components/landing/Sponsors';
import LandingFooter from '@/components/landing/LandingFooter';
import BackToTop from '@/components/landing/BackToTop';
import { useT } from '@/lib/i18n';

/** Angled band: a section whose top and bottom edges are cut diagonally. */
const ANGLED = 'relative [clip-path:polygon(0_0,100%_3vw,100%_100%,0_calc(100%-3vw))] sm:[clip-path:polygon(0_0,100%_4vw,100%_100%,0_calc(100%-4vw))]';

export default function Landing() {
  const t = useT();
  return (
    <div className="relative min-h-screen bg-surface-0">
      <div id="top" className="relative">
        <LandingHeader />
        <HeroSection />
      </div>

      <section id="features" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 pt-24 sm:px-6">
        <Features />
      </section>

      <div className={`${ANGLED} -my-[3vw] bg-surface-1 py-[calc(3vw+4rem)] sm:-my-[4vw] sm:py-[calc(4vw+5rem)]`}>
        <section id="mtl" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6">
          <MtlSection />
        </section>
      </div>

      <section id="heroes" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-4 pb-20 pt-24 sm:px-6">
        <p className="eyebrow mb-6 text-center">{t('latestHeroes')}</p>
        <HeroShowcase />
      </section>

      <section id="partners" className="relative z-10 mx-auto max-w-5xl scroll-mt-20 px-4 pb-16">
        <Sponsors />
      </section>

      <section id="contact" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 pt-8">
        <ContactSection />
      </section>

      <LandingFooter />
      <BackToTop />
    </div>
  );
}
