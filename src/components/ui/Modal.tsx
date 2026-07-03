'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/helpers';

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
  /** Taille sm | md | lg | xl. Ignorée si `maxWidth` est fourni. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Override direct de la largeur (ex. "max-w-3xl"). Prioritaire sur `size`. */
  maxWidth?: string;
  closeLabel?: string;
  /** "plain" (header sobre) ou "gradient" (bandeau dégradé coloré). */
  headerVariant?: 'plain' | 'gradient';
  headerGradient?: string;
}) {
  const width = maxWidth || SIZE_MAP[size];
  const gradient = headerVariant === 'gradient';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-h-[90vh] flex flex-col rounded-2xl border border-gaming-border bg-gaming-card shadow-2xl overflow-hidden',
              width
            )}
          >
            {(title || icon) && (
              <div
                className={cn(
                  'flex items-center justify-between gap-4 px-5 py-4',
                  gradient
                    ? cn('bg-gradient-to-r text-white', headerGradient)
                    : 'border-b border-gaming-border'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {icon && (
                    <div
                      className={cn(
                        'shrink-0 rounded-lg p-2 flex items-center justify-center',
                        gradient ? 'bg-white/20' : 'bg-gaming-surface text-neon-blue'
                      )}
                    >
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className={cn('font-bold truncate', gradient ? 'text-white' : 'text-white')}>
                      {title}
                    </h3>
                    {subtitle && (
                      <p
                        className={cn(
                          'text-xs truncate mt-0.5',
                          gradient ? 'text-white/80' : 'text-gray-400'
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
                      : 'text-gray-400 hover:text-white hover:bg-gaming-surface'
                  )}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="p-5 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
