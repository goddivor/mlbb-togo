'use client';

import { motion } from 'framer-motion';
import { springIndicator } from '@/lib/motion';

/**
 * Animated active-tab marker (sliding pill / underline). Lives in its own
 * module so `@/components/ui` no longer pulls framer-motion into every page
 * that only needs a Button or an Input: `Tabs` loads it lazily.
 */
export default function TabIndicator({ layoutId, className }: { layoutId: string; className: string }) {
  return <motion.span layoutId={layoutId} transition={springIndicator} className={className} />;
}
