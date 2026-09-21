'use client';

import PublicShell from '@/components/landing/PublicShell';
import { LeagueView } from '@/components/public-views/LeagueView';

export default function Page() {
  return (
    <PublicShell>
      <LeagueView />
    </PublicShell>
  );
}
