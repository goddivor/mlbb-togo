'use client';

import { useMemo, useState } from 'react';
import { Check, History, Lock } from 'lucide-react';
import { Button, Card, EmptyState, ProgressBar, SectionTitle } from '@/components/ui';
import AvatarFrame from '@/components/game/AvatarFrame';
import {
  FRAME_TIERS,
  FRAME_TIER_COLORS,
  getFrame,
  resolveFrame,
  type FrameInfo,
  type FrameShape,
  type FrameTier,
} from '@/components/game/frames';
import PlayerTitle from '@/components/gamification/PlayerTitle';
import { avatarSrc } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { useAuthStore, useLangStore } from '@/store/useStore';
import {
  CountdownPill,
  Segmented,
  countdownLabel,
  fmtDate,
  frameLabel,
  unlockHint,
  useNow,
  type Collection,
  type CollectionFrame,
  type FrameEntry,
} from './shared';

type OwnFilter = 'owned' | 'locked' | 'all';
type ShapeFilter = 'all' | FrameShape;

interface Item {
  def: CollectionFrame;
  info: FrameInfo;
  entry: FrameEntry | null;
  key: string;
}

/** Player collection of avatar frames (Progression > Collection). */
export default function FrameCollection({
  data,
  pending,
  onEquip,
}: {
  data: Collection;
  pending: string | null;
  onEquip: (key: string | null) => void;
}) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const profile = useAuthStore((s: any) => s.userProfile || s.user);
  const now = useNow();
  const [own, setOwn] = useState<OwnFilter>('all');
  const [shape, setShape] = useState<ShapeFilter>('all');

  const name = profile?.displayName || profile?.gameNickname || profile?.username || '?';
  const src = profile?.avatar ? avatarSrc(profile.avatar, 256) : null;
  const rank = profile?.gameRank ?? null;

  const { items, expired, ownedCount } = useMemo(() => {
    const items: Item[] = [];
    const expired: Item[] = [];
    for (const def of data.frames) {
      const info = getFrame(def.id);
      if (!info) continue;
      const active = def.entries.filter((e) => e.active);
      for (const e of active) items.push({ def, info, entry: e, key: e.key });
      // Frames only held in the past live in the "Expired" section.
      if (!def.entries.length) items.push({ def, info, entry: null, key: def.id });
      for (const e of def.entries.filter((x) => !x.active)) expired.push({ def, info, entry: e, key: e.key });
    }
    return { items, expired, ownedCount: data.frames.filter((f) => f.owned).length };
  }, [data.frames]);

  const groups = useMemo(() => {
    const visible = items.filter(
      (i) =>
        (own === 'all' || (own === 'owned' ? !!i.entry : !i.entry)) && (shape === 'all' || i.def.shape === shape),
    );
    return FRAME_TIERS.map((tier) => ({
      tier,
      items: visible
        .filter((i) => i.info.tier === tier)
        .sort((a, b) => (a.def.level ?? 999) - (b.def.level ?? 999) || Number(!a.entry) - Number(!b.entry)),
    })).filter((g) => g.items.length > 0);
  }, [items, own, shape]);

  const equipped = resolveFrame(data.equippedFrame);
  const equippedEntry = equipped
    ? data.frames.find((f) => f.id === equipped.frame.id)?.entries.find((e) => e.key === data.equippedFrame)
    : undefined;
  const equippedCountdown = countdownLabel(t, equippedEntry?.expiresAt, now);
  const fallback = resolveFrame(data.fallbackFrame);
  const busy = !!pending;

  return (
    <div className="space-y-6">
      {/* Equipped preview */}
      <Card className="relative overflow-hidden">
        <span aria-hidden="true" className="absolute -right-8 -top-8 h-16 w-16 rotate-45 bg-primary/10" />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <AvatarFrame frame={data.equippedFrame} name={name} src={src} rank={rank} size={128} avatarSize={equipped ? undefined : 88} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="eyebrow mb-1">{t('rewards.collection.equipped')}</p>
            <p className="truncate font-display text-xl font-bold tracking-tight2 text-ink-1">
              {equipped ? frameLabel(t, equipped.frame.name, lang, equipped.variant) : t('rewards.collection.rankFrame')}
            </p>
            <p className="mt-0.5 truncate text-sm text-ink-2">{name}</p>
            <PlayerTitle id={data.equippedTitle} className="block" />
            {equippedCountdown && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <CountdownPill label={equippedCountdown} />
                <span className="text-xs text-ink-3">
                  {fallback
                    ? t('rewards.collection.fallbackTo', { name: frameLabel(t, fallback.frame.name, lang, fallback.variant) })
                    : t('rewards.collection.fallbackRank')}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-end gap-6 rounded-lg border border-line-subtle bg-surface-2/50 px-5 py-4">
            <figure className="flex flex-col items-center gap-2">
              <AvatarFrame frame={data.equippedFrame} name={name} src={src} rank={rank} showBadge={false} avatarSize={28} />
              <figcaption className="text-[11px] text-ink-3">{t('rewards.collection.contextList')}</figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-2">
              <AvatarFrame frame={data.equippedFrame} name={name} src={src} rank={rank} size={64} avatarSize={equipped ? undefined : 44} />
              <figcaption className="text-[11px] text-ink-3">{t('rewards.collection.contextCard')}</figcaption>
            </figure>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle
          eyebrow={t('frames.title')}
          title={t('rewards.collection.count', { owned: ownedCount, total: data.frames.length })}
          description={t('rewards.collection.desc')}
          className="mb-5"
        />
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Segmented<OwnFilter>
            label={t('rewards.filter.label')}
            value={own}
            onChange={setOwn}
            options={[
              { id: 'owned', label: t('rewards.filter.owned') },
              { id: 'locked', label: t('rewards.filter.locked') },
              { id: 'all', label: t('rewards.filter.all') },
            ]}
          />
          <Segmented<ShapeFilter>
            label={t('frames.shape.label')}
            value={shape}
            onChange={setShape}
            options={(['all', 'circle', 'square'] as ShapeFilter[]).map((s) => ({ id: s, label: t(`frames.shape.${s}`) }))}
          />
        </div>

        <div className="space-y-8">
          {own !== 'locked' && (
            <section>
              <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-eyebrow text-ink-3">
                <span className="h-2 w-2 rounded-full bg-line-strong" aria-hidden="true" />
                {t('frames.noFrame')}
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                <Tile
                  active={!data.equippedFrame}
                  title={t('frames.noFrame')}
                  subtitle={t('rewards.collection.noFrameDesc')}
                  art={<AvatarFrame frame={null} name={name} src={src} rank={rank} avatarSize={60} />}
                  action={
                    <EquipButton
                      equipped={!data.equippedFrame}
                      loading={pending === 'frame:'}
                      disabled={busy}
                      onClick={() => onEquip(null)}
                      t={t}
                    />
                  }
                />
              </div>
            </section>
          )}

          {groups.length === 0 ? (
            <EmptyState icon={<Lock size={24} />} title={t('rewards.collection.none')} className="!min-h-0 py-10" />
          ) : (
            groups.map((g) => (
              <section key={g.tier}>
                <TierHeading tier={g.tier} count={g.items.length} t={t} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {g.items.map((item) => {
                    const owned = !!item.entry;
                    const isEquipped = owned && data.equippedFrame === item.key;
                    const label = frameLabel(t, item.def.name, lang, item.entry?.variant);
                    const countdown = owned ? countdownLabel(t, item.entry!.expiresAt, now) : null;
                    const untilChampion = owned && item.def.temporary && !item.entry!.expiresAt;
                    const hidden = !owned && item.def.secret;
                    return (
                      <Tile
                        key={item.key}
                        active={isEquipped}
                        locked={!owned}
                        badge={
                          countdown ? (
                            <CountdownPill label={countdown} />
                          ) : untilChampion ? (
                            <CountdownPill label={t('rewards.countdown.nextChampion')} />
                          ) : !owned && item.def.temporary ? (
                            <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-ink-3">{t('frames.temporary')}</span>
                          ) : null
                        }
                        title={hidden ? t('rewards.secretFrame') : label}
                        art={
                          hidden ? (
                            <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-dashed border-line-strong text-2xl font-bold text-ink-3">
                              ?
                            </span>
                          ) : (
                            <AvatarFrame frame={item.key} name={name} src={src} size={88} showBadge={false} />
                          )
                        }
                        subtitle={
                          owned
                            ? t('rewards.collection.unlockedOn', { date: fmtDate(item.entry!.unlockedAt, lang) })
                            : unlockHint(t, lang, item.def, item.info)
                        }
                        extra={
                          !owned && item.def.level ? (
                            <div className="w-full">
                              <ProgressBar
                                value={Math.min(data.level, item.def.level)}
                                max={item.def.level}
                                accent="violet"
                                className="h-1.5 w-full"
                                label={t('rewards.collection.levelProgress', { level: data.level, target: item.def.level })}
                              />
                              <p className="mt-1 text-[10px] text-ink-3 num">
                                {t('rewards.collection.levelProgress', { level: data.level, target: item.def.level })}
                              </p>
                            </div>
                          ) : countdown && !isEquipped ? (
                            <p className="text-[11px] leading-snug text-ink-3">{t('rewards.collection.tempNote')}</p>
                          ) : null
                        }
                        action={
                          owned ? (
                            <EquipButton
                              equipped={isEquipped}
                              loading={pending === `frame:${item.key}`}
                              disabled={busy}
                              onClick={() => onEquip(item.key)}
                              t={t}
                            />
                          ) : null
                        }
                      />
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </Card>

      {expired.length > 0 && own !== 'locked' && (
        <Card>
          <SectionTitle
            eyebrow={t('frames.temporary')}
            title={t('rewards.collection.expired')}
            description={t('rewards.collection.expiredDesc')}
            className="mb-5"
          />
          <ul className="grid gap-3 md:grid-cols-2">
            {expired.map((item) => (
              <li key={item.key} className="flex items-center gap-4 rounded-lg border border-line-subtle bg-surface-2/40 p-3">
                <span className="opacity-60 grayscale">
                  <AvatarFrame frame={item.key} name={name} src={src} size={56} showBadge={false} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-1">{frameLabel(t, item.def.name, lang, item.entry?.variant)}</p>
                  <ul className="mt-1 space-y-0.5">
                    {(item.entry?.history?.length ? item.entry.history : [{ from: item.entry!.unlockedAt, to: item.entry!.expiredAt }])
                      .slice(-3)
                      .map((p, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-ink-3 num">
                          <History size={11} aria-hidden="true" />
                          {t('rewards.collection.period', { from: fmtDate(p.from, lang), to: fmtDate(p.to || item.entry!.expiredAt, lang) })}
                        </li>
                      ))}
                  </ul>
                  {(item.entry?.timesGranted ?? 1) > 1 && (
                    <p className="mt-1 text-[11px] text-ink-3">{t('rewards.collection.times', { n: item.entry!.timesGranted })}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function TierHeading({ tier, count, t }: { tier: FrameTier; count: number; t: (k: string, p?: any) => string }) {
  return (
    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-eyebrow text-ink-2">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FRAME_TIER_COLORS[tier] }} aria-hidden="true" />
      {t(`frames.tier.${tier}`)}
      <span className="font-normal normal-case tracking-normal text-ink-3 num">· {count}</span>
    </h4>
  );
}

function Tile({
  art,
  title,
  subtitle,
  extra,
  action,
  badge,
  active = false,
  locked = false,
}: {
  art: React.ReactNode;
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  active?: boolean;
  locked?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative flex h-full flex-col items-center gap-2 rounded-lg border p-3 pt-4 text-center transition-colors duration-fast',
        active
          ? 'border-primary/60 bg-primary/5 ring-1 ring-inset ring-primary/30'
          : 'border-line-subtle bg-surface-1 hover:border-line-strong dark:bg-surface-2/40',
      )}
    >
      {badge && <span className="absolute right-2 top-2 z-10">{badge}</span>}
      <div className="relative flex h-[92px] items-center justify-center">
        <div className={cn(locked && 'opacity-45 brightness-75 grayscale')}>{art}</div>
        {locked && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-0/80 text-ink-1 ring-1 ring-line-strong backdrop-blur-sm">
              <Lock size={15} />
            </span>
          </span>
        )}
      </div>
      <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-ink-1">{title}</p>
      {subtitle && <p className="line-clamp-3 text-[11px] leading-snug text-ink-3">{subtitle}</p>}
      {extra}
      {action && <div className="mt-auto w-full pt-1">{action}</div>}
    </div>
  );
}

function EquipButton({
  equipped,
  loading,
  disabled,
  onClick,
  t,
}: {
  equipped: boolean;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  t: (k: string) => string;
}) {
  if (equipped) {
    return (
      <span className="inline-flex w-full items-center justify-center gap-1.5 rounded border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
        <Check size={14} />
        {t('rewards.equipped')}
      </span>
    );
  }
  return (
    <Button size="sm" variant="secondary" className="w-full" loading={loading} disabled={disabled} onClick={onClick}>
      {t('rewards.equip')}
    </Button>
  );
}
