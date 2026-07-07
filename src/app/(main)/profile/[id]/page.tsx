'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui';

/**
 * Legacy alias: this route used mock data and duplicated /players/[id]
 * (the real, API-backed public profile). Redirect there.
 */
export default function ProfileRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || '');

  useEffect(() => {
    router.replace(id ? `/players/${id}` : '/players');
  }, [id, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
