'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { SectionCard } from '@/components/ui';
import HeroPicker, { useHeroCatalog } from './HeroPicker';
import { ErrorBox, HeroCard, HeroResultCard, RunButton, SourceBadge, useAiLang, useAiRun } from './shared';

interface CounterData {
  source: 'llm' | 'heuristic';
  metaAvailable: boolean;
  enemies: { id: string; name: string; role: string }[];
  counters: HeroCard[];
}

/** `initialEnemy` = hero name preselected from the hero detail modal (`?enemy=`). */
export default function CounterTab({ initialEnemy }: { initialEnemy?: string | null }) {
  const t = useT();
  const lang = useAiLang();
  const { heroes, loading: catalogLoading } = useHeroCatalog();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!initialEnemy || !heroes.length) return;
    const h = heroes.find((x) => x.name.toLowerCase() === initialEnemy.toLowerCase());
    if (h) setSelected((cur) => (cur.includes(h.id) ? cur : [h.id, ...cur].slice(0, 5)));
  }, [initialEnemy, heroes]);

  const fetcher = useCallback(() => api.ai.counterPicks(selected, lang) as Promise<CounterData>, [selected, lang]);
  const { data, loading, errorKey, run } = useAiRun(fetcher);

  return (
    <div className="space-y-6">
      <SectionCard className="space-y-4">
        <p className="text-sm text-body dark:text-bodydark">{t('ai.counter.intro')}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">{t('ai.counter.enemies')}</p>
        <HeroPicker heroes={heroes} loading={catalogLoading} selected={selected} onChange={setSelected} max={5} />
        <RunButton onClick={run} loading={loading} hasResult={!!data} labelKey="ai.counter.cta" disabled={selected.length === 0} />
        <ErrorBox errorKey={errorKey} />
      </SectionCard>

      {data && (
        <motion.div className="space-y-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-black dark:text-white">
              {t('ai.counter.results')}{' '}
              <span className="font-normal text-body dark:text-bodydark">
                ({t('ai.counter.against')} {data.enemies.map((e) => e.name).join(', ')})
              </span>
            </h3>
            <SourceBadge source={data.source} />
          </div>
          {!data.metaAvailable && (
            <p className="flex items-center gap-1 text-xs text-warning">
              <AlertTriangle size={12} /> {t('ai.counter.metaMissing')}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {data.counters.map((h) => (
              <HeroResultCard key={h.id} hero={h} scoreLabel={t('ai.effectiveness')} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
