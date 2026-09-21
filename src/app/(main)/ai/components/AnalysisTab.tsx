'use client';

import { useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { fadeUp, still } from '@/lib/motion';
import { Badge, Card, StatCard } from '@/components/ui';
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
  const reduce = useReducedMotion();
  const lang = useAiLang();
  const fetcher = useCallback(() => api.ai.analyze(lang) as Promise<AnalysisData>, [lang]);
  const { data, loading, errorKey, run } = useAiRun(fetcher);

  const list = (title: string, icon: React.ReactNode, points: Point[]) =>
    points.length > 0 && (
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-display text-base font-bold tracking-tight2 text-ink-1">
          {icon} {title}
        </h3>
        <div className="space-y-3">
          {points.map((p, i) => (
            <Card key={i} className="flex items-start justify-between gap-3 !p-4">
              <div className="min-w-0">
                <p className="font-semibold text-ink-1">{p.category}</p>
                <p className="text-sm text-ink-2">{p.description}</p>
              </div>
              <Badge variant={IMPACT_VARIANT[p.impact]} size="sm" className="shrink-0">
                {t(`ai.impact.${p.impact}`)}
              </Badge>
            </Card>
          ))}
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <p className="text-sm text-ink-2">{t('ai.analysis.intro')}</p>
        <RunButton onClick={run} loading={loading} hasResult={!!data} labelKey="ai.analysis.cta" />
        <ErrorBox errorKey={errorKey} />
      </Card>

      {data && (
        <motion.div className="space-y-6" variants={reduce ? still : fadeUp} initial="hidden" animate="visible">
          <div className="flex justify-end">
            <SourceBadge source={data.source} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label={t('ai.analysis.games')} value={data.stats.games} accent="cyan" />
            <StatCard label={t('ai.analysis.winRate')} value={`${data.stats.winRate}%`} accent="green" />
            <StatCard label={t('ai.analysis.mvpRate')} value={`${data.stats.mvpRate}%`} accent="gold" />
            <StatCard label={t('ai.analysis.streak')} value={data.stats.streak} accent="violet" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {list(t('ai.analysis.strengths'), <TrendingUp size={18} className="text-accent-green" />, data.strengths)}
            {list(t('ai.analysis.weaknesses'), <TrendingDown size={18} className="text-accent-red" />, data.weaknesses)}
          </div>
          {data.recommendations.length > 0 && (
            <div>
              <h3 className="mb-3 font-display text-base font-bold tracking-tight2 text-ink-1">{t('ai.analysis.recommendations')}</h3>
              <div className="space-y-2">
                {data.recommendations.map((r, i) => (
                  <Card key={i} className="flex items-start gap-2 !p-4">
                    <ArrowRight size={16} className="mt-0.5 shrink-0 text-primary" />
                    <p className="text-sm text-ink-2">{r}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
