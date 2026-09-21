'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Award, Gem, History, Sparkles, Tag, Target, Trophy, Zap } from 'lucide-react';
import {
  Button,
  Card,
  LoadingSpinner,
  PageHeader,
  EmptyState,
  StatCard,
  StatRing,
  Tabs,
  SectionTitle,
  Skeleton,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useAuthStore } from '@/store/useStore';
import { fadeUp, stagger, still } from '@/lib/motion';
import XpBar from '@/components/gamification/XpBar';
import AchievementsGrid from '@/components/gamification/AchievementsGrid';
import MissionsPanel from '@/components/gamification/MissionsPanel';
import XpHistory from '@/components/gamification/XpHistory';
import XpLeaderboard from '@/components/gamification/XpLeaderboard';
import FrameCollection from '@/components/gamification/rewards/FrameCollection';
import TitlesPanel from '@/components/gamification/rewards/TitlesPanel';
import { useRewardsCollection } from '@/components/gamification/rewards/useRewardsCollection';

const XP_RULE_TYPES = [
  'match_played',
  'match_win',
  'match_mvp',
  'tournament_registration',
  'daily_login',
  'forum_post',
  'friend_added',
];

type Tab = 'missions' | 'achievements' | 'collection' | 'titles' | 'history' | 'leaderboard';
const TABS: Tab[] = ['missions', 'achievements', 'collection', 'titles', 'history', 'leaderboard'];

function ProgressSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="px-6 py-5">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="mt-4 h-8 w-1/2" />
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton lines={4} />
      </Card>
    </div>
  );
}

