'use client';

import { mlbbImg } from '@/lib/api';
import { MLBB_ROLE_ICONS } from '@/lib/constants';

// Esport roles (lanes) reuse the game's class icons.
const LANE_TO_CLASS: Record<string, string> = {
  roam: 'tank',
  exp: 'fighter',
  jungle: 'assassin',
  mid: 'mage',
  gold: 'marksman',
};

export function roleIconUrl(role?: string | null): string | null {
  if (!role) return null;
  const k = String(role).toLowerCase();
  const cls = MLBB_ROLE_ICONS[k] ? k : LANE_TO_CLASS[k] || '';
  return MLBB_ROLE_ICONS[cls] || null;
}

export default function RoleIcon({
  role,
  size = 18,
  className = '',
}: {
  role?: string | null;
  size?: number;
  className?: string;
}) {
  const url = roleIconUrl(role);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mlbbImg(url, size * 2)}
      alt={String(role)}
      title={String(role)}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className={`inline-block object-contain shrink-0 ${className}`}
    />
  );
}
