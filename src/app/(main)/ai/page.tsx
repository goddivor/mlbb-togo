'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Cpu, GraduationCap, Swords, Shield, Shuffle, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, PageHeader, Tabs } from '@/components/ui';
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
    router.replace(id === 'coach' ? '/ai' : `/ai?tab=${id}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Bot size={28} className="text-white" />}
        title={t('ai.title')}
        subtitle={t('ai.subtitle')}
        action={
          status &&
          (status.enabled ? (
            <Badge variant="purple" className="whitespace-nowrap" title={status.model}>
              <Sparkles size={14} /> {t('ai.badge.llm')}
            </Badge>
          ) : (
            <Badge variant="gold" className="whitespace-nowrap" title={t('ai.heuristicNote')}>
              <Cpu size={14} /> {t('ai.badge.heuristic')}
            </Badge>
          ))
        }
      />

      {status && !status.enabled && (
        <p className="rounded-sm border border-warning/40 bg-warning/10 px-4 py-2 text-xs text-black dark:text-white">
          {t('ai.heuristicNote')}
        </p>
      )}

      <div className="overflow-x-auto">
        <Tabs
          tabs={TAB_IDS.map((id) => ({ id, label: t(`ai.tab.${id}`), icon: TAB_ICONS[id] }))}
          active={tab}
          onChange={changeTab}
        />
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
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
