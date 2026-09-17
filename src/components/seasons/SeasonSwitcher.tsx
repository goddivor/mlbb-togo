'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Check, ChevronDown, Layers } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useSelectedSeason, isLiveSeason, type Season } from '@/store/useSeasonStore';
import { seasonShortLabel } from './shared';

/**
 * Global season selector. Drop it in a header (`variant="header"`) or inline
 * in a filter bar (`variant="inline"`). Pages read the choice through
 * `useSelectedSeason()`.
 */
export default function SeasonSwitcher({
  variant = 'header',
  allowAll = true,
  className = '',
}: {
  variant?: 'header' | 'inline';
  /** Offer the "all seasons" (no filter) entry. */
  allowAll?: boolean;
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { selection, setSelection, season, seasons, current, ready } = useSelectedSeason();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const label = !ready
    ? '…'
    : selection === 'all'
      ? t('seasons.switcher.all')
      : season
        ? seasonShortLabel(season)
        : t('seasons.switcher.none');

  const dot = (s: Season | null) => (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        isLiveSeason(s) ? 'bg-success' : s?.status === 'closed' ? 'bg-bodydark2' : 'bg-primary'
      }`}
      style={s?.color ? { backgroundColor: s.color } : undefined}
    />
  );

  const triggerCls =
    variant === 'header'
      ? 'flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-md text-body hover:text-primary hover:bg-gray dark:text-bodydark dark:hover:bg-meta-4 transition-colors'
      : 'flex items-center gap-2 py-2 pl-3 pr-3 text-sm rounded-sm bg-gray-2 border border-stroke text-black hover:border-primary dark:bg-meta-4 dark:border-strokedark dark:text-white transition-colors';

  const choose = (v: string) => {
    setSelection(v);
    setOpen(false);
  };

  const rowCls = (active: boolean) =>
    `w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
      active
        ? 'text-primary bg-primary/10'
        : 'text-body hover:bg-gray hover:text-black dark:text-bodydark dark:hover:bg-meta-4 dark:hover:text-white'
    }`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerCls}
        aria-label={t('seasons.switcher.label')}
        title={season?.name || t('seasons.switcher.label')}
      >
        <CalendarDays size={14} />
        <span className="max-w-[9rem] truncate">{label}</span>
        {season && dot(season)}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-64 rounded-sm border border-stroke bg-white shadow-default overflow-hidden z-50 dark:border-strokedark dark:bg-boxdark"
          >
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-bodydark2 border-b border-stroke dark:border-strokedark">
              {t('seasons.switcher.label')}
            </div>
            <div className="max-h-72 overflow-y-auto">
              <button type="button" onClick={() => choose('current')} className={rowCls(selection === 'current')}>
                {dot(current)}
                <span className="flex-1 truncate">
                  {t('seasons.switcher.current')}
                  {current && <span className="text-bodydark2"> · {seasonShortLabel(current)}</span>}
                </span>
                {selection === 'current' && <Check size={14} />}
              </button>
              {allowAll && (
                <button type="button" onClick={() => choose('all')} className={rowCls(selection === 'all')}>
                  <Layers size={12} className="text-bodydark2" />
                  <span className="flex-1">{t('seasons.switcher.all')}</span>
                  {selection === 'all' && <Check size={14} />}
                </button>
              )}
              {seasons.length > 0 && <div className="my-1 border-t border-stroke dark:border-strokedark" />}
              {seasons.map((s) => (
                <button key={s.id} type="button" onClick={() => choose(s.id)} className={rowCls(selection === s.id)}>
                  {dot(s)}
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{s.name}</span>
                    <span className="block text-[11px] text-bodydark2 truncate">
                      {t('seasons.status.' + s.status)}
                      {s.theme ? ` · ${s.theme}` : ''}
                    </span>
                  </span>
                  {selection === s.id && <Check size={14} />}
                </button>
              ))}
            </div>
            <Link
              href="/seasons"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs font-medium text-primary border-t border-stroke hover:bg-primary/5 dark:border-strokedark"
            >
              {t('seasons.switcher.browse')}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
