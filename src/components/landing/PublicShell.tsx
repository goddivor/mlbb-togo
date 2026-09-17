'use client';

import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';
import BackToTop from './BackToTop';

/**
 * Shell shared by the standalone public pages (About, legal pages): same
 * header/footer as the landing, with room under the fixed header.
 */
export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <LandingHeader />
      <main className="relative z-10 flex-1 pt-24 sm:pt-28">{children}</main>
      <LandingFooter />
      <BackToTop />
    </div>
  );
}
