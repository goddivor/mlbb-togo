'use client';

import { Lightbulb, AlertTriangle } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { Badge, SpinLoader } from '@/components/ui';
import RoleIcon from '@/components/game/RoleIcon';
import HeroThumb from './HeroThumb';
import type { HeroSuggestion, PickBanHero, SuggestResponse, SuggestionReason } from '@/lib/pickban';

export default function SuggestionsPanel({
  data,
  loading,
  disabled,
  heroes,
  onSelect,
}: {
  data: SuggestResponse | null;
  loading: boolean;
  disabled: boolean;
  heroes: Map<string, PickBanHero>;
  onSelect: (hero: PickBanHero) => void;
}) {
  const t = useT();
  const items: HeroSuggestion[] = data?.suggestions ?? [];

  // Localized reason built from the structured parts; falls back to the API text.
  const describe = (s: HeroSuggestion): string => {
    const parts = (s.reasons ?? []).map((r: SuggestionReason) =>
      t(`pickban.reason.${r.kind}`, {
        names: (r.names ?? []).join(', '),
        lane: r.lane ? t(`draft.role.${r.lane}`) : '',
        value: r.value != null ? (r.kind === 'banRate' ? Math.round(r.value) : r.value.toFixed(1)) : '',
      }),
    );
    if (parts.length) return parts.join(' · ');
    return s.reasons ? t('pickban.reason.default') : s.reason;
  };

  return (
    <div className="rounded-lg border border-accent-gold/40 bg-surface-1 p-3 shadow-elev-1 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1 sm:p-4">
      <div className="mb-1 flex items-center gap-2">
        <Lightbulb size={18} className="text-accent-gold" />
        <h4 className="font-display text-base font-bold tracking-tight2 text-ink-1">{t('pickban.suggestions')}</h4>
        {data && (
          <Badge size="sm" variant={data.action === 'ban' ? 'red' : 'blue'}>
            {t(`pickban.${data.action}`)} · {t(data.team === 'blue' ? 'pickban.teamBlue' : 'pickban.teamRed')}
          </Badge>
        )}
      </div>
      <p className="mb-3 text-xs text-ink-3">{t('pickban.suggestionsHint')}</p>

      {data && !data.metaAvailable && (
        <p className="mb-3 flex items-start gap-1.5 rounded bg-accent-gold/10 px-2.5 py-1.5 text-xs text-accent-gold">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {t('pickban.metaUnavailable')}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-ink-2">
          <SpinLoader />
          {t('pickban.suggestionsLoading')}
        </div>
      ) : items.length === 0 ? (
        <p className="py-4 text-sm text-ink-2">{t('pickban.suggestionsNone')}</p>
      ) : (
        <ol className="space-y-1.5">
          {items.map((s, i) => {
            const hero = heroes.get(s.heroId);
            return (
              <li key={s.heroId}>
                <button
                  type="button"
                  disabled={disabled || !hero}
                  onClick={() => hero && onSelect(hero)}
                  className="flex w-full items-center gap-2.5 rounded border border-line-subtle bg-surface-2/60 p-1.5 text-left transition-colors duration-fast hover:border-accent-gold/70 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <span className="w-4 text-center font-display text-xs font-bold num text-ink-3">{i + 1}</span>
                  <HeroThumb
                    src={s.thumb ?? s.image ?? hero?.thumb}
                    name={s.heroName}
                    size={80}
                    className="h-10 w-10 shrink-0 rounded cut-corners-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-semibold text-ink-1">
                      <RoleIcon role={s.role} size={12} />
                      {s.heroName}
                    </p>
                    <p className="truncate text-xs text-ink-2" title={describe(s)}>
                      {describe(s)}
                    </p>
                  </div>
                  <Badge size="sm" variant="gold" className="shrink-0" title={t('pickban.score')}>
                    {s.score}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
