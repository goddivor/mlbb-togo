'use client';

import { Ban } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import RoleIcon from '@/components/game/RoleIcon';
import HeroThumb from './HeroThumb';
import {
  BANS_PER_TEAM,
  PICKS_PER_TEAM,
  type DraftStep,
  type PickBanHero,
  type PickBanMode,
  type PickBanTeam,
  type TeamState,
} from '@/lib/pickban';

export default function TeamColumn({
  team,
  state,
  mode,
  heroes,
  activeStep,
}: {
  team: PickBanTeam;
  state: TeamState;
  mode: PickBanMode;
  heroes: Map<string, PickBanHero>;
  activeStep: DraftStep | null;
}) {
  const t = useT();
  const isBlue = team === 'blue';
  const active = activeStep?.team === team;
  const laneLabel = (lane?: string) => (lane ? t(`draft.role.${lane}`) : t('pickban.noLane'));

  const pickSlots = Array.from({ length: PICKS_PER_TEAM }, (_, i) => state.picks[i] ?? null);
  const banSlots = Array.from({ length: BANS_PER_TEAM[mode] }, (_, i) => state.bans[i] ?? null);

  return (
    <div
      className={cn(
        'rounded-sm border bg-white shadow-default dark:bg-boxdark',
        isBlue ? 'border-primary/40' : 'border-danger/40',
        active && (isBlue ? 'ring-2 ring-primary/60' : 'ring-2 ring-danger/60'),
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between rounded-t-sm px-4 py-2.5 text-sm font-semibold text-white',
          isBlue ? 'bg-primary' : 'bg-danger',
        )}
      >
        <span>{t(isBlue ? 'pickban.blue' : 'pickban.red')}</span>
        <span className="text-xs font-medium opacity-90">
          {state.picks.length}/{PICKS_PER_TEAM} · {state.bans.length}/{BANS_PER_TEAM[mode]}
        </span>
      </div>

      <div className="space-y-4 p-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark">
            {t('pickban.picks')}
          </p>
          <ul className="space-y-1.5">
            {pickSlots.map((pick, i) => {
              const hero = pick ? heroes.get(pick.heroId) : null;
              const isNext = active && activeStep?.action === 'pick' && i === state.picks.length;
              return (
                <li
                  key={i}
                  className={cn(
                    'flex items-center gap-2.5 rounded-sm border px-2 py-1.5',
                    pick
                      ? 'border-stroke bg-gray-2 dark:border-strokedark dark:bg-meta-4'
                      : 'border-dashed border-stroke dark:border-strokedark',
                    isNext && (isBlue ? 'border-primary' : 'border-danger'),
                  )}
                >
                  <HeroThumb
                    src={hero?.thumb ?? hero?.image}
                    name={pick?.heroName ?? '?'}
                    size={80}
                    className="h-10 w-10 shrink-0 rounded-sm"
                  />
                  <div className="min-w-0 flex-1">
                    {pick ? (
                      <>
                        <p className="truncate text-sm font-medium text-black dark:text-white">
                          {pick.heroName}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-body dark:text-bodydark">
                          {pick.lane && <RoleIcon role={pick.lane} size={12} />}
                          {laneLabel(pick.lane)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-bodydark2">{t('pickban.emptySlot')}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark">
            {t('pickban.bans')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {banSlots.map((ban, i) => {
              const hero = ban ? heroes.get(ban.heroId) : null;
              const isNext = active && activeStep?.action === 'ban' && i === state.bans.length;
              return (
                <div
                  key={i}
                  title={ban?.heroName}
                  className={cn(
                    'relative h-11 w-11 overflow-hidden rounded-sm border',
                    ban
                      ? 'border-stroke dark:border-strokedark'
                      : 'border-dashed border-stroke dark:border-strokedark',
                    isNext && (isBlue ? 'border-primary' : 'border-danger'),
                  )}
                >
                  {ban ? (
                    <>
                      <HeroThumb
                        src={hero?.thumb ?? hero?.image}
                        name={ban.heroName}
                        size={80}
                        className="h-full w-full"
                        dimmed
                      />
                      <Ban size={14} className="absolute right-0.5 top-0.5 text-danger drop-shadow" />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-bodydark2">
                      <Ban size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
