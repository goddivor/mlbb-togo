'use client';

import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { pageEnter, still } from '@/lib/motion';

/**
 * Subtle page enter (fade + 6 px rise, 320 ms) keyed on the pathname so every
 * route change replays it. Disabled when the OS asks for reduced motion.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={pathname}
      variants={reduce ? still : pageEnter}
      initial="hidden"
      animate="visible"
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
