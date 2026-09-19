import { Megaphone, Radio, MapPin, Users, LayoutGrid } from 'lucide-react';

/** Feed categories (mirrors the backend enum). Legacy categories render as "community". */
export const FEED_CATEGORIES = ['announcement', 'stream', 'offline', 'community'] as const;
export type FeedCategory = (typeof FEED_CATEGORIES)[number];
export const STAFF_ONLY_CATEGORIES: FeedCategory[] = ['announcement', 'stream'];

export const FEED_SORTS = ['pinned', 'latest', 'popular'] as const;
export type FeedSort = (typeof FEED_SORTS)[number];

export const CATEGORY_META: Record<
  'all' | FeedCategory,
  { icon: any; badge: 'blue' | 'purple' | 'gold' | 'green' | 'default' | 'red' | 'pink' }
> = {
  all: { icon: LayoutGrid, badge: 'default' },
  announcement: { icon: Megaphone, badge: 'red' },
  stream: { icon: Radio, badge: 'purple' },
  offline: { icon: MapPin, badge: 'gold' },
  community: { icon: Users, badge: 'blue' },
};

export const MAX_POST_IMAGES = 6;

export const normalizeCategory = (raw?: string | null): FeedCategory =>
  (FEED_CATEGORIES as readonly string[]).includes(raw ?? '') ? (raw as FeedCategory) : 'community';

export const isStaffRole = (roleUser?: string | null) =>
  roleUser === 'admin' || roleUser === 'moderator';

export const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());
