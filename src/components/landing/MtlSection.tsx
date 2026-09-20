'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, SectionTitle } from '@/components/ui';
import { DURATION, EASE_OUT } from '@/lib/motion';

interface MtlImage {
  id: string;
  image: string;
  sort: number;
}
interface Mtl {
  name: string;
  season?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  images: MtlImage[];
}

export default function MtlSection() {
  const t = useT();
  const reduce = useReducedMotion();
  const [mtl, setMtl] = useState<Mtl | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    api.esport.mtl().then((m: any) => {
      if (m && Array.isArray(m.images) && m.images.length) setMtl(m);
    });
  }, []);

  const images = mtl?.images ?? [];
  const go = useCallback(
    (dir: number) => setActive((a) => (images.length ? (a + dir + images.length) % images.length : 0)),
    [images.length],
  );

  useEffect(() => {
    if (images.length < 2 || reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % images.length), 6000);
    return () => clearInterval(id);
  }, [images.length, reduce]);

  if (!mtl || !images.length) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
      <div className="lg:col-span-4">
        <Badge variant="gold" size="sm" className="mb-4 uppercase tracking-eyebrow">
          MTL{mtl.season ? ` ${mtl.season}` : ''}
        </Badge>
        <SectionTitle
          size="lg"
          eyebrow={t('mtl.eyebrow')}
          title={<span className="uppercase">{mtl.name}</span>}
          description={mtl.description ? <span className="block text-base leading-relaxed">{mtl.description}</span> : undefined}
        />
        <Link
          href="/league"
          className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-gold transition-colors hover:text-ink-1"
        >
          {t('hero.cta.league')} <ArrowRight size={14} />
        </Link>
      </div>

      <div className="relative lg:col-span-8">
        <div className="cut-corners relative w-full overflow-hidden border border-line-subtle bg-surface-0">
          <div className="relative aspect-video w-full">
            <AnimatePresence mode="wait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img
                key={images[active].id}
                src={images[active].image}
                alt={`${mtl.name} ${active + 1}`}
                initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.slow, ease: EASE_OUT }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-surface-0/90 to-transparent px-4 py-3">
            <span className="num font-display text-xs font-bold text-white/80">
              {String(active + 1).padStart(2, '0')}
              <span className="text-white/40"> / {String(images.length).padStart(2, '0')}</span>
            </span>
            <div className="flex items-center gap-1.5">
              {images.map((im, i) => (
                <button
                  key={im.id}
                  onClick={() => setActive(i)}
                  aria-label={`Visuel ${i + 1}`}
                  aria-current={i === active}
                  className={`h-1.5 -skew-x-12 transition-[width,background-color] duration-base ${
                    i === active ? 'w-8 bg-accent-gold' : 'w-3 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => go(-1)}
          aria-label="Précédent"
          className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/20 bg-surface-0/60 text-white/80 backdrop-blur transition-colors hover:border-white/60 hover:text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Suivant"
          className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/20 bg-surface-0/60 text-white/80 backdrop-blur transition-colors hover:border-white/60 hover:text-white"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
