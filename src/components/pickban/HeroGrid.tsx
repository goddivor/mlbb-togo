'use client';

import { useMemo, useState } from 'react';
import { Info, Search } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { Button } from '@/components/ui';
import RoleIcon from '@/components/game/RoleIcon';
import HeroThumb from './HeroThumb';
import { LANES, type PickBanHero } from '@/lib/pickban';

const ROLES = ['tank', 'fighter', 'assassin', 'mage', 'marksman', 'support'];

export default function HeroGrid({
  heroes,
  used,
  disabled,
  onSelect,
  onInfo,
}: {
  heroes: PickBanHero[];
  used: Set<string>;
  disabled: boolean;
  onSelect: (hero: PickBanHero) => void;
  onInfo: (hero: PickBanHero) => void;
}) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [lane, setLane] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return heroes.filter((h) => {
      if (q && !h.name.toLowerCase().includes(q)) return false;
      if (role && !(h.roles?.length ? h.roles.includes(role) : h.role === role)) return false;
      if (lane && !(h.laneKeys ?? []).includes(lane)) return false;
      return true;
    });
  }, [heroes, query, role, lane]);

  const available = filtered.filter((h) => !used.has(h.id)).length;

  return (
    <div className="rounded-sm border border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-boxdark sm:p-4">
      <div className="mb-3 space-y-2.5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bodydark2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('pickban.search')}
            aria-label={t('pickban.search')}
            className="w-full rounded-sm border border-stroke bg-gray-2 py-2 pl-9 pr-3 text-sm text-black placeholder-bodydark2 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={role === '' ? 'primary' : 'outline'} onClick={() => setRole('')}>
            {t('pickban.filterRole')}
          </Button>
          {ROLES.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={role === r ? 'primary' : 'outline'}
              onClick={() => setRole(role === r ? '' : r)}
              className="gap-1"
              title={t(`role.${r}`)}
            >
              <RoleIcon role={r} size={14} />
              <span className="hidden sm:inline">{t(`role.${r}`)}</span>
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={lane === '' ? 'primary' : 'outline'} onClick={() => setLane('')}>
            {t('pickban.filterLane')}
          </Button>
          {LANES.map((l) => (
            <Button
              key={l}
              size="sm"
              variant={lane === l ? 'primary' : 'outline'}
              onClick={() => setLane(lane === l ? '' : l)}
            >
              {t(`draft.role.${l}`)}
            </Button>
          ))}
        </div>
        <p className="text-xs text-body dark:text-bodydark">
          {t('pickban.available', { count: available })}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-body dark:text-bodydark">{t('pickban.noHero')}</p>
      ) : (
        <div className="grid max-h-[60vh] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-7">
          {filtered.map((h) => {
            const isUsed = used.has(h.id);
            return (
              <div key={h.id} className="group relative">
                <button
                  type="button"
                  disabled={isUsed || disabled}
                  onClick={() => onSelect(h)}
                  title={h.name}
                  className={cn(
                    'w-full overflow-hidden rounded-sm border border-stroke bg-white text-left transition-colors dark:border-strokedark dark:bg-boxdark',
                    isUsed || disabled ? 'cursor-not-allowed' : 'hover:border-primary',
                  )}
                >
                  <HeroThumb
                    src={h.thumb ?? h.image}
                    name={h.name}
                    size={120}
                    className="aspect-square w-full"
                    dimmed={isUsed}
                  />
                  <div className="flex items-center gap-1 px-1.5 py-1">
                    <RoleIcon role={h.role} size={12} />
                    <span className="truncate text-[11px] font-medium text-black dark:text-white">
                      {h.name}
                    </span>
                  </div>
                </button>
                {h.heroId != null && (
                  <button
                    type="button"
                    onClick={() => onInfo(h)}
                    aria-label={t('pickban.heroInfo')}
                    title={t('pickban.heroInfo')}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-80 hover:opacity-100"
                  >
                    <Info size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
