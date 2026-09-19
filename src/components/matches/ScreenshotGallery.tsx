'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import { TFn } from './shared';

export type GalleryItem = { url: string; caption?: string | null };

/**
 * Thumbnail grid with a lightbox: click to open, arrows / swipe buttons to
 * navigate, Escape to close. Keyboard: Left / Right / Escape.
 */
export default function ScreenshotGallery({
  items,
  t,
  openUrl,
  onOpenHandled,
}: {
  items: GalleryItem[];
  t: TFn;
  /** Ask the gallery to open on this URL (from outside, e.g. a game row). */
  openUrl?: string | null;
  onOpenHandled?: () => void;
}) {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!openUrl) return;
    const i = items.findIndex((it) => it.url === openUrl);
    if (i >= 0) setIndex(i);
    onOpenHandled?.();
  }, [openUrl, items, onOpenHandled]);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta: number) => {
      setIndex((i) => (i === null || items.length === 0 ? i : (i + delta + items.length) % items.length));
    },
    [items.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, close, step]);

  if (items.length === 0) return null;
  const current = index !== null ? items[index] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it, i) => (
          <button
            key={it.url + i}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative aspect-video overflow-hidden rounded-sm border border-stroke bg-gray-2 dark:border-strokedark dark:bg-meta-4"
            title={it.caption || t('matches.screenshots.open')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.url}
              alt={it.caption || `${t('matches.screenshots.title')} ${i + 1}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Broken link: keep the tile clickable but show a placeholder.
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="hidden h-full w-full flex-col items-center justify-center gap-1 text-bodydark2 [&:not(.hidden)]:flex">
              <Camera size={20} />
              <span className="text-[10px]">{i + 1}</span>
            </span>
            {it.caption && (
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-left text-[11px] text-white">
                {it.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {current && index !== null && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 p-4"
              onClick={close}
              role="dialog"
              aria-modal="true"
              aria-label={t('matches.screenshots.title')}
            >
              <button
                type="button"
                onClick={close}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label={t('common.close')}
              >
                <X size={20} />
              </button>
              <div className="absolute left-4 top-4 flex items-center gap-2 text-sm text-white/80">
                <Camera size={16} />
                {index + 1} / {items.length}
                <a
                  href={current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                >
                  <ExternalLink size={12} /> {t('matches.screenshots.original')}
                </a>
              </div>

              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      step(-1);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6"
                    aria-label={t('matches.calendar.prev')}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      step(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6"
                    aria-label={t('matches.calendar.next')}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              <motion.figure
                key={current.url}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18 }}
                className="flex max-h-full max-w-6xl flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.url}
                  alt={current.caption || ''}
                  referrerPolicy="no-referrer"
                  className="max-h-[80vh] max-w-full rounded-sm object-contain shadow-2xl"
                />
                {current.caption && (
                  <figcaption className="mt-3 text-center text-sm text-white/80">{current.caption}</figcaption>
                )}
              </motion.figure>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </>
  );
}
