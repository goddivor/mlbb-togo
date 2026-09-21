'use client';

import PublicShell from '@/components/landing/PublicShell';
import { SeasonsView } from '@/components/public-views/SeasonsView';

export default function Page() {
  return (
    <PublicShell>
      <SeasonsView />
    </PublicShell>
  );
}
