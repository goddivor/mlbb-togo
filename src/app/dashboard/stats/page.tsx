'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Medal, Shield, Swords, Users } from 'lucide-react';
import { PageHeader, Tabs } from '@/components/ui';
import SeasonSwitcher from '@/components/seasons/SeasonSwitcher';
import { useT } from '@/lib/i18n';
import { useStatsScope } from '@/components/stats/shared';
import TeamsTab from '@/components/stats/TeamsTab';
import PlayersTab from '@/components/stats/PlayersTab';
import MetaTab from '@/components/stats/MetaTab';
import RecordsTab from '@/components/stats/RecordsTab';

type TabId = 'teams' | 'players' | 'meta' | 'records';
const TAB_IDS: TabId[] = ['teams', 'players', 'meta', 'records'];

/**
 * League statistics: teams / players / meta / records, filtered by the
 * global season switcher (a specific season, the current one or all).
 */
function StatsPageInner() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const fromUrl = params.get('tab') as TabId | null;
  const [tab, setTab] = useState<TabId>(fromUrl && TAB_IDS.includes(fromUrl) ? fromUrl : 'teams');
  const { scope, season, selection, ready } = useStatsScope();

  // Keep the tab in the URL so it can be shared / restored.
  useEffect(() => {
    const current = params.get('tab');
    if ((current ?? 'teams') === tab) return;
    router.replace(tab === 'teams' ? '/dashboard/stats' : `/dashboard/stats?tab=${tab}`, { scroll: false });
  }, [tab, params, router]);

  const tabs = [
    { id: 'teams', label: t('lstats.tab.teams'), icon: Shield },
    { id: 'players', label: t('lstats.tab.players'), icon: Users },
    { id: 'meta', label: t('lstats.tab.meta'), icon: Swords },
    { id: 'records', label: t('lstats.tab.records'), icon: Medal },
  ];

  const scopeLabel = !ready ? '…' : selection === 'all' || !season ? t('lstats.scope.all') : season.name;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={scopeLabel}
        icon={<BarChart3 size={20} />}
        title={t('lstats.title')}
        subtitle={t('lstats.subtitle')}
        action={<SeasonSwitcher variant="inline" />}
      />

      <div className="overflow-x-auto overflow-y-hidden">
        <Tabs variant="underline" tabs={tabs} active={tab} onChange={(id: TabId) => setTab(id)} className="min-w-max whitespace-nowrap" />
      </div>

      {tab === 'teams' && <TeamsTab scope={scope} ready={ready} />}
      {tab === 'players' && <PlayersTab scope={scope} ready={ready} />}
      {tab === 'meta' && <MetaTab scope={scope} ready={ready} />}
      {tab === 'records' && <RecordsTab scope={scope} ready={ready} />}
    </div>
  );
}

export default function StatsPage() {
  // `useSearchParams` needs a Suspense boundary for static rendering.
  return (
    <Suspense fallback={null}>
      <StatsPageInner />
    </Suspense>
  );
}
