'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui';

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
    if (images.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % images.length), 6000);
    return () => clearInterval(id);
  }, [images.length]);

  if (!mtl || !images.length) return null;

  return (
    <div>

      <div className="text-center mb-8">
        <Badge variant="gold" size="lg" className="mb-3 uppercase tracking-[0.2em]">
          <Trophy size={16} />
          MTL{mtl.season ? ` · ${mtl.season}` : ''}
        </Badge>
        <h2 className="text-2xl sm:text-4xl font-bold text-white">{mtl.name}</h2>
        {mtl.description && (
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">{mtl.description}</p>
        )}
      </div>

      <div className="relative w-full rounded-2xl border border-gaming-border overflow-hidden bg-gaming-darker">
        <div className="relative aspect-video w-full">

          <AnimatePresence mode="wait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              key={images[active].id}
              src={images[active].image}
              alt={`${mtl.name} ${active + 1}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
        </div>

        <button
          onClick={() => go(-1)}
          aria-label="Précédent"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Suivant"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
        >
          <ChevronRight size={28} />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {images.map((im, i) => (
            <button
              key={im.id}
              onClick={() => setActive(i)}
              aria-label={`Visuel ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === active ? 'w-6 bg-neon-gold' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
