'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';

const ADMIN_ROLES = ['admin', 'moderator'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const t = useT();
  const user = useAuthStore((s: any) => s.user);
  const allowed = user && ADMIN_ROLES.includes(user.roleUser);

  useEffect(() => {
    if (user && !allowed) router.replace('/dashboard');
  }, [user, allowed, router]);

  if (!user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500 text-sm">
        {t('admin.forbidden')}
      </div>
    );
  }

  return <>{children}</>;
}
