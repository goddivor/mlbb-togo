'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { api, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button, LoadingSpinner } from '@/components/ui';
import RoleIcon from '@/components/game/RoleIcon';

export interface CatalogHero {
  id: string;
  name: string;
  role: string;
  roles?: string[];
  laneKeys?: string[];
  image?: string | null;
  thumb?: string | null;
}

const ROLES = ['tank', 'fighter', 'assassin', 'mage', 'marksman', 'support'];

/** Loads the DB hero catalog (`GET /heroes` returns a plain array). */
export function useHeroCatalog() {
  const [heroes, setHeroes] = useState<CatalogHero[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.heroes
      .list()
      .then((d: any) => setHeroes(Array.isArray(d) ? d : []))
      .catch(() => setHeroes([]))
      .finally(() => setLoading(false));
  }, []);
  return { heroes, loading };
}

/**
 * Searchable hero grid with images. Single (`max=1`) or multi selection.
 * `selected` holds catalog ids.
 */
export default function HeroPicker({
  heroes,
  loading,
  selected,
  onChange,
  max = 1,
}: {
  heroes: CatalogHero[];
  loading: boolean;
  selected: string[];
  onChange: (ids: string[]) => void;
  max?: number;
}) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return heroes.filter((h) => {
      const okRole =
        role === 'all' ||
        String(h.role).toLowerCase() === role ||
        (h.roles || []).some((r) => String(r).toLowerCase() === role);
      return okRole && (!q || h.name.toLowerCase().includes(q));
    });
  }, [heroes, query, role]);

  const byId = useMemo(() => new Map(heroes.map((h) => [h.id, h])), [heroes]);
  const full = selected.length >= max;

  const toggle = (id: string) => {
    if (selected.includes(id)) return onChange(selected.filter((x) => x !== id));
    if (max === 1) return onChange([id]);
    if (full) return;
    onChange([...selected, id]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bodydark2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('ai.picker.search')}
            className="w-full rounded-sm border border-stroke bg-gray-2 py-2 pl-9 pr-3 text-sm text-black placeholder-bodydark2 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={role === 'all' ? 'primary' : 'outline'} onClick={() => setRole('all')}>
            {t('heroes.role.all')}
          </Button>
          {ROLES.map((r) => (
            <Button key={r} size="sm" variant={role === r ? 'primary' : 'outline'} onClick={() => setRole(r)} className="gap-1">
              <RoleIcon role={r} size={14} />
              {t(`role.${r}`)}
            </Button>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-body dark:text-bodydark">{t('ai.picker.selected')}:</span>
          {selected.map((id) => {
            const h = byId.get(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {h?.name ?? id}
                <X size={12} />
              </button>
            );
          })}
          <button type="button" onClick={() => onChange([])} className="text-xs text-body underline dark:text-bodydark">
            {t('ai.picker.clear')}
          </button>
          {max > 1 && full && <span className="text-xs text-warning">{t('ai.picker.max')}</span>}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-bodydark2">{t('ai.picker.none')}</p>
      ) : (
        <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {filtered.map((h) => {
            const active = selected.includes(h.id);
            const img = h.thumb || h.image;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => toggle(h.id)}
                disabled={!active && max > 1 && full}
                title={h.name}
                className={`group overflow-hidden rounded-sm border bg-white text-left transition-colors disabled:opacity-40 dark:bg-boxdark ${
                  active ? 'border-primary ring-2 ring-primary/40' : 'border-stroke hover:border-primary dark:border-strokedark'
                }`}
              >
                <div className="aspect-square overflow-hidden bg-gray dark:bg-meta-4">
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mlbbImg(img, 96)} alt={h.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="truncate px-1 py-0.5 text-[10px] font-medium text-black dark:text-white">{h.name}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