export default function ProgressPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const user = useAuthStore((s: any) => s.user);
  const [data, setData] = useState<any>(null);
  const [board, setBoard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('missions');
  const rewards = useRewardsCollection(tab === 'collection' || tab === 'titles', t('common.error'));

  // Deep link from the frame notifications: /progress?tab=collection
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('tab') as Tab | null;
    if (wanted && TABS.includes(wanted)) setTab(wanted);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [me, lb] = await Promise.all([api.gamification.me(), api.gamification.leaderboard(10)]);
        if (!alive) return;
        setData(me);
        setBoard(Array.isArray(lb?.entries) ? lb.entries : []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const header = (
    <PageHeader
      icon={<Sparkles size={22} />}
      eyebrow={t('progress.eyebrow')}
      title={t('progress.title')}
      subtitle={t('progress.subtitle')}
      variant="purple"
    />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <ProgressSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState icon={<Sparkles size={26} />} title={t('progress.loadError')} />
      </div>
    );
  }

  const achievements: any[] = data.achievements ?? [];
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const missions: any[] = data.missions ?? [];
  const missionsDone = missions.filter((m) => m.completed).length;
  const rules: Record<string, number> = data.xpRules ?? {};
  const percent = Math.max(0, Math.min(100, Number(data.percent ?? 0)));
  const xpNumber = Number(data.xp ?? 0);

  const tabs = [
    { id: 'missions', label: t('progress.missions'), icon: Target, count: missions.length },
    { id: 'achievements', label: t('progress.achievements'), icon: Award, count: achievements.length },
    { id: 'collection', label: t('rewards.tab.collection'), icon: Gem },
    { id: 'titles', label: t('rewards.tab.titles'), icon: Tag },
    { id: 'history', label: t('progress.history'), icon: History },
    { id: 'leaderboard', label: t('progress.leaderboard'), icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      {header}

      <motion.div
        variants={reduce ? still : stagger(0.05)}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <motion.div variants={reduce ? still : fadeUp} className="h-full">
          <StatCard
            label={t('progress.level')}
            value={data.level}
            hint={data.nextLevelXp === null ? t('progress.maxLevel') : t('progress.kpi.nextLevel', { level: data.level + 1 })}
            icon={<Sparkles size={18} />}
            accent="violet"
            className="h-full"
            sparkline={
              <StatRing value={percent} max={100} size={52} stroke={5} accent="violet" label={`${Math.round(percent)}%`} />
            }
          />
        </motion.div>
        <motion.div variants={reduce ? still : fadeUp} className="h-full">
          <StatCard
            label={t('progress.totalXp')}
            value={xpNumber.toLocaleString()}
            hint={t('progress.kpi.xpHint')}
            icon={<Zap size={18} />}
            accent="cyan"
            className="h-full"
          />
        </motion.div>
        <motion.div variants={reduce ? still : fadeUp} className="h-full">
          <StatCard
            label={t('progress.missions')}
            value={
              <>
                {missionsDone}
                <span className="text-lg text-ink-3">/{missions.length}</span>
              </>
            }
            hint={t('progress.kpi.missionsHint')}
            icon={<Target size={18} />}
            accent="green"
            className="h-full"
          />
        </motion.div>
        <motion.div variants={reduce ? still : fadeUp} className="h-full">
          <StatCard
            label={t('progress.achievements')}
            value={
              <>
                {unlocked}
                <span className="text-lg text-ink-3">/{achievements.length}</span>
              </>
            }
            hint={t('progress.kpi.achievementsHint')}
            icon={<Award size={18} />}
            accent="gold"
            className="h-full"
          />
        </motion.div>
      </motion.div>

      <Card>
        <XpBar
          level={data.level}
          xp={data.xp}
          xpIntoLevel={data.xpIntoLevel}
          nextLevelXp={data.nextLevelXp}
          currentLevelXp={data.currentLevelXp}
          percent={data.percent}
        />
      </Card>

      <div className="overflow-x-auto overflow-y-hidden whitespace-nowrap">
        <Tabs variant="underline" tabs={tabs} active={tab} onChange={setTab} className="min-w-max" />
      </div>

      {tab === 'missions' && (
        <Card>
          <SectionTitle
            eyebrow={t('progress.missions')}
            title={t('progress.missions.sectionTitle')}
            description={t('progress.missions.sectionDesc')}
            className="mb-6"
          />
          <MissionsPanel items={missions} />
        </Card>
      )}

      {tab === 'achievements' && (
        <Card>
          <SectionTitle
            eyebrow={t('progress.achievements')}
            title={t('progress.achievementsCount', { unlocked, total: achievements.length })}
            description={t('progress.achievements.sectionDesc')}
            className="mb-6"
          />
          <AchievementsGrid items={achievements} />
        </Card>
      )}

      {(tab === 'collection' || tab === 'titles') &&
        (rewards.data ? (
          tab === 'collection' ? (
            <FrameCollection data={rewards.data} pending={rewards.pending} onEquip={rewards.equipFrame} />
          ) : (
            <TitlesPanel data={rewards.data} pending={rewards.pending} onEquip={rewards.equipTitle} />
          )
        ) : rewards.failed ? (
          <EmptyState
            icon={<Gem size={26} />}
            title={t('progress.loadError')}
            action={
              <Button variant="secondary" size="sm" onClick={rewards.reload}>
                {t('rewards.retry')}
              </Button>
            }
          />
        ) : (
          <LoadingSpinner size="lg" className="py-16" />
        ))}

      {tab === 'history' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <SectionTitle eyebrow={t('progress.xp')} title={t('progress.history')} className="mb-4" />
            <XpHistory items={data.recentEvents ?? []} />
          </Card>
          <Card>
            <SectionTitle eyebrow={t('progress.xp')} title={t('progress.rules')} className="mb-4" size="sm" />
            <ul className="divide-y divide-line-subtle">
              {XP_RULE_TYPES.map((type) => (
                <li key={type} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-ink-2">{t(`xp.type.${type}`)}</span>
                  <span className="num font-semibold text-accent-green">+{rules[type] ?? 0} XP</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'leaderboard' && (
        <Card>
          <SectionTitle
            eyebrow={t('progress.xp')}
            title={t('progress.leaderboard')}
            description={t('progress.leaderboard.sectionDesc')}
            className="mb-4"
          />
          <XpLeaderboard entries={board} highlightId={user?.id} />
        </Card>
      )}
    </div>
  );
}
