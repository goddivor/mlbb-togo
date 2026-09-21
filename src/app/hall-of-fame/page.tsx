'use client';

import PublicShell from '@/components/landing/PublicShell';
import { HallOfFameView } from '@/components/public-views/HallOfFameView';

export default function Page() {
  return (
    <PublicShell>
      <HallOfFameView />
    </PublicShell>
  );
}
