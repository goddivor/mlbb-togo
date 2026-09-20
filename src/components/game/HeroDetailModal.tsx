'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, ChevronsRight, Sparkles } from 'lucide-react';
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
          className="flex items-center gap-2.5 rounded border border-line-subtle bg-surface-2/60 p-1.5 pr-3"
        >
          {h.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mlbbImg(h.image, 72)}
              alt={h.name || ''}
              referrerPolicy="no-referrer"
              className="h-10 w-10 shrink-0 rounded cut-corners-sm bg-surface-3 object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-1">{h.name ?? `#${h.heroId}`}</p>
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
  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'skills' | 'counters' | 'builds'>('skills');

  useEffect(() => {
    if (heroId == null) return;
    setLoading(true);
    setHero(null);
    setMeta(null);
    setBuilds([]);
    setTab('skills');
    api.mlbb.hero(heroId).then(setHero).catch(() => setHero(null)).finally(() => setLoading(false));
    api.mlbb.heroMeta(heroId).then(setMeta).catch(() => setMeta(null));
    api.builds.byHero(String(heroId)).then(setBuilds).catch(() => setBuilds([]));
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
        { key: 'heroes.winRate', v: meta.winRate, color: 'text-accent-green' },
        { key: 'heroes.pickRate', v: meta.pickRate, color: 'text-accent-cyan' },
        { key: 'heroes.banRate', v: meta.banRate, color: 'text-accent-red' },
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
              className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-line-subtle bg-surface-1 shadow-elev-3"
            >
              <button
                onClick={onClose}
                aria-label={t('heroes.close')}
                className="absolute right-4 top-4 z-10 rounded cut-corners-sm bg-surface-0/70 p-1.5 text-ink-1 backdrop-blur-sm transition-colors hover:text-primary"
              >
                <X size={20} />
              </button>

              {loading || !hero ? (
                <div className="flex items-center justify-center py-40">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-line-strong border-t-primary" />
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    <div className="relative flex min-h-[320px] items-end justify-center overflow-hidden bg-surface-2">
                      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgb(var(--accent-cyan)/0.18),transparent_70%)]" />
                      {art && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mlbbImg(art, 800)}
                          alt={hero.name}
                          referrerPolicy="no-referrer"
                          className="relative max-h-[460px] w-full object-contain"
                        />
                      )}
                    </div>

                    <div className="p-6 md:p-8">
                      <p className="eyebrow mb-2">{t('nav.section.catalog')}</p>
                      <h2 className="font-display text-3xl font-bold tracking-tight2 text-ink-1 md:text-4xl">{hero.name}</h2>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {hero.roles?.map((r: string) => (
                          <span
                            key={r}
                            className="rounded bg-accent-violet/10 px-2.5 py-1 text-xs font-semibold text-accent-violet ring-1 ring-inset ring-accent-violet/25"
                          >
                            {r}
                          </span>
                        ))}
                        {hero.lanes?.map((l: string) => (
                          <span
                            key={l}
                            className="rounded bg-accent-cyan/10 px-2.5 py-1 text-xs font-semibold text-accent-cyan ring-1 ring-inset ring-accent-cyan/25"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                      {hero.specialities?.length > 0 && (
                        <p className="mt-3 text-sm text-ink-2">
                          {t('heroes.specialities')} : {hero.specialities.join(', ')}
                        </p>
                      )}

                      {rates && (
                        <div className="grid grid-cols-3 gap-2 mt-5">
                          {rates.map((r) => (
                            <div
                              key={r.key}
                              className="rounded border border-line-subtle bg-surface-2/40 p-2.5 text-center"
                            >
                              <p className={`font-display text-xl font-bold num ${r.color}`}>{r.v}%</p>
                              <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t(r.key)}</p>
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
                                <span className="text-ink-2">{t(s.key)}</span>
                                <span className="font-semibold num text-ink-1">{v}</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
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

                  <div className="flex gap-1 overflow-x-auto whitespace-nowrap border-y border-line-subtle px-6 pt-2 md:px-8">
                    {(['skills', 'counters', 'builds'] as const).map((tk) => (
                      <button
                        key={tk}
                        onClick={() => setTab(tk)}
                        className={`relative -mb-px shrink-0 whitespace-nowrap px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${
                          tab === tk
                            ? 'text-ink-1 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary after:shadow-glow-cyan'
                            : 'text-ink-3 hover:text-ink-2'
                        }`}
                      >
                        {t(tk === 'skills' ? 'heroes.tab.skills' : tk === 'counters' ? 'heroes.tab.counters' : 'heroes.tab.builds')}
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
                                  className="h-14 w-14 shrink-0 rounded cut-corners-sm bg-surface-2 object-cover ring-1 ring-inset ring-line-subtle"
                                />
                              )}
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-display text-base font-bold text-ink-1">
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
                                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-2">
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
                          <h3 className="mb-4 font-display text-lg font-bold tracking-tight2 text-ink-1">
                            {t('heroes.combos')}
                          </h3>
                          <div className="space-y-5">
                            {meta.combos.map((c: any, i: number) => (
                              <div
                                key={i}
                                className="rounded-lg border border-line-subtle bg-surface-2/40 p-4"
                              >
                                <p className="eyebrow mb-3">
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
                                          className="h-10 w-10 rounded cut-corners-sm bg-surface-2 object-cover ring-1 ring-inset ring-line-subtle"
                                        />
                                      )}
                                      {j < c.skills.length - 1 && (
                                        <ChevronsRight size={16} className="text-ink-3" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {c.description && (
                                  <p className="text-sm leading-relaxed text-ink-2">
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
                          <h3 className="mb-4 font-display text-lg font-bold tracking-tight2 text-ink-1">
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
                                    className="h-28 w-48 rounded-lg bg-surface-2 object-cover ring-1 ring-inset ring-line-subtle"
                                  />
                                )}
                                {sk.name && (
                                  <p className="mt-1.5 truncate text-sm text-ink-2">
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
                          <h3 className="mb-3 font-display text-lg font-bold tracking-tight2 text-ink-1">
                            {t('heroes.lore')}
                          </h3>
                          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">
                            {renderRichText(hero.story || hero.tale)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {tab === 'counters' && (
                    <div className="p-6 md:p-8">
                      {hero?.name && (
                        <Link
                          href={`/ai?tab=counter&enemy=${encodeURIComponent(hero.name)}`}
                          onClick={onClose}
                          className="mb-4 inline-flex items-center gap-1.5 rounded border border-primary/60 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                        >
                          <Sparkles size={14} />
                          {t('ai.counter.fromHero')}
                        </Link>
                      )}
                      {(() => {
                        const sections = [
                          { key: 'heroes.strongAgainst', color: 'text-accent-green', list: meta?.counters?.strong },
                          { key: 'heroes.weakAgainst', color: 'text-accent-red', list: meta?.counters?.weak },
                          { key: 'heroes.bestTeammates', color: 'text-accent-cyan', list: meta?.synergy?.best },
                          { key: 'heroes.worstTeammates', color: 'text-ink-2', list: meta?.synergy?.worst },
                        ].filter((s) => s.list?.length);
                        if (!sections.length) {
                          return (
                            <p className="py-10 text-center text-sm text-ink-3">
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

                  {tab === 'builds' && (
                    <div className="p-6 md:p-8">
                      {builds?.length > 0 ? (
                        <div className="space-y-6">
                          {builds.map((build, i) => (
                            <div key={build.id || i} className="rounded-lg border border-line-subtle bg-surface-2/40 p-4">
                              <div className="mb-4">
                                <h4 className="font-display text-base font-bold text-ink-1">
                                  {build.name || t('heroes.builds.unnamed')}
                                </h4>
                                {build.description && (
                                  <p className="mt-1 text-sm text-ink-2">{build.description}</p>
                                )}
                              </div>

                              <div className="space-y-3">
                                {build.items?.length > 0 && (
                                  <div>
                                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('heroes.builds.items')}</p>
                                    <div className="flex flex-wrap gap-2">
                                      {build.items.map((item: any, j: number) => (
                                        <div
                                          key={item.id || j}
                                          className="flex items-center gap-1.5 rounded border border-line-subtle bg-surface-1 p-2"
                                        >
                                          {item.icon && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={mlbbImg(item.icon, 80)}
                                              alt={item.name}
                                              referrerPolicy="no-referrer"
                                              className="h-8 w-8 rounded object-cover"
                                            />
                                          )}
                                          <span className="text-xs font-medium text-ink-1">{item.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                  {build.emblem && (
                                    <div>
                                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('heroes.builds.emblem')}</p>
                                      <div className="flex items-center gap-2 rounded border border-line-subtle bg-surface-1 p-2">
                                        {build.emblem.icon && (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={mlbbImg(build.emblem.icon, 80)}
                                            alt={build.emblem.name}
                                            referrerPolicy="no-referrer"
                                            className="h-8 w-8 rounded object-cover"
                                          />
                                        )}
                                        <span className="text-xs font-medium text-ink-1">{build.emblem.name}</span>
                                      </div>
                                    </div>
                                  )}

                                  {build.battleSpell && (
                                    <div>
                                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('heroes.builds.battleSpell')}</p>
                                      <div className="flex items-center gap-2 rounded border border-line-subtle bg-surface-1 p-2">
                                        {build.battleSpell.icon && (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={mlbbImg(build.battleSpell.icon, 80)}
                                            alt={build.battleSpell.name}
                                            referrerPolicy="no-referrer"
                                            className="h-8 w-8 rounded object-cover"
                                          />
                                        )}
                                        <span className="text-xs font-medium text-ink-1">{build.battleSpell.name}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="py-10 text-center text-sm text-ink-3">
                          {t('heroes.builds.empty')}
                        </p>
                      )}
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
