'use client';

import { useEffect, useState } from 'react';
import { Award, CalendarClock, Gem, Hourglass, Medal, Milestone, UserSearch } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { PageHeader, Tabs } from '@/components/ui';
import TimelineTab from '@/components/admin/rewards/TimelineTab';
import FramesTab from '@/components/admin/rewards/FramesTab';
import TemporaryTab from '@/components/admin/rewards/TemporaryTab';
import PlayerTab from '@/components/admin/rewards/PlayerTab';
import TournamentsTab from '@/components/admin/rewards/TournamentsTab';
import EventsTab from '@/components/admin/rewards/EventsTab';
import AchievementsTab from '@/components/admin/rewards/AchievementsTab';

type Tab = 'timeline' | 'frames' | 'achievements' | 'events' | 'temporary' | 'player' | 'tournaments';
const TABS: Tab[] = ['timeline', 'frames', 'achievements', 'events', 'temporary', 'player', 'tournaments'];

/** Rewards administration (#124): frames, titles, temporary frames, XP corrections. */
export default function AdminRewardsPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('timeline');

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('tab') as Tab | null;
    if (wanted && TABS.includes(wanted)) setTab(wanted);
  }, []);

  const tabs = [
    { id: 'timeline', label: t('rewards.admin.tab.timeline'), icon: Milestone },
    { id: 'frames', label: t('rewards.admin.tab.frames'), icon: Gem },
    { id: 'achievements', label: t('rewards.admin.tab.achievements'), icon: Award },
    { id: 'events', label: t('rewards.admin.tab.events'), icon: CalendarClock },
    { id: 'temporary', label: t('rewards.admin.tab.temporary'), icon: Hourglass },
    { id: 'player', label: t('rewards.admin.tab.player'), icon: UserSearch },
    { id: 'tournaments', label: t('rewards.admin.tab.tournaments'), icon: Medal },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Gem size={28} />}
        eyebrow={t('nav.section.community')}
        title={t('admin.rewards.title')}
        subtitle={t('admin.rewards.subtitle')}
        variant="purple"
      />

      <div className="overflow-x-auto overflow-y-hidden whitespace-nowrap">
        <Tabs variant="underline" tabs={tabs} active={tab} onChange={setTab} className="min-w-max" />
      </div>

      {tab === 'timeline' && <TimelineTab />}
      {tab === 'frames' && <FramesTab />}
      {tab === 'achievements' && <AchievementsTab />}
      {tab === 'events' && <EventsTab />}
      {tab === 'temporary' && <TemporaryTab />}
      {tab === 'player' && <PlayerTab />}
      {tab === 'tournaments' && <TournamentsTab />}
    </div>
  );
}
