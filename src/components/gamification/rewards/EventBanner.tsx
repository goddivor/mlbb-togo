'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Gift } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { ProgressBar } from '@/components/ui';
import { getFrame } from '@/components/game/frames';
import FrameThumb from './FrameThumb';
import { localName, useNow } from './shared';

export interface PlayerEventCondition {
  type: string;
  count: number;
  scope: string | null;
  progress: number;
}

export interface PlayerEvent {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  conditionMode: 'all' | 'any';
  conditions: PlayerEventCondition[];
  rewards: { achievementId: string | null; frameId: string | null; frameDays: number | null; xp: number };
  completed: boolean;
}

const DAY = 86_400_000;

/** Active reward events (RewardEvent windows) with the player's progress. */
export default function EventBanner() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const now = useNow();
  const [events, setEvents] = useState<PlayerEvent[]>([]);

  useEffect(() => {
    let alive = true;
    api.rewards
      .myEvents()
      .then((list: any) => {
        if (alive) setEvents(Array.isArray(list) ? list : []);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const live = events.filter((e) => new Date(e.endsAt).getTime() > now);
  if (!live.length) return null;

  const endsIn = (endsAt: string) => {
    const ms = new Date(endsAt).getTime() - now;
    if (ms >= DAY) return t('rewards.event.endsInDays', { n: Math.ceil(ms / DAY) });
    return t('rewards.event.endsInHours', { n: Math.max(1, Math.ceil(ms / 3_600_000)) });
  };

  return (
    <div className="space-y-3">
      {live.map((e) => {
        const frame = e.rewards?.frameId ? getFrame(e.rewards.frameId) : null;
        return (
          <section
            key={e.id}
            aria-label={t('rewards.event.aria', { name: e.name })}
            className={cn(
              'relative overflow-hidden rounded-lg border p-4 sm:p-5',
              e.completed ? 'border-accent-green/40 bg-accent-green/5' : 'border-accent-violet/40 bg-accent-violet/5',
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-accent-violet">
                  <CalendarClock size={13} aria-hidden="true" />
                  {t('rewards.event.current')}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-ink-1">{e.name}</h3>
                <p className="text-sm text-ink-2">{endsIn(e.endsAt)}</p>
                {e.description && <p className="mt-1 text-sm text-ink-3">{e.description}</p>}

                <ul className="mt-3 space-y-2.5">
                  {e.conditions.map((c, i) => {
                    const count = Math.max(1, c.count || 1);
                    const value = Math.min(count, c.progress ?? 0);
                    const single = c.type === 'account_created_before';
                    return (
                      <li key={`${c.type}-${i}`}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                          <span className="text-ink-2">
                            {i > 0 && e.conditionMode === 'any' && (
                              <span className="mr-1 font-semibold uppercase text-ink-3">{t('rewards.event.or')}</span>
                            )}
                            {t(`rewards.event.cond.${c.type}`)}
                          </span>
                          <span className="num font-semibold text-ink-1">
                            {single
                              ? value >= count
                                ? t('rewards.event.met')
                                : t('rewards.event.notMet')
                              : t('rewards.event.progress', { value, count })}
                          </span>
                        </div>
                        <ProgressBar value={value} max={count} accent={value >= count ? 'green' : 'violet'} />
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-md border border-line-subtle bg-surface-1 p-3 sm:w-60">
                {frame ? (
                  <FrameThumb frame={e.rewards.frameId} size={56} label={localName(frame.name, lang)} />
                ) : (
                  <Gift size={28} className="text-accent-gold" aria-hidden="true" />
                )}
                <div className="min-w-0 text-xs">
                  <p className="font-semibold uppercase tracking-eyebrow text-ink-3">{t('rewards.event.reward')}</p>
                  {e.rewards?.achievementId && (
                    <p className="truncate font-semibold text-ink-1">{t(`achievement.${e.rewards.achievementId}`)}</p>
                  )}
                  {frame && (
                    <p className="truncate text-ink-2">
                      {localName(frame.name, lang)}
                      {e.rewards.frameDays ? ` · ${t('rewards.event.frameDays', { n: e.rewards.frameDays })}` : ''}
                    </p>
                  )}
                  {e.rewards?.xp > 0 && <p className="num font-semibold text-accent-gold">+{e.rewards.xp} XP</p>}
                  {e.completed && (
                    <p className="mt-1 inline-flex items-center gap-1 font-semibold text-accent-green">
                      <CheckCircle2 size={13} aria-hidden="true" />
                      {t('rewards.event.completed')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
