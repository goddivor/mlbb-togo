'use client';

import PublicShell from '@/components/landing/PublicShell';
import { AwardsView } from '@/components/public-views/AwardsView';

export default function Page() {
  return (
    <PublicShell>
      <AwardsView />
    </PublicShell>
  );
}
