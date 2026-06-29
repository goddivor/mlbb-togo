'use client';

import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import Features from '@/components/landing/Features';
import HeroShowcase from '@/components/landing/HeroShowcase';
import MtlSection from '@/components/landing/MtlSection';
import ContactSection from '@/components/landing/ContactSection';
import Sponsors from '@/components/landing/Sponsors';
import LandingFooter from '@/components/landing/LandingFooter';
import { useT } from '@/lib/i18n';

export default function Landing() {
  const t = useT();
  return (
    <div className="relative min-h-screen">
      {/* Section hero plein écran : banner e-sport en fond + titre superposé + header transparent */}
      <div className="relative">
        <LandingHeader />
        <HeroSection />
      </div>

      {/* Fonctionnalités */}
      <section className="relative z-10 px-4 pt-20 pb-20 max-w-7xl mx-auto">
        <Features />
      </section>

      {/* MTL — Mobile Legends Togo League */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <MtlSection />
      </section>

      {/* Vitrine des héros (dynamique, données officielles MLBB) */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 mb-6 text-center">
          {t('latestHeroes')}
        </p>
        <HeroShowcase />
      </section>

      {/* Sponsors */}
      <section className="relative z-10 px-4 pb-16 max-w-5xl mx-auto">
        <Sponsors />
      </section>

      {/* Contact (dernière section) */}
      <section className="relative z-10 px-4 pb-20 pt-4 max-w-7xl mx-auto">
        <ContactSection />
      </section>

      <LandingFooter />
    </div>
  );
}
