'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronsRight } from 'lucide-react';
import { api, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import Portal from '@/components/ui/Portal';

const STATS = [
  { i: 0, key: 'heroes.stat.durability', color: '#22c55e' },
  { i: 1, key: 'heroes.stat.offense', color: '#ef4444' },
  { i: 2, key: 'heroes.stat.effects', color: '#3b82f6' },
  { i: 3, key: 'heroes.stat.difficulty', color: '#f59e0b' },
];

// API descriptions embed <font color="xxxxxx"> and <br> markup. Convert it to
// React nodes (colored highlights) instead of showing raw HTML.
function renderRichText(text: string): React.ReactNode[] {
  if (!text) return [];
  const normalized = text.replace(/<br\s*\/?>/gi, '\n');
  const re = /<font\s+color="?#?([0-9a-fA-F]{3,8})"?>([\s\S]*?)<\/font>/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized)) !== null) {
    if (m.index > last) nodes.push(normalized.slice(last, m.index).replace(/<[^>]+>/g, ''));
    nodes.push(
      <span key={key++} style={{ color: `#${m[1].replace('#', '')}` }}>
        {m[2].replace(/<[^>]+>/g, '')}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < normalized.length) nodes.push(normalized.slice(last).replace(/<[^>]+>/g, ''));
  return nodes;
}

