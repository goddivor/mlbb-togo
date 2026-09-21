'use client';

import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';
import BackToTop from './BackToTop';

/**
 * Shell of the public site pages (league, awards, hall of fame, seasons,
 * sponsors, about, contact, legal): always the landing header/footer, even for
 * signed-in members, who have their own copies of these pages under /dashboard.
 * Leaves room under the fixed header.
 */
export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-surface-0">
      <LandingHeader />
      <main className="relative z-10 flex-1 pt-24 sm:pt-28">{children}</main>
      <LandingFooter />
      <BackToTop />
    </div>
  );
}
