'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, SectionCard } from '@/components/ui';
import { ErrorBox, HeroCard, HeroResultCard, RunButton, SourceBadge, useAiLang, useAiRun } from './shared';

interface CoachData {
  source: 'llm' | 'heuristic';
  summary: string;
  tips: { title: string; detail: string; priority: 'high' | 'medium' | 'low' }[];
  heroes: HeroCard[];
}

const PRIORITY_VARIANT: Record<string, string> = { high: 'red', medium: 'gold', low: 'blue' };

export default function CoachTab() {
  const t = useT();
  const lang = useAiLang();
  const fetcher = useCallback(() => api.ai.coach(lang) as Promise<CoachData>, [lang]);
  const { data, loading, errorKey, run } = useAiRun(fetcher);

  return (
    <div className="space-y-6">
      <SectionCard className="space-y-4">
        <p className="text-sm text-body dark:text-bodydark">{t('ai.coach.intro')}</p>
        <RunButton onClick={run} loading={loading} hasResult={!!data} labelKey="ai.coach.cta" />
        <ErrorBox errorKey={errorKey} />
      </SectionCard>

      {data && (
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <SectionCard className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-black dark:text-white">{t('ai.tab.coach')}</h3>
              <SourceBadge source={data.source} />
            </div>
            <p className="text-sm leading-relaxed text-body dark:text-bodydark">{data.summary}</p>
          </SectionCard>

          {data.tips.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold text-black dark:text-white">{t('ai.coach.tips')}</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.tips.map((tip, i) => (
                  <SectionCard key={i} className="flex gap-3 !p-4">
                    <Lightbulb size={18} className="mt-0.5 shrink-0 text-primary" />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-black dark:text-white">{tip.title}</p>
                        <Badge variant={PRIORITY_VARIANT[tip.priority]} size="sm">
                          {t(`ai.priority.${tip.priority}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-body dark:text-bodydark">{tip.detail}</p>
                    </div>
                  </SectionCard>
                ))}
              </div>
            </div>
          )}

          {data.heroes.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold text-black dark:text-white">{t('ai.coach.focusHeroes')}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.heroes.map((h) => (
                  <HeroResultCard key={h.id} hero={h} scoreLabel={t('ai.confidence')} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
