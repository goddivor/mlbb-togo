'use client';

import PublicShell from '@/components/landing/PublicShell';
import ContactSection from '@/components/landing/ContactSection';

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="relative mx-auto max-w-7xl px-4 pb-24">
        <ContactSection />
      </section>
    </PublicShell>
  );
}
