'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, TrendingUp, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { searchResult, recentSearches, trendingSearches } from '@/mocks/search';
import type { SearchResult } from '@/mocks/types';
import { useT } from '@/lib/i18n';

const GROUPS: { key: keyof SearchResult; label: string; href?: (id: string) => string }[] = [
  { key: 'players', label: 'Joueurs', href: (id) => `/players/${id}` },
  { key: 'squads', label: 'Squads', href: (id) => `/teams` },
  { key: 'heroes', label: 'Héros', href: () => `/heroes` },
  { key: 'tournaments', label: 'Tournois', href: () => `/tournaments` },
  { key: 'matches', label: 'Matchs', href: () => `/matches` },
  { key: 'awards', label: 'Awards', href: () => `/tournaments` },
  { key: 'streams', label: 'Streams', href: () => `/streams` },
];

export default function GlobalSearch() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>(recentSearches);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const out: SearchResult = {
      players: [], squads: [], heroes: [], tournaments: [], matches: [], awards: [], news: [], streams: [], calendar: [],
    };
    for (const p of searchResult.players) {
      if ((p.displayName || '').toLowerCase().includes(q) || (p.username || '').toLowerCase().includes(q)) out.players.push(p);
    }
    for (const s of searchResult.squads) {
      if ((s.name || '').toLowerCase().includes(q)) out.squads.push(s);
    }
    for (const h of searchResult.heroes) {
      if ((h.name || '').toLowerCase().includes(q)) out.heroes.push(h);
    }
    for (const t of searchResult.tournaments) {
      if ((t.name || '').toLowerCase().includes(q)) out.tournaments.push(t);
    }
    for (const m of searchResult.matches) {
      if ((m.teamA?.name || '').toLowerCase().includes(q) || (m.teamB?.name || '').toLowerCase().includes(q)) out.matches.push(m);
    }
    for (const a of searchResult.awards) {
      if ((a.name || '').toLowerCase().includes(q) || (a.category || '').toLowerCase().includes(q)) out.awards.push(a);
    }
    for (const st of searchResult.streams) {
      if ((st.title || '').toLowerCase().includes(q) || (st.tournament || '').toLowerCase().includes(q)) out.streams.push(st);
    }
    return out;
  }, [query]);

  const addRecent = (value: string) => {
    setRecent((r) => {
      const next = [value, ...r.filter((x) => x !== value)].slice(0, 8);
      return next;
    });
  };

  const totalResults = results
    ? results.players.length +
      results.squads.length +
      results.heroes.length +
      results.tournaments.length +
      results.matches.length +
      results.awards.length +
      results.streams.length
    : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors"
        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--sidebar-text)' }}
        aria-label="Open search"
      >
        <Search size={16} />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline rounded-lg border px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)', color: 'var(--sidebar-text)' }}>
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
          >
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)} />
            <div className="mx-auto mt-[10vh] max-w-2xl w-full px-4">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="rounded-2xl border shadow-2xl overflow-hidden"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <Search size={18} style={{ color: 'var(--sidebar-text)' }} />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('search.placeholder') || 'Search players, squads, heroes...'}
                    className="w-full bg-transparent outline-none text-sm"
                    style={{ color: 'var(--page-text)' }}
                  />
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1" style={{ color: 'var(--sidebar-text)' }}>
                    <X size={16} />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto px-2 pb-2">
                  {!results && (
                    <div className="py-6">
                      {recent.length > 0 && (
                        <div className="mb-4">
                          <p className="px-2 text-xs font-semibold mb-2" style={{ color: 'var(--sidebar-text)' }}>Recent</p>
                          <div className="flex flex-wrap gap-2">
                            {recent.map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => { addRecent(r); setQuery(r); }}
                                className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs transition-colors"
                                style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)', color: 'var(--page-text)' }}
                              >
                                <Clock size={12} style={{ color: 'var(--sidebar-text)' }} />
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="px-2 text-xs font-semibold mb-2" style={{ color: 'var(--sidebar-text)' }}>Trending</p>
                        <div className="flex flex-wrap gap-2">
                          {trendingSearches.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => { addRecent(r); setQuery(r); }}
                              className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs transition-colors"
                              style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)', color: 'var(--page-text)' }}
                            >
                              <TrendingUp size={12} style={{ color: 'var(--sidebar-text)' }} />
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {results && totalResults === 0 && (
                    <div className="py-10 text-center text-sm" style={{ color: 'var(--sidebar-text)' }}>
                      No results for “{query}”
                    </div>
                  )}

                  {results && totalResults > 0 && (
                    <div className="space-y-3">
                      {GROUPS.map((group) => {
                        const items = results[group.key];
                        if (!items || items.length === 0) return null;
                        return (
                          <div key={group.key}>
                            <p className="px-2 text-xs font-semibold mb-1" style={{ color: 'var(--sidebar-text)' }}>{group.label}</p>
                            <div className="space-y-1">
                              {items.slice(0, 5).map((item: any) => {
                                const href = group.href ? group.href(item.id) : '#';
                                const label = item.displayName || item.name || item.title || item.category || 'Result';
                                return (
                                  <Link
                                    key={item.id}
                                    href={href}
                                    onClick={() => { addRecent(label); setOpen(false); }}
                                    className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors"
                                    style={{ background: 'var(--surface-bg)', color: 'var(--page-text)' }}
                                  >
                                    <span className="text-sm truncate">{label}</span>
                                    <ArrowRight size={14} style={{ color: 'var(--sidebar-text)' }} />
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t px-4 py-2 text-[11px]" style={{ borderColor: 'var(--card-border)', color: 'var(--sidebar-text)' }}>
                  <span>
                    <kbd className="rounded-lg border px-1.5 py-0.5" style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)' }}>↵</kbd> to select
                  </span>
                  <span>
                    <kbd className="rounded-lg border px-1.5 py-0.5" style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)' }}>esc</kbd> to close
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
