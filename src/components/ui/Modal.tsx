'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/helpers';
import Portal from './Portal';

const SIZE_MAP: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  size = 'md',
  maxWidth,
  closeLabel = 'Fermer',
  headerVariant = 'plain',
  headerGradient = 'from-neon-blue to-neon-purple',
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Size sm | md | lg | xl. Ignored if `maxWidth` is provided. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Direct width override (e.g. "max-w-3xl"). Takes precedence over `size`. */
  maxWidth?: string;
  closeLabel?: string;
  /** "plain" (subtle header) or "gradient" (colored gradient banner). */
  headerVariant?: 'plain' | 'gradient';
  headerGradient?: string;
}) {
  const width = maxWidth || SIZE_MAP[size];
  const gradient = headerVariant === 'gradient';

  // Lock body scroll while open so the background doesn't scroll behind.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 overflow-y-auto"
          >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-h-[90vh] flex flex-col rounded-sm bg-white shadow-default overflow-hidden dark:bg-boxdark',
              width
            )}
          >
            {(title || icon) && (
              <div
                className={cn(
                  'flex items-center justify-between gap-4 px-6 py-4',
                  gradient
                    ? 'bg-primary text-white'
                    : 'border-b border-stroke dark:border-strokedark'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {icon && (
                    <div
                      className={cn(
                        'shrink-0 rounded-lg p-2 flex items-center justify-center',
                        gradient ? 'bg-white/20 text-white' : 'bg-gray text-primary dark:bg-meta-4'
                      )}
                    >
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3
                      className={cn(
                        'font-semibold truncate',
                        gradient ? 'text-white' : 'text-black dark:text-white'
                      )}
                    >
                      {title}
                    </h3>
                    {subtitle && (
                      <p
                        className={cn(
                          'text-xs truncate mt-0.5',
                          gradient ? 'text-white/80' : 'text-body dark:text-bodydark'
                        )}
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel}
                  className={cn(
                    'w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-colors',
                    gradient
                      ? 'text-white/90 hover:bg-white/20'
                      : 'text-body hover:text-black hover:bg-gray dark:text-bodydark dark:hover:text-white dark:hover:bg-meta-4'
                  )}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="p-6 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
