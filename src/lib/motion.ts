import type { Transition, Variants } from 'framer-motion';

/**
 * Shared framer-motion vocabulary (issue #61). Every duration is short
 * (<= 320 ms) and uses the design-system easings. Components should pair
 * these with `useReducedMotion()` from framer-motion when the motion is not
 * user-triggered.
 */

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const DURATION = { fast: 0.15, base: 0.22, slow: 0.32 } as const;

export const transitionBase: Transition = { duration: DURATION.base, ease: EASE_OUT };
export const transitionFast: Transition = { duration: DURATION.fast, ease: EASE_OUT };
export const transitionSlow: Transition = { duration: DURATION.slow, ease: EASE_OUT };

/** Spring used by layout indicators (tabs, segmented controls). */
export const springIndicator: Transition = { type: 'spring', stiffness: 500, damping: 40, mass: 0.8 };

/** Fade + slide up (8 px). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transitionBase },
  exit: { opacity: 0, y: 4, transition: transitionFast },
};

/** Plain fade. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitionBase },
  exit: { opacity: 0, transition: transitionFast },
};

/** Scale-in for popovers and cards. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: transitionBase },
  exit: { opacity: 0, scale: 0.98, transition: transitionFast },
};

/** Parent container: staggers `fadeUp` children. */
export const stagger = (staggerChildren = 0.04, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

/** Page-level enter/exit used by `PageTransition`. */
export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
  exit: { opacity: 0, transition: transitionFast },
};

/** Variants with motion removed (used when `prefers-reduced-motion` is set). */
export const still: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
  exit: { opacity: 1 },
};
