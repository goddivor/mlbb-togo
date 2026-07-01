'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronsRight } from 'lucide-react';
import { api, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';

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
          className="flex items-center gap-2.5 rounded-lg border border-gaming-border bg-gaming-surface/30 p-1.5 pr-3"
        >
          {h.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mlbbImg(h.image, 72)}
              alt={h.name || ''}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-lg object-cover bg-gaming-dark shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white truncate">{h.name ?? `#${h.heroId}`}</p>
            <p className={`text-xs font-medium ${h.increaseWinRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {h.increaseWinRate > 0 ? '+' : ''}{h.increaseWinRate}%
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

  const art = hero?.painting || hero?.imageBig || hero?.image;
  const rates = meta?.available
    ? [
        { key: 'heroes.winRate', v: meta.winRate, color: 'text-green-400' },
        { key: 'heroes.pickRate', v: meta.pickRate, color: 'text-neon-blue' },
        { key: 'heroes.banRate', v: meta.banRate, color: 'text-red-400' },
      ]
    : null;

  return (
    <AnimatePresence>
      {heroId != null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 14 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl border border-gaming-border bg-gaming-card shadow-2xl"
          >
            <button
              onClick={onClose}
              aria-label={t('heroes.close')}
              className="absolute top-4 right-4 z-10 text-gray-300 hover:text-white bg-black/40 rounded-lg p-1.5 transition-colors"
            >
              <X size={20} />
            </button>

            {loading || !hero ? (
              <div className="flex items-center justify-center py-40">
                <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className="relative bg-gradient-to-br from-neon-blue/15 to-neon-purple/15 min-h-[320px] flex items-end justify-center">
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
                    <h2 className="text-3xl font-bold text-white">{hero.name}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {hero.roles?.map((r: string) => (
                        <span key={r} className="text-xs px-2.5 py-1 rounded bg-neon-purple/15 text-neon-purple border border-neon-purple/30">{r}</span>
                      ))}
                      {hero.lanes?.map((l: string) => (
                        <span key={l} className="text-xs px-2.5 py-1 rounded bg-neon-blue/10 text-neon-blue border border-neon-blue/30">{l}</span>
                      ))}
                    </div>
                    {hero.specialities?.length > 0 && (
                      <p className="text-sm text-gray-400 mt-3">
                        {t('heroes.specialities')} : {hero.specialities.join(', ')}
                      </p>
                    )}

                    {rates && (
                      <div className="grid grid-cols-3 gap-2 mt-5">
                        {rates.map((r) => (
                          <div key={r.key} className="rounded-lg border border-gaming-border bg-gaming-surface/30 p-2.5 text-center">
                            <p className={`text-lg font-bold ${r.color}`}>{r.v}%</p>
                            <p className="text-[11px] text-gray-400">{t(r.key)}</p>
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
                              <span className="text-gray-400">{t(s.key)}</span>
                              <span className="text-gray-200 font-semibold">{v}</span>
                            </div>
                            <div className="h-2 rounded-full bg-gaming-surface overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, v)}%`, background: s.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 px-6 md:px-8 pt-4 border-t border-gaming-border">
                  {(['skills', 'counters'] as const).map((tk) => (
                    <button
                      key={tk}
                      onClick={() => setTab(tk)}
                      className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
                        tab === tk
                          ? 'text-neon-blue border-b-2 border-neon-blue'
                          : 'text-gray-400 hover:text-white'
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
                                className="w-14 h-14 rounded-full object-cover bg-gaming-surface shrink-0 border border-gaming-border"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-semibold text-white">{sk.name}</span>
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
                                <p className="text-sm text-gray-400 mt-1.5 leading-relaxed whitespace-pre-line">
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
                        <h3 className="text-lg font-bold text-white mb-4">{t('heroes.combos')}</h3>
                        <div className="space-y-5">
                          {meta.combos.map((c: any, i: number) => (
                            <div key={i} className="rounded-xl border border-gaming-border bg-gaming-surface/20 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-neon-blue mb-3">{c.title}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                {c.skills.map((s: any, j: number) => (
                                  <div key={j} className="flex items-center gap-1.5">
                                    {s.icon && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={mlbbImg(s.icon, 88)}
                                        alt=""
                                        referrerPolicy="no-referrer"
                                        className="w-10 h-10 rounded-full object-cover bg-gaming-dark border border-gaming-border"
                                      />
                                    )}
                                    {j < c.skills.length - 1 && <ChevronsRight size={16} className="text-gray-500" />}
                                  </div>
                                ))}
                              </div>
                              {c.description && (
                                <p className="text-sm text-gray-400 leading-relaxed">{renderRichText(c.description)}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {hero.skins?.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-bold text-white mb-4">{t('heroes.skins')} ({hero.skins.length})</h3>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {hero.skins.map((sk: any, i: number) => (
                            <div key={i} className="shrink-0 w-48">
                              {sk.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={mlbbImg(sk.image, 400)}
                                  alt={sk.name || 'Skin'}
                                  referrerPolicy="no-referrer"
                                  className="w-48 h-28 object-cover rounded-lg bg-gaming-surface"
                                />
                              )}
                              {sk.name && <p className="text-sm text-gray-300 mt-1.5 truncate">{sk.name}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(hero.story || hero.tale) && (
                      <div className="mt-8">
                        <h3 className="text-lg font-bold text-white mb-3">{t('heroes.lore')}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                          {renderRichText(hero.story || hero.tale)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'counters' && (
                  <div className="p-6 md:p-8">
                    {!meta?.available ? (
                      <p className="text-center text-gray-500 py-10">{t('heroes.metaUnavailable')}</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-green-400 mb-3">{t('heroes.strongAgainst')}</h4>
                          <HeroList heroes={meta.counters.strong} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-red-400 mb-3">{t('heroes.weakAgainst')}</h4>
                          <HeroList heroes={meta.counters.weak} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-neon-blue mb-3">{t('heroes.bestTeammates')}</h4>
                          <HeroList heroes={meta.synergy.best} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-3">{t('heroes.worstTeammates')}</h4>
                          <HeroList heroes={meta.synergy.worst} />
                        </div>
                      </div>
                    )}
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
