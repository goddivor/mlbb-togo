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
    <div className="rounded-sm border border-warning/40 bg-white p-3 shadow-default dark:bg-boxdark sm:p-4">
      <div className="mb-1 flex items-center gap-2">
        <Lightbulb size={18} className="text-warning" />
        <h4 className="font-semibold text-black dark:text-white">{t('pickban.suggestions')}</h4>
        {data && (
          <Badge size="sm" variant={data.action === 'ban' ? 'red' : 'blue'}>
            {t(`pickban.${data.action}`)} · {t(data.team === 'blue' ? 'pickban.teamBlue' : 'pickban.teamRed')}
          </Badge>
        )}
      </div>
      <p className="mb-3 text-xs text-body dark:text-bodydark">{t('pickban.suggestionsHint')}</p>

      {data && !data.metaAvailable && (
        <p className="mb-3 flex items-start gap-1.5 rounded-sm bg-warning/10 px-2.5 py-1.5 text-xs text-warning">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {t('pickban.metaUnavailable')}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-body dark:text-bodydark">
          <SpinLoader />
          {t('pickban.suggestionsLoading')}
        </div>
      ) : items.length === 0 ? (
        <p className="py-4 text-sm text-body dark:text-bodydark">{t('pickban.suggestionsNone')}</p>
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
                  className="flex w-full items-center gap-2.5 rounded-sm border border-stroke bg-gray-2 p-1.5 text-left transition-colors hover:border-warning disabled:cursor-not-allowed disabled:opacity-60 dark:border-strokedark dark:bg-meta-4"
                >
                  <span className="w-4 text-center text-xs font-bold text-body dark:text-bodydark">{i + 1}</span>
                  <HeroThumb
                    src={s.thumb ?? s.image ?? hero?.thumb}
                    name={s.heroName}
                    size={80}
                    className="h-10 w-10 shrink-0 rounded-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-semibold text-black dark:text-white">
                      <RoleIcon role={s.role} size={12} />
                      {s.heroName}
                    </p>
                    <p className="truncate text-xs text-body dark:text-bodydark" title={describe(s)}>
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