function HeroList({ heroes }: { heroes: any[] }) {
  if (!heroes?.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {heroes.map((h, i) => (
        <div
          key={h.heroId ?? i}
          className="flex items-center gap-2.5 rounded-sm border border-stroke bg-gray-2 p-1.5 pr-3 dark:border-strokedark dark:bg-meta-4"
        >
          {h.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mlbbImg(h.image, 72)}
              alt={h.name || ''}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-sm object-cover bg-gray-2 shrink-0 dark:bg-boxdark-2"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-black dark:text-white truncate">{h.name ?? `#${h.heroId}`}</p>
            <p
              className={`text-xs font-medium ${
                h.increaseWinRate >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {h.increaseWinRate > 0 ? '+' : ''}
              {h.increaseWinRate}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HeroDetailModal({
  heroId,
  onClose,
}: {
  heroId: number | null;
  onClose: () => void;
}) {
  const t = useT();
  const [hero, setHero] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'skills' | 'counters'>('skills');

  useEffect(() => {
    if (heroId == null) return;
    setLoading(true);
    setHero(null);
    setMeta(null);
    setTab('skills');
    api.mlbb.hero(heroId).then(setHero).catch(() => setHero(null)).finally(() => setLoading(false));
    api.mlbb.heroMeta(heroId).then(setMeta).catch(() => setMeta(null));
  }, [heroId]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (heroId == null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [heroId]);

  const art = hero?.painting || hero?.imageBig || hero?.image;
  const rates = meta?.available
    ? [
        { key: 'heroes.winRate', v: meta.winRate, color: 'text-success' },
        { key: 'heroes.pickRate', v: meta.pickRate, color: 'text-primary' },
        { key: 'heroes.banRate', v: meta.banRate, color: 'text-danger' },
      ]
    : null;

  return (
    <Portal>
      <AnimatePresence>
        {heroId != null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-2 sm:p-4 bg-black/50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
            >
              <button
                onClick={onClose}
                aria-label={t('heroes.close')}
                className="absolute top-4 right-4 z-10 rounded-md bg-gray-2 p-1.5 text-body transition-colors hover:text-primary dark:bg-meta-4 dark:text-bodydark"
              >
                <X size={20} />
              </button>

              {loading || !hero ? (
                <div className="flex items-center justify-center py-40">
                  <div className="w-10 h-10 rounded-full border-2 border-stroke border-t-primary animate-spin dark:border-strokedark" />
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    <div className="relative flex min-h-[320px] items-end justify-center bg-gray-2 dark:bg-boxdark-2">
                      {art && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mlbbImg(art, 800)}
                          alt={hero.name}
                          referrerPolicy="no-referrer"
                          className="max-h-[460px] w-full object-contain"
                        />
                      )}
                    </div>

                    <div className="p-6 md:p-8">
                      <h2 className="text-3xl font-bold text-black dark:text-white">{hero.name}</h2>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {hero.roles?.map((r: string) => (
                          <span
                            key={r}
                            className="rounded-full bg-meta-5/10 px-2.5 py-1 text-xs font-medium text-meta-5"
                          >
                            {r}
                          </span>
                        ))}
                        {hero.lanes?.map((l: string) => (
                          <span
                            key={l}
                            className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                      {hero.specialities?.length > 0 && (
                        <p className="text-sm text-body dark:text-bodydark mt-3">
                          {t('heroes.specialities')} : {hero.specialities.join(', ')}
                        </p>
                      )}

                      {rates && (
                        <div className="grid grid-cols-3 gap-2 mt-5">
                          {rates.map((r) => (
                            <div
                              key={r.key}
                              className="rounded-sm border border-stroke bg-gray-2 p-2.5 text-center dark:border-strokedark dark:bg-meta-4"
                            >
                              <p className={`text-lg font-bold ${r.color}`}>{r.v}%</p>
                              <p className="text-[11px] text-bodydark2">{t(r.key)}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3 mt-5">
                        {STATS.map((s) => {
                          const v = hero.abilityShow?.[s.i] ?? 0;
                          return (
                            <div key={s.i}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-body dark:text-bodydark">{t(s.key)}</span>
                                <span className="font-semibold text-black dark:text-white">{v}</span>
                              </div>
                              <div className="h-2 rounded-full bg-stroke overflow-hidden dark:bg-strokedark">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${Math.min(100, v)}%`, background: s.color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 border-t border-stroke px-6 pt-4 dark:border-strokedark md:px-8">
                    {(['skills', 'counters'] as const).map((tk) => (
                      <button
                        key={tk}
                        onClick={() => setTab(tk)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
                          tab === tk
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-body hover:text-black dark:text-bodydark dark:hover:text-white'
                        }`}
                      >
                        {t(tk === 'skills' ? 'heroes.tab.skills' : 'heroes.tab.counters')}
                      </button>
                    ))}
                  </div>

                  {tab === 'skills' && (
                    <div className="p-6 md:p-8">
                      {hero.skills?.length > 0 && (
                        <div className="space-y-5">
                          {hero.skills.map((sk: any, i: number) => (
                            <div key={sk.id ?? i} className="flex gap-4">
                              {sk.icon && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={mlbbImg(sk.icon, 120)}
                                  alt={sk.name}
                                  referrerPolicy="no-referrer"
                                  className="h-14 w-14 shrink-0 rounded-full border border-stroke object-cover bg-gray-2 dark:border-strokedark dark:bg-meta-4"
                                />
                              )}
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-base font-semibold text-black dark:text-white">
                                    {sk.name}
                                  </span>
                                  {sk.tags?.map((tag: any, j: number) => (
                                    <span
                                      key={j}
                                      className="text-[11px] px-2 py-0.5 rounded"
                                      style={{ color: `rgb(${tag.color})`, background: `rgba(${tag.color},0.14)` }}
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                </div>
                                {sk.description && (
                                  <p className="text-sm text-body dark:text-bodydark mt-1.5 leading-relaxed whitespace-pre-line">
                                    {renderRichText(sk.description)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {meta?.combos?.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-bold text-black dark:text-white mb-4">
                            {t('heroes.combos')}
                          </h3>
                          <div className="space-y-5">
                            {meta.combos.map((c: any, i: number) => (
                              <div
                                key={i}
                                className="rounded-sm border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4"
                              >
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-3">
                                  {c.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                  {c.skills.map((s: any, j: number) => (
                                    <div key={j} className="flex items-center gap-1.5">
                                      {s.icon && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={mlbbImg(s.icon, 88)}
                                          alt=""
                                          referrerPolicy="no-referrer"
                                          className="h-10 w-10 rounded-full border border-stroke object-cover bg-white dark:border-strokedark dark:bg-boxdark-2"
                                        />
                                      )}
                                      {j < c.skills.length - 1 && (
                                        <ChevronsRight size={16} className="text-bodydark2" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {c.description && (
                                  <p className="text-sm text-body dark:text-bodydark leading-relaxed">
                                    {renderRichText(c.description)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {hero.skins?.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-bold text-black dark:text-white mb-4">
                            {t('heroes.skins')} ({hero.skins.length})
                          </h3>
                          <div className="flex gap-4 overflow-x-auto pb-2">
                            {hero.skins.map((sk: any, i: number) => (
                              <div key={i} className="shrink-0 w-48">
                                {sk.image && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={mlbbImg(sk.image, 400)}
                                    alt={sk.name || 'Skin'}
                                    referrerPolicy="no-referrer"
                                    className="h-28 w-48 rounded-sm object-cover bg-gray-2 dark:bg-meta-4"
                                  />
                                )}
                                {sk.name && (
                                  <p className="text-sm text-body dark:text-bodydark mt-1.5 truncate">
                                    {sk.name}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(hero.story || hero.tale) && (
                        <div className="mt-8">
                          <h3 className="text-lg font-bold text-black dark:text-white mb-3">
                            {t('heroes.lore')}
                          </h3>
                          <p className="text-sm text-body dark:text-bodydark leading-relaxed whitespace-pre-line">
                            {renderRichText(hero.story || hero.tale)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {tab === 'counters' && (
                    <div className="p-6 md:p-8">
                      {(() => {
                        const sections = [
                          { key: 'heroes.strongAgainst', color: 'text-success', list: meta?.counters?.strong },
                          { key: 'heroes.weakAgainst', color: 'text-danger', list: meta?.counters?.weak },
                          { key: 'heroes.bestTeammates', color: 'text-primary', list: meta?.synergy?.best },
                          { key: 'heroes.worstTeammates', color: 'text-body dark:text-bodydark', list: meta?.synergy?.worst },
                        ].filter((s) => s.list?.length);
                        if (!sections.length) {
                          return (
                            <p className="text-center text-bodydark2 py-10">
                              {t('heroes.metaUnavailable')}
                            </p>
                          );
                        }
                        return (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {sections.map((s) => (
                              <div key={s.key}>
                                <h4 className={`text-sm font-semibold ${s.color} mb-3`}>{t(s.key)}</h4>
                                <HeroList heroes={s.list} />
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
