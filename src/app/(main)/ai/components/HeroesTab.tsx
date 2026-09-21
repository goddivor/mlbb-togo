'use client';

import { useCallback, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { fadeUp, still } from '@/lib/motion';
import { Button, Card } from '@/components/ui';
import RoleIcon from '@/components/game/RoleIcon';
import { ErrorBox, HeroCard, HeroResultCard, RunButton, SourceBadge, useAiLang, useAiRun } from './shared';

interface RecData {
  source: 'llm' | 'heuristic';
  filters: { role: string | null; lane: string | null };
  heroes: HeroCard[];
}

const ROLES = ['tank', 'fighter', 'assassin', 'mage', 'marksman', 'support'];
const LANES = ['gold', 'exp', 'jungle', 'mid', 'roam'];

export default function HeroesTab() {
  const t = useT();
  const reduce = useReducedMotion();
  const lang = useAiLang();
  const [role, setRole] = useState('');
  const [lane, setLane] = useState('');
  const fetcher = useCallback(
    () => api.ai.recommendHeroes({ role: role || undefined, lane: lane || undefined }, lang) as Promise<RecData>,
    [role, lane, lang],
  );
  const { data, loading, errorKey, run } = useAiRun(fetcher);

  const chips = (label: string, values: string[], current: string, set: (v: string) => void, icon: boolean) => (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant={current === '' ? 'primary' : 'outline'} onClick={() => set('')}>
          {t('ai.heroes.any')}
        </Button>
        {values.map((v) => (
          <Button key={v} size="sm" variant={current === v ? 'primary' : 'outline'} onClick={() => set(v)} className="gap-1">
            {icon && <RoleIcon role={v} size={14} />}
            {t(icon ? `role.${v}` : `lane.${v}`)}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <p className="text-sm text-ink-2">{t('ai.heroes.intro')}</p>
        {chips(t('ai.heroes.role'), ROLES, role, setRole, true)}
        {chips(t('ai.heroes.lane'), LANES, lane, setLane, false)}
        <RunButton onClick={run} loading={loading} hasResult={!!data} labelKey="ai.heroes.cta" />
        <ErrorBox errorKey={errorKey} />
      </Card>

      {data && (
        <motion.div className="space-y-3" variants={reduce ? still : fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink-1">{t('ai.heroes.results')}</h3>
            <SourceBadge source={data.source} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {data.heroes.map((h) => (
              <HeroResultCard key={h.id} hero={h} scoreLabel={t('ai.confidence')} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
