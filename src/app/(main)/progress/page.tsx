'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, History, Sparkles, Target, Trophy } from 'lucide-react';
import { Card, PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useAuthStore } from '@/store/useStore';
import XpBar from '@/components/gamification/XpBar';
import AchievementsGrid from '@/components/gamification/AchievementsGrid';
import MissionsPanel from '@/components/gamification/MissionsPanel';
import XpHistory from '@/components/gamification/XpHistory';
import XpLeaderboard from '@/components/gamification/XpLeaderboard';

const XP_RULE_TYPES = [
  'match_played',
  'match_win',
  'match_mvp',
  'tournament_registration',
  'daily_login',
  'forum_post',
  'friend_added',
];

export default function ProgressPage() {
  const t = useT();
  const user = useAuthStore((s: any) => s.user);
  const [data, setData] = useState<any>(null);
  const [board, setBoard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return <EmptyState icon={<Sparkles size={26} />} title={t('progress.loadError')} />;
  }

  const achievements: any[] = data.achievements ?? [];
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const rules: Record<string, number> = data.xpRules ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Sparkles size={28} />}
        title={t('progress.title')}
        subtitle={t('progress.subtitle')}
        variant="purple"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
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
      </motion.div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-primary" />
          <h3 className="font-bold text-black dark:text-white">{t('progress.missions')}</h3>
        </div>
        <MissionsPanel items={data.missions ?? []} />
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-primary" />
            <h3 className="font-bold text-black dark:text-white">{t('progress.achievements')}</h3>
          </div>
          <span className="text-sm text-body dark:text-bodydark">
            {t('progress.achievementsCount', { unlocked, total: achievements.length })}
          </span>
        </div>
        <AchievementsGrid items={achievements} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <History size={18} className="text-primary" />
            <h3 className="font-bold text-black dark:text-white">{t('progress.history')}</h3>
          </div>
          <XpHistory items={data.recentEvents ?? []} />
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-primary" />
              <h3 className="font-bold text-black dark:text-white">{t('progress.leaderboard')}</h3>
            </div>
            <XpLeaderboard entries={board} highlightId={user?.id} />
          </Card>

          <Card>
            <h3 className="font-bold text-black dark:text-white mb-3">{t('progress.rules')}</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {XP_RULE_TYPES.map((type) => (
                <li key={type} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-body dark:text-bodydark">{t(`xp.type.${type}`)}</span>
                  <span className="font-semibold text-success">+{rules[type] ?? 0} XP</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
