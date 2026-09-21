'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { DURATION, EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/helpers';

/**
 * Hero band of the standalone public pages (About, Sponsors): angled colour
 * wash, uppercase display title and one orchestrated entrance.
 */
export default function PublicHero({
  eyebrow,
  title,
  subtitle,
  actions,
  accent = 'cyan',
  art,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  accent?: 'cyan' | 'gold' | 'violet';
  /** Optional decorative image on the right (desktop only). */
  art?: string;
}) {
  const reduce = useReducedMotion();
  const seq = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: DURATION.slow + 0.1, ease: EASE_OUT, delay: 0.1 + i * 0.1 },
        };
  const wash = {
    cyan: 'from-accent-cyan/25',
    gold: 'from-accent-gold/25',
    violet: 'from-accent-violet/25',
  }[accent];

  return (
    <section className="relative -mt-24 overflow-hidden border-b border-line-subtle bg-surface-1 pt-24 sm:-mt-28 sm:pt-28">
      <div
        aria-hidden="true"
        className={cn('absolute inset-y-0 right-0 w-[55%] bg-gradient-to-bl to-transparent', wash)}
        style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0 100%)' }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-grid [mask-image:linear-gradient(to_right,black,transparent)]" />
      {art && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={art}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 bottom-0 hidden h-[calc(100%-6rem)] w-auto select-none object-contain object-bottom opacity-90 lg:block"
        />
      )}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-3xl">
          <motion.p {...seq(0)} className="eyebrow mb-4">
            {eyebrow}
          </motion.p>
          <motion.h1
            {...seq(1)}
            className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight2 text-ink-1 sm:text-6xl"
          >
            {title}
          </motion.h1>
          <motion.p {...seq(2)} className="mt-6 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">
            {subtitle}
          </motion.p>
          {actions && (
            <motion.div {...seq(3)} className="mt-8 flex flex-wrap items-center gap-3">
              {actions}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
