'use client';

import Link from 'next/link';
import { UserCog, ExternalLink } from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui';
import { avatarSrc } from '@/lib/api';
import type { TFn } from './shared';

export const STAFF_ROLES = ['coach', 'assistant_coach', 'manager', 'analyst', 'content', 'other'];

const ROLE_VARIANT: Record<string, string> = {
  coach: 'gold',
  assistant_coach: 'gold',
  manager: 'blue',
  analyst: 'purple',
  content: 'pink',
  other: 'default',
};

export function StaffCard({ s, t }: { s: any; t: TFn }) {
  const name = s.name || s.user?.displayName || s.user?.username || '';
  const avatar = s.avatar || s.user?.avatar;
  return (
    <div className="flex items-start gap-3 rounded-sm border border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-boxdark">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarSrc(avatar, 96)} alt={name} referrerPolicy="no-referrer" className="h-12 w-12 shrink-0 rounded-sm border border-stroke object-cover dark:border-strokedark" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-meta-2 text-primary dark:bg-meta-4"><UserCog size={20} /></div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-medium text-black dark:text-white">{name}</p>
          <Badge variant={ROLE_VARIANT[s.role] || 'default'} size="sm">{t('staffRole.' + (s.role || 'other'))}</Badge>
        </div>
        {s.bio && <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-body dark:text-bodydark">{s.bio}</p>}
        {s.userId && (
          <Link href={`/players/${s.userId}`} className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <ExternalLink size={12} /> {t('teams.staff.viewProfile')}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function TeamStaff({ staff, t }: { staff: any[]; t: TFn }) {
  const list = Array.isArray(staff) ? staff : [];
  if (list.length === 0) return <EmptyState icon={<UserCog size={28} />} title={t('teams.staff.empty')} />;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((s) => <StaffCard key={s.id} s={s} t={t} />)}
    </div>
  );
}
