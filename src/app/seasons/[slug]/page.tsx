'use client';

import PublicShell from '@/components/landing/PublicShell';
import { SeasonDetailView } from '@/components/public-views/SeasonDetailView';

export default function Page() {
  return (
    <PublicShell>
      <SeasonDetailView />
    </PublicShell>
  );
}
