'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Item {
  q: string;
  a: string;
}

/** Accessible accordion: one open item at a time, keyboard friendly buttons. */
export default function FaqAccordion({ items, idPrefix = 'faq' }: { items: Item[]; idPrefix?: string }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-gaming-border rounded-2xl border border-gaming-border bg-gaming-card/70 backdrop-blur">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${idPrefix}-panel-${i}`;
        const buttonId = `${idPrefix}-button-${i}`;
        return (
          <div key={item.q}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left text-base font-semibold text-white hover:text-neon-blue transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition-transform ${isOpen ? 'rotate-180 text-neon-blue' : 'text-gray-500'}`}
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 sm:px-6 pb-5 text-sm sm:text-base text-gray-400 leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
