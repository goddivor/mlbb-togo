'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Bot, Sparkles, Cpu, GraduationCap, Swords, Shield, Shuffle, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, PageHeader, Tabs } from '@/components/ui';
import { fadeUp, still } from '@/lib/motion';
import CoachTab from './components/CoachTab';
import HeroesTab from './components/HeroesTab';
import BuildTab from './components/BuildTab';
import CounterTab from './components/CounterTab';
import AnalysisTab from './components/AnalysisTab';

type TabId = 'coach' | 'heroes' | 'build' | 'counter' | 'analysis';
const TAB_IDS: TabId[] = ['coach', 'heroes', 'build', 'counter', 'analysis'];
const TAB_ICONS: Record<TabId, any> = {
  coach: GraduationCap,
  heroes: Swords,
  build: Shield,
  counter: Shuffle,
  analysis: BarChart3,
};

function AiPageInner() {
  const t = useT();
  const reduce = useReducedMotion();
  const router = useRouter();
  const params = useSearchParams();
  const paramTab = params.get('tab');
  const initialEnemy = params.get('enemy');
  const [tab, setTab] = useState<TabId>(TAB_IDS.includes(paramTab as TabId) ? (paramTab as TabId) : 'coach');
  const [status, setStatus] = useState<{ enabled: boolean; model: string } | null>(null);

  useEffect(() => {
    api.ai.status().then(setStatus).catch(() => setStatus({ enabled: false, model: 'unknown' }));
  }, []);

  const changeTab = (id: TabId) => {
    setTab(id);
    router.replace(id === 'coach' ? '/dashboard/ai' : `/dashboard/ai?tab=${id}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Bot size={20} />}
        eyebrow={t('ai.eyebrow')}
        title={t('ai.title')}
        subtitle={t('ai.subtitle')}
        variant="purple"
        action={
          status &&
          (status.enabled ? (
            // Badge has no title prop: the tooltip goes on a wrapping span.
            <span title={status.model}>
              <Badge variant="purple" className="whitespace-nowrap">
                <Sparkles size={14} /> {t('ai.badge.llm')}
              </Badge>
            </span>
          ) : (
            <span title={t('ai.heuristicNote')}>
              <Badge variant="gold" className="whitespace-nowrap">
                <Cpu size={14} /> {t('ai.badge.heuristic')}
              </Badge>
            </span>
          ))
        }
      />

      {status && !status.enabled && (
        <p className="flex items-start gap-2 rounded border border-accent-gold/40 bg-accent-gold/10 px-4 py-2.5 text-xs text-ink-1">
          <Cpu size={14} className="mt-0.5 shrink-0 text-accent-gold" />
          {t('ai.heuristicNote')}
        </p>
      )}

      <div className="overflow-x-auto whitespace-nowrap">
        <Tabs
          variant="underline"
          tabs={TAB_IDS.map((id) => ({ id, label: t(`ai.tab.${id}`), icon: TAB_ICONS[id] }))}
          active={tab}
          onChange={changeTab}
          className="min-w-max"
        />
      </div>

      <motion.div key={tab} variants={reduce ? still : fadeUp} initial="hidden" animate="visible">
        {tab === 'coach' && <CoachTab />}
        {tab === 'heroes' && <HeroesTab />}
        {tab === 'build' && <BuildTab />}
        {tab === 'counter' && <CounterTab initialEnemy={initialEnemy} />}
        {tab === 'analysis' && <AnalysisTab />}
      </motion.div>
    </div>
  );
}

export default function AiPage() {
  return (
    <Suspense fallback={null}>
      <AiPageInner />
    </Suspense>
  );
}
