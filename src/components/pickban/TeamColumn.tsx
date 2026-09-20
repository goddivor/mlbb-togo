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

  // Team colour vocabulary: blue = cyan accent, red = red accent.
  const tone = isBlue ? 'text-accent-cyan' : 'text-accent-red';
  const edge = isBlue ? 'bg-accent-cyan' : 'bg-accent-red';
  const ring = isBlue ? 'ring-accent-cyan/60' : 'ring-accent-red/60';
  const nextBorder = isBlue ? 'border-accent-cyan' : 'border-accent-red';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-line-subtle bg-surface-1 shadow-elev-1 transition-shadow duration-base dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1',
        active && cn('ring-2', ring, isBlue ? 'shadow-glow-cyan' : '')
      )}
    >
      {/* Team colour edge */}
      <span aria-hidden="true" className={cn('absolute inset-y-0 w-1', isBlue ? 'left-0' : 'right-0', edge)} />

      <div className={cn('flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-4 py-3', isBlue ? 'pl-5' : 'pr-5 flex-row-reverse text-right')}>
        <div>
          <p className={cn('whitespace-nowrap font-display text-base font-bold uppercase tracking-tight2', tone)}>
            {t(isBlue ? 'pickban.blue' : 'pickban.red')}
          </p>
          {active && activeStep && (
            <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
              {t(`pickban.${activeStep.action}`)}
            </p>
          )}
        </div>
        <p className="shrink-0 whitespace-nowrap text-xs font-semibold num text-ink-2">
          {state.picks.length}/{PICKS_PER_TEAM}
          <span className="mx-1 text-ink-3">·</span>
          <Ban size={11} className="mr-0.5 inline -mt-0.5 text-ink-3" aria-hidden="true" />
          {state.bans.length}/{BANS_PER_TEAM[mode]}
        </p>
      </div>

      <div className={cn('space-y-4 p-3', isBlue ? 'pl-4' : 'pr-4')}>
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('pickban.picks')}</p>
          <ul className="space-y-1.5">
            {pickSlots.map((pick, i) => {
              const hero = pick ? heroes.get(pick.heroId) : null;
              const isNext = active && activeStep?.action === 'pick' && i === state.picks.length;
              return (
                <li
                  key={i}
                  className={cn(
                    'flex items-center gap-2.5 rounded border px-2 py-1.5 transition-colors duration-fast',
                    pick ? 'border-line-subtle bg-surface-2/70' : 'border-dashed border-line-subtle',
                    isNext && cn(nextBorder, 'bg-surface-2/40'),
                    !isBlue && 'flex-row-reverse text-right'
                  )}
                >
                  <HeroThumb
                    src={hero?.thumb ?? hero?.image}
                    name={pick?.heroName ?? '?'}
                    size={80}
                    className={cn('h-10 w-10 shrink-0 rounded cut-corners-sm', !pick && 'opacity-40')}
                  />
                  <div className="min-w-0 flex-1">
                    {pick ? (
                      <>
                        <p className="truncate text-sm font-semibold text-ink-1">{pick.heroName}</p>
                        <p className={cn('flex items-center gap-1 text-xs text-ink-2', !isBlue && 'flex-row-reverse')}>
                          {pick.lane && <RoleIcon role={pick.lane} size={12} />}
                          {laneLabel(pick.lane)}
                        </p>
                      </>
                    ) : (
                      <p className={cn('text-xs', isNext ? tone : 'text-ink-3')}>
                        {isNext ? t('pickban.pick') : t('pickban.emptySlot')}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('pickban.bans')}</p>
          <div className={cn('flex flex-wrap gap-1.5', !isBlue && 'justify-end')}>
            {banSlots.map((ban, i) => {
              const hero = ban ? heroes.get(ban.heroId) : null;
              const isNext = active && activeStep?.action === 'ban' && i === state.bans.length;
              return (
                <div
                  key={i}
                  title={ban?.heroName}
                  className={cn(
                    'relative h-11 w-11 overflow-hidden rounded cut-corners-sm border transition-colors duration-fast',
                    ban ? 'border-line-subtle' : 'border-dashed border-line-subtle',
                    isNext && nextBorder
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
                      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-accent-red/20">
                        <Ban size={16} className="text-accent-red drop-shadow" />
                      </span>
                    </>
                  ) : (
                    <div className={cn('flex h-full w-full items-center justify-center', isNext ? tone : 'text-ink-3')}>
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
