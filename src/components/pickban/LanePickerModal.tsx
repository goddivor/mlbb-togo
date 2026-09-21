'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui';
import RoleIcon from '@/components/game/RoleIcon';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import HeroThumb from './HeroThumb';
import { LANES, type PickBanHero } from '@/lib/pickban';

// Asks for the lane of a picked hero. Defaults to the hero's recommended lane.
export default function LanePickerModal({
  hero,
  taken,
  onClose,
  onConfirm,
}: {
  hero: PickBanHero | null;
  taken: Set<string>; // lanes already covered by the picking team
  onClose: () => void;
  onConfirm: (lane: string) => void;
}) {
  const t = useT();
  const [lane, setLane] = useState<string>('');

  useEffect(() => {
    if (!hero) return;
    const preferred = (hero.laneKeys ?? []).find((l) => !taken.has(l)) ?? hero.laneKeys?.[0];
    setLane(preferred ?? LANES.find((l) => !taken.has(l)) ?? 'gold');
  }, [hero, taken]);

  return (
    <Modal
      open={!!hero}
      onClose={onClose}
      size="sm"
      title={hero ? t('pickban.chooseLane', { hero: hero.name }) : ''}
      closeLabel={t('common.cancel')}
    >
      {hero && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <HeroThumb
              src={hero.thumb ?? hero.image}
              name={hero.name}
              size={128}
              className="h-16 w-16 rounded cut-corners-sm ring-1 ring-inset ring-line-subtle"
            />
            <div>
              <p className="font-display text-lg font-bold tracking-tight2 text-ink-1">{hero.name}</p>
              <p className="flex items-center gap-1.5 text-sm capitalize text-ink-2">
                <RoleIcon role={hero.role} size={14} />
                {hero.role}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LANES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLane(l)}
                className={cn(
                  'flex items-center gap-2 rounded border px-3 py-2 text-sm font-medium transition-colors duration-fast',
                  lane === l
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-line-subtle bg-surface-2/60 text-ink-2 hover:border-line-strong hover:text-ink-1',
                  taken.has(l) && lane !== l && 'opacity-50',
                )}
              >
                <RoleIcon role={l} size={16} />
                {t(`draft.role.${l}`)}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => onConfirm(lane)}>{t('pickban.confirmPick')}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
