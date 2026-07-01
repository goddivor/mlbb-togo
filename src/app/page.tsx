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

export default function Landing() {
  const t = useT();
  return (
    <div className="relative min-h-screen">

      <div id="top" className="relative">
        <LandingHeader />
        <HeroSection />
      </div>

      <section id="features" className="relative z-10 px-4 pt-20 pb-20 max-w-7xl mx-auto scroll-mt-20">
        <Features />
      </section>

      <section id="mtl" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 scroll-mt-20">
        <MtlSection />
      </section>

      <section id="heroes" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 scroll-mt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 mb-6 text-center">
          {t('latestHeroes')}
        </p>
        <HeroShowcase />
      </section>

      <section id="partners" className="relative z-10 px-4 pb-16 max-w-5xl mx-auto scroll-mt-20">
        <Sponsors />
      </section>

      <section id="contact" className="relative z-10 px-4 pb-20 pt-4 max-w-7xl mx-auto scroll-mt-20">
        <ContactSection />
      </section>

      <LandingFooter />
      <BackToTop />
    </div>
  );
}
