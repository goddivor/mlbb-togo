'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { api, mlbbImg } from '@/lib/api';

const STATS = [
  { i: 0, label: 'Résistance', color: '#22c55e' },
  { i: 1, label: 'Offense', color: '#ef4444' },
  { i: 2, label: 'Effets', color: '#3b82f6' },
  { i: 3, label: 'Difficulté', color: '#f59e0b' },
];

export default function HeroDetailModal({
  heroId,
  onClose,
}: {
  heroId: number | null;
  onClose: () => void;
}) {
  const [hero, setHero] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (heroId == null) return;
    setLoading(true);
    setHero(null);
    api.mlbb
      .hero(heroId)
      .then(setHero)
      .catch(() => setHero(null))
      .finally(() => setLoading(false));
  }, [heroId]);

  const art = hero?.painting || hero?.imageBig || hero?.image;

  return (
    <AnimatePresence>
      {heroId != null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 14 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gaming-border bg-gaming-card shadow-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-4 right-4 z-10 text-gray-300 hover:text-white bg-black/40 rounded-lg p-1.5 transition-colors"
            >
              <X size={20} />
            </button>

            {loading || !hero ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
              </div>
            ) : (
              <div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                  <div className="relative bg-gradient-to-br from-neon-blue/15 to-neon-purple/15 min-h-[260px] flex items-end justify-center">
                    {art && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mlbbImg(art, 600)}
                        alt={hero.name}
                        referrerPolicy="no-referrer"
                        className="max-h-[340px] w-full object-contain"
                      />
                    )}
                  </div>

                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-white">{hero.name}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {hero.roles?.map((r: string) => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded bg-neon-purple/15 text-neon-purple border border-neon-purple/30">{r}</span>
                      ))}
                      {hero.lanes?.map((l: string) => (
                        <span key={l} className="text-xs px-2 py-0.5 rounded bg-neon-blue/10 text-neon-blue border border-neon-blue/30">{l}</span>
                      ))}
                    </div>
                    {hero.specialities?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        Spécialités : {hero.specialities.join(', ')}
                      </p>
                    )}

                    <div className="space-y-2 mt-5">
                      {STATS.map((s) => {
                        const v = hero.abilityShow?.[s.i] ?? 0;
                        return (
                          <div key={s.i}>
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-gray-400">{s.label}</span>
                              <span className="text-gray-300 font-medium">{v}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gaming-surface overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, v)}%`, background: s.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {hero.skills?.length > 0 && (
                  <div className="p-6 border-t border-gaming-border">
                    <h3 className="font-bold text-white mb-4">Compétences</h3>
                    <div className="space-y-3">
                      {hero.skills.map((sk: any, i: number) => (
                        <div key={sk.id ?? i} className="flex gap-3">
                          {sk.icon && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mlbbImg(sk.icon, 96)}
                              alt={sk.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-lg object-cover bg-gaming-surface shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-white">{sk.name}</span>
                              {sk.tags?.map((t: any, j: number) => (
                                <span
                                  key={j}
                                  className="text-[10px] px-1.5 py-0.5 rounded"
                                  style={{ color: `rgb(${t.color})`, background: `rgba(${t.color},0.12)` }}
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                            {sk.description && (
                              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{sk.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hero.skins?.length > 0 && (
                  <div className="p-6 border-t border-gaming-border">
                    <h3 className="font-bold text-white mb-4">Skins ({hero.skins.length})</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {hero.skins.map((sk: any, i: number) => (
                        <div key={i} className="shrink-0 w-40">
                          {sk.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mlbbImg(sk.image, 320)}
                              alt={sk.name || 'Skin'}
                              referrerPolicy="no-referrer"
                              className="w-40 h-24 object-cover rounded-lg bg-gaming-surface"
                            />
                          )}
                          {sk.name && <p className="text-xs text-gray-300 mt-1 truncate">{sk.name}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(hero.story || hero.tale) && (
                  <div className="p-6 border-t border-gaming-border">
                    <h3 className="font-bold text-white mb-2">Histoire</h3>
                    <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                      {hero.story || hero.tale}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
