'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  closeLabel = 'Close',
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  closeLabel?: string;
}) {
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
            className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl border border-gaming-border bg-gaming-card shadow-2xl`}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gaming-border">
              <h3 className="font-bold text-white truncate">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gaming-surface transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
