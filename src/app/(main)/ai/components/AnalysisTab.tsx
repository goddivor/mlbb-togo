'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, SectionCard, StatCard } from '@/components/ui';
import { ErrorBox, RunButton, SourceBadge, useAiLang, useAiRun } from './shared';

interface Point {
  category: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}
interface AnalysisData {
  source: 'llm' | 'heuristic';
  stats: { games: number; winRate: number; mvpRate: number; streak: number; rank: string; role: string };
  strengths: Point[];
  weaknesses: Point[];
  recommendations: string[];
}

const IMPACT_VARIANT: Record<string, string> = { high: 'red', medium: 'gold', low: 'blue' };

export default function AnalysisTab() {
  const t = useT();
  const lang = useAiLang();
  const fetcher = useCallback(() => api.ai.analyze(lang) as Promise<AnalysisData>, [lang]);
  const { data, loading, errorKey, run } = useAiRun(fetcher);

  const list = (title: string, icon: React.ReactNode, points: Point[]) =>
    points.length > 0 && (
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-black dark:text-white">
          {icon} {title}
        </h3>
        <div className="space-y-3">
          {points.map((p, i) => (
            <SectionCard key={i} className="flex items-start justify-between gap-3 !p-4">
              <div className="min-w-0">
                <p className="font-semibold text-black dark:text-white">{p.category}</p>
                <p className="text-sm text-body dark:text-bodydark">{p.description}</p>
              </div>
              <Badge variant={IMPACT_VARIANT[p.impact]} size="sm" className="shrink-0">
                {t(`ai.impact.${p.impact}`)}
              </Badge>
            </SectionCard>
          ))}
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <SectionCard className="space-y-4">
        <p className="text-sm text-body dark:text-bodydark">{t('ai.analysis.intro')}</p>
        <RunButton onClick={run} loading={loading} hasResult={!!data} labelKey="ai.analysis.cta" />
        <ErrorBox errorKey={errorKey} />
      </SectionCard>

      {data && (
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-end">
            <SourceBadge source={data.source} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label={t('ai.analysis.games')} value={data.stats.games} />
            <StatCard label={t('ai.analysis.winRate')} value={`${data.stats.winRate}%`} />
            <StatCard label={t('ai.analysis.mvpRate')} value={`${data.stats.mvpRate}%`} />
            <StatCard label={t('ai.analysis.streak')} value={data.stats.streak} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {list(t('ai.analysis.strengths'), <TrendingUp size={18} className="text-success" />, data.strengths)}
            {list(t('ai.analysis.weaknesses'), <TrendingDown size={18} className="text-danger" />, data.weaknesses)}
          </div>
          {data.recommendations.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold text-black dark:text-white">{t('ai.analysis.recommendations')}</h3>
              <div className="space-y-2">
                {data.recommendations.map((r, i) => (
                  <SectionCard key={i} className="flex items-start gap-2 !p-4">
                    <ArrowRight size={16} className="mt-0.5 shrink-0 text-primary" />
                    <p className="text-sm text-body dark:text-bodydark">{r}</p>
                  </SectionCard>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
