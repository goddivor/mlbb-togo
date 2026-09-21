'use client';

import { Check, Lock } from 'lucide-react';
import { Card, SectionTitle, SpinLoader } from '@/components/ui';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { useAuthStore, useLangStore } from '@/store/useStore';
import PlayerTitle from '@/components/gamification/PlayerTitle';
import { titleLabel } from '@/components/gamification/titles';
import { localName, type Collection } from './shared';

/** Level titles selector (Progression > Titles): "No title" is the default choice. */
export default function TitlesPanel({
  data,
  pending,
  onEquip,
}: {
  data: Collection;
  pending: string | null;
  onEquip: (id: string | null) => void;
}) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const profile = useAuthStore((s: any) => s.userProfile || s.user);
  const name = profile?.displayName || profile?.gameNickname || profile?.username || '?';
  const unlocked = data.titles.filter((x) => x.unlocked).length;
  const busy = !!pending;

  const options = [
    { id: null as string | null, label: t('rewards.titles.none'), hint: t('rewards.titles.noneDesc'), unlocked: true },
    ...data.titles.map((x) => ({
      id: x.id as string | null,
      label: titleLabel(x.id, lang) ?? localName(x.name, lang),
      hint: t('frames.level', { n: x.level }),
      unlocked: x.unlocked,
    })),
  ];

  return (
    <Card>
      <SectionTitle
        eyebrow={t('rewards.titles.eyebrow')}
        title={t('rewards.titles.count', { unlocked, total: data.titles.length })}
        description={t('rewards.titles.desc')}
        className="mb-5"
      />

      <div className="mb-6 rounded-lg border border-line-subtle bg-surface-2/50 px-4 py-3">
        <p className="eyebrow mb-1">{t('rewards.titles.preview')}</p>
        <p className="font-display text-lg font-bold text-ink-1">{name}</p>
        {data.equippedTitle ? (
          <PlayerTitle id={data.equippedTitle} className="block" />
        ) : (
          <p className="text-xs text-ink-3">{t('rewards.titles.noneDesc')}</p>
        )}
      </div>

      <div role="radiogroup" aria-label={t('rewards.titles.eyebrow')} className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((o) => {
          const selected = (data.equippedTitle ?? null) === o.id;
          const loading = pending === `title:${o.id ?? ''}`;
          return (
            <button
              key={o.id ?? 'none'}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!o.unlocked || busy}
              onClick={() => !selected && onEquip(o.id)}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-fast disabled:cursor-not-allowed',
                selected
                  ? 'border-primary/60 bg-primary/5 ring-1 ring-inset ring-primary/30'
                  : o.unlocked
                    ? 'border-line-subtle hover:border-primary/40 hover:bg-surface-2'
                    : 'border-line-subtle opacity-60',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
                  selected ? 'border-primary bg-primary text-on-primary' : 'border-line-strong text-ink-3',
                )}
              >
                {loading ? <SpinLoader /> : selected ? <Check size={14} /> : !o.unlocked ? <Lock size={13} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block truncate text-sm font-semibold', o.id ? 'italic text-ink-1' : 'text-ink-1')}>{o.label}</span>
                <span className="block text-[11px] text-ink-3 num">{o.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
