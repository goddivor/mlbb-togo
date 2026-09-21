'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import { transitionBase } from '@/lib/motion';

/** Right-hand detail panel (full width on phones). Escape or backdrop closes it. */
export default function SidePanel({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[9999]">
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitionBase}
              onClick={onClose}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line-subtle bg-surface-1 shadow-elev-3"
              initial={reduce ? { opacity: 0 } : { x: '100%' }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: '100%' }}
              transition={transitionBase}
            >
              <header className="flex items-center justify-between gap-3 border-b border-line-subtle px-5 py-4">
                <h2 className="min-w-0 truncate font-display text-lg font-bold text-ink-1">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel}
                  className="rounded p-1.5 text-ink-2 transition-colors duration-fast hover:bg-surface-2 hover:text-ink-1"
                >
                  <X size={18} />
                </button>
              </header>
              <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
