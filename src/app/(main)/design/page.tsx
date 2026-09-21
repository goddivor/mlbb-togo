'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { Activity, Crown, Flame, Search, Swords, Trophy, Users } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  PageHeader,
  ProgressBar,
  SectionCard,
  SectionTitle,
  Select,
  Skeleton,
  Sparkline,
  StatCard,
  StatRing,
  StatTile,
  Tabs,
  Tooltip,
  type DataColumn,
} from '@/components/ui';
import { HeroCard, MatchScoreline, PlayerCard, RankFrame, TeamCard } from '@/components/game';
import DarkModeToggle from '@/components/layout/DarkModeToggle';
import FramesShowcase from './FramesShowcase';

/* Dev-only showcase of the design system (issue #61). Hidden from menus and
   returns 404 in production. Copy is intentionally not translated. */

const SPARK = [12, 18, 14, 22, 20, 28, 26, 34, 31, 40];

const PLAYER = {
  id: 'demo-1',
  username: 'kwame.tg',
  displayName: 'Kwame Lawson',
  avatar: null,
  gameRank: 'Mythic Glory',
  gameRankLevel: 812,
  gameRoles: [{ role: 'jungle' }, { role: 'mid' }],
  team: { name: 'Lomé Titans', image: null },
};
const PLAYER_STATS = { games: 48, wins: 31, losses: 17, winRate: 65, kda: 4.2, mvpCount: 9 };

const CDN = 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/community/';
const HERO = { heroId: 17, name: 'Fanny', image: `${CDN}100_ae8ca46da01da69619a6c03dc7069921.png`, roles: ['Assassin'], lanes: ['Jungle'] };
const HEROES = {
  ling: `${CDN}100_af4312bae7aa443129b46a17b4dce3a6.png`,
  tigreal: `${CDN}100_23660115389f8f5a6e7cee37cde10671.png`,
  layla: 'https://akmweb.youngjoygame.com/web/gms/image/f222c954b85dce735916d61fc355668a.jpg',
  estes: `${CDN}100_0a256a99be4eb87ce385515666707d17.png`,
};
const HERO_META = { winRate: 52.4, pickRate: 18.9, banRate: 41.2, available: true };

const TEAM = { id: 'team-1', name: 'Lomé Titans', image: null, tag: 'LTN', memberCount: 6, color: 'rgb(var(--accent-gold))' };
const RECORD = { wins: 9, losses: 3, points: 27 };
const FORM: Array<'W' | 'L' | 'D'> = ['W', 'W', 'L', 'W', 'W'];

const MATCH_LIVE = {
  id: 'm1',
  teamA: { id: 'team-1', name: 'Lomé Titans', image: null },
  teamB: { id: 'team-2', name: 'Kara Wolves', image: null },
  scoreA: 1,
  scoreB: 1,
  status: 'scheduled',
  scheduledAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  format: 'bo3',
};
const MATCH_DONE = { ...MATCH_LIVE, id: 'm2', scoreA: 2, scoreB: 0, status: 'completed', winnerTeamId: 'team-1', scheduledAt: new Date(Date.now() - 86400000).toISOString() };
const MATCH_NEXT = { ...MATCH_LIVE, id: 'm3', scoreA: 0, scoreB: 0, status: 'scheduled', scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(), format: 'bo5' };

type Row = { rank: number; team: string; played: number; wins: number; losses: number; points: number };
const ROWS: Row[] = [
  { rank: 1, team: 'Lomé Titans', played: 12, wins: 9, losses: 3, points: 27 },
  { rank: 2, team: 'Kara Wolves', played: 12, wins: 8, losses: 4, points: 24 },
  { rank: 3, team: 'Sokodé Storm', played: 12, wins: 6, losses: 6, points: 18 },
  { rank: 4, team: 'Kpalimé Kings', played: 12, wins: 4, losses: 8, points: 12 },
  { rank: 5, team: 'Atakpamé Aces', played: 12, wins: 3, losses: 9, points: 9 },
];

function Block({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="Primitive" title={title} description={hint} size="sm" />
      {children}
    </section>
  );
}

export default function DesignShowcasePage() {
  const [tab, setTab] = useState('overview');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'rank', dir: 'asc' });

  if (process.env.NODE_ENV === 'production') notFound();

  const columns: DataColumn<Row>[] = [
    { key: 'rank', header: '#', align: 'right', sortable: true, width: 'w-12', render: (r) => <span className="font-display font-bold">{r.rank}</span> },
    { key: 'team', header: 'Team', render: (r) => <span className="font-semibold">{r.team}</span> },
    { key: 'played', header: 'P', align: 'right', sortable: true, hideBelow: 'sm' },
    { key: 'wins', header: 'W', align: 'right', sortable: true, render: (r) => <span className="text-accent-green">{r.wins}</span> },
    { key: 'losses', header: 'L', align: 'right', sortable: true, render: (r) => <span className="text-accent-red">{r.losses}</span> },
    { key: 'points', header: 'Pts', align: 'right', sortable: true, render: (r) => <span className="font-display font-bold">{r.points}</span> },
  ];
  const sorted = [...ROWS].sort((a, b) => ((a as any)[sort.key] - (b as any)[sort.key]) * (sort.dir === 'asc' ? 1 : -1));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Design system · step 1"
        title="Premium esport kit"
        subtitle="Every primitive and rich component with sample data. Toggle light/dark to review both themes."
        icon={<Swords size={20} />}
        breadcrumb="Design"
        action={<DarkModeToggle />}
      >
        <StatCard label="Players" value="1 284" icon={<Users size={18} />} delta={4.2} sparkline={SPARK} hint="Last 30 days" />
        <StatCard label="Matches played" value="342" icon={<Swords size={18} />} delta={-1.8} sparkline={[...SPARK].reverse()} accent="violet" />
        <StatCard label="Win rate" value="61%" icon={<Trophy size={18} />} delta={0} accent="gold" />
        <StatCard label="Live now" value="3" icon={<Flame size={18} />} accent="red" hint="Matches in progress" />
      </PageHeader>

      <PageHeader
        eyebrow="Season 4 · Playoffs"
        title="Banner header"
        subtitle="Optional background art with a gradient overlay and the angled edge."
        banner="/mlbbtogo-icon.png"
        variant="purple"
        breadcrumb="Design"
        action={<Button size="sm">Register team</Button>}
      />

      <Block title="Buttons" hint="Primary and danger carry the chamfer; loading state built in.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Block>

      <Block title="Badges" hint="Status pills, rank tiers and the live pulse.">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="neon">Neon</Badge>
          <Badge variant="green" dot>Online</Badge>
          <Badge variant="red">Danger</Badge>
          <Badge variant="gold">Gold</Badge>
          <Badge variant="purple">Purple</Badge>
          <Badge variant="pink">Pink</Badge>
          <Badge variant="live">Live</Badge>
          <Badge variant="tier-gold"><Crown size={12} /> Gold tier</Badge>
          <Badge variant="tier-silver">Silver tier</Badge>
          <Badge variant="tier-bronze">Bronze tier</Badge>
          <Badge variant="neon" size="lg">Large</Badge>
        </div>
      </Block>

      <Block title="Tabs" hint="Sliding segment (default, drop-in) and animated underline.">
        <div className="flex flex-col gap-4">
          <Tabs
            tabs={[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'matches', label: 'Matches', count: 12 },
              { id: 'players', label: 'Players' },
            ]}
            active={tab}
            onChange={setTab}
          />
          <Tabs
            variant="underline"
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'matches', label: 'Matches', count: 12 },
              { id: 'players', label: 'Players' },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>
      </Block>

      <Block title="Cards" hint="Hover lift, glow border, accent edge.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card hover>
            <SectionTitle eyebrow="Hover" title="Lifts on hover" size="sm" />
            <p className="mt-2 text-sm text-ink-2">Border strengthens and elevation grows.</p>
          </Card>
          <Card glow>
            <SectionTitle eyebrow="Glow" title="Primary glow" size="sm" />
            <p className="mt-2 text-sm text-ink-2">Reserved for the one element that matters.</p>
          </Card>
          <Card accent="gold">
            <SectionTitle eyebrow="Accent" title="Gold edge" size="sm" />
            <p className="mt-2 text-sm text-ink-2">Coloured left edge for team or status colour.</p>
          </Card>
        </div>
      </Block>

      <Block title="Stats" hint="Tiles, rings and sparklines share the tabular display numerals.">
        <SectionCard className="flex flex-wrap items-center gap-8">
          <StatTile label="KDA" value="4.20" accent="cyan" />
          <StatTile label="MVP" value="9" accent="gold" delta={12} />
          <StatTile label="Games" value="48" />
          <StatRing value={65} accent="cyan" label="Win rate 65%" />
          <StatRing value={32} accent="red" size={48} stroke={5} />
          <StatRing value={88} accent="gold" size={80} stroke={7}>
            <span className="text-sm">A+</span>
          </StatRing>
          <Sparkline data={SPARK} width={140} height={40} />
          <Sparkline data={[...SPARK].reverse()} width={140} height={40} accent="red" />
          <div className="w-48"><ProgressBar value={72} /></div>
          <div className="w-48"><ProgressBar value={38} accent="gold" /></div>
        </SectionCard>
      </Block>

      <Block title="Data table" hint="Sticky header, zebra rows, sortable columns, row hover.">
        <DataTable
          columns={columns}
          rows={sorted}
          rowKey={(r) => r.rank}
          sortKey={sort.key}
          sortDir={sort.dir}
          onSort={(key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))}
          onRowClick={() => {}}
          maxHeight="260px"
        />
      </Block>

      <Block title="Forms, tooltip, skeleton, avatar">
        <SectionCard className="grid gap-5 md:grid-cols-2">
          <Input label="Team name" placeholder="Lomé Titans" />
          <Select label="Stage" options={[{ value: 'league', label: 'League' }, { value: 'playoff', label: 'Playoffs' }]} />
          <Input label="With error" defaultValue="x" error="This name is already taken." />
          <div className="flex flex-wrap items-center gap-4">
            <Tooltip content="Tooltip on hover"><Button variant="outline" size="sm">Hover me</Button></Tooltip>
            <Avatar name="Kwame Lawson" size="lg" ring />
            <Avatar name="Ama Kodjo" size="md" online />
            <Avatar name="Team" size="md" square />
            <Skeleton className="h-10 w-10" circle />
            <Skeleton lines={3} className="w-40" />
          </div>
        </SectionCard>
      </Block>

      <Block title="Rank frames">
        <SectionCard className="flex flex-wrap items-end gap-8">
          <RankFrame name="Kwame Lawson" rank="Mythic Immortal" size={80} />
          <RankFrame name="Ama Kodjo" rank="Mythic" size={72} />
          <RankFrame name="Sena D" rank="Epic" size={64} />
          <RankFrame name="Yao K" rank="Elite" size={56} />
          <RankFrame name="New" size={48} />
        </SectionCard>
      </Block>

      <Block title="Avatar frames" hint="The 64 reward frames (AvatarFrame): sizes, rank badge placement, every frame at 128 and 40 px.">
        <FramesShowcase />
      </Block>

      <Block title="Player card" hint="Reads /users/:id and /users/:id/stats shapes.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <PlayerCard player={PLAYER} stats={PLAYER_STATS} href={null} />
          <PlayerCard player={{ ...PLAYER, id: 'demo-2', displayName: 'Ama Kodjo', gameRank: 'Epic', gameRankLevel: 3, team: null, gameRoles: ['gold'] }} stats={{ ...PLAYER_STATS, winRate: 44, kda: 2.8 }} href={null} />
          <PlayerCard player={{ ...PLAYER, id: 'demo-3', displayName: 'Sena Dossou', gameRank: 'Legend' }} stats={null} compact href={null} />
        </div>
      </Block>

      <Block title="Hero card" hint="Reads /mlbb/heroes items + /mlbb/heroes/:id/meta.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <HeroCard hero={HERO} meta={HERO_META} onClick={() => {}} />
          <HeroCard hero={{ ...HERO, heroId: 84, name: 'Ling', image: HEROES.ling, roles: ['Assassin'] }} meta={{ winRate: 49.1, pickRate: 9.4, banRate: 22.7 }} />
          <HeroCard hero={{ ...HERO, heroId: 6, name: 'Tigreal', image: HEROES.tigreal, roles: ['Tank'], lanes: ['Roam'] }} meta={null} />
          <HeroCard hero={{ ...HERO, heroId: 18, name: 'Layla', image: HEROES.layla, roles: ['Marksman'], lanes: ['Gold'] }} size="sm" />
          <HeroCard hero={{ ...HERO, heroId: 34, name: 'Estes', image: HEROES.estes, roles: ['Support'], lanes: ['Roam'] }} size="sm" />
        </div>
      </Block>

      <Block title="Team card and scorelines">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <TeamCard team={TEAM} record={RECORD} form={FORM} rank={1} href={null} />
            <TeamCard team={{ ...TEAM, id: 't2', name: 'Kara Wolves', tag: null, color: null }} record={{ wins: 8, losses: 4 }} href={null} />
            <TeamCard team={{ ...TEAM, id: 't3', name: 'Sokodé Storm', color: 'rgb(var(--accent-violet))' }} href={null} />
          </div>
          <div className="space-y-4">
            <MatchScoreline match={MATCH_LIVE} href={null} />
            <MatchScoreline match={MATCH_DONE} href={null} />
            <MatchScoreline match={MATCH_NEXT} href={null} />
            <MatchScoreline match={MATCH_DONE} href={null} compact />
          </div>
        </div>
      </Block>

      <Block title="Empty state">
        <SectionCard className="!p-0">
          <EmptyState
            icon={<Search size={26} />}
            title="No results yet"
            description="Try another name, or clear the filters to see every player."
            action={<Button variant="secondary" size="sm">Clear filters</Button>}
            className="!min-h-0 py-12"
          />
        </SectionCard>
      </Block>
    </div>
  );
}
