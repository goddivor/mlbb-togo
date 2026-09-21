'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Gamepad2,
  MapPin,
  Medal,
  Settings as SettingsIcon,
  Shield,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useSelectedSeason } from '@/store/useSeasonStore';
import { Avatar, Badge, Button, Card, DataTable, EmptyState, PageHeader, SectionCard, Select, Skeleton, StatCard, StatTile, type DataColumn } from '@/components/ui';
import { cn } from '@/lib/helpers';
import SeasonSwitcher from '@/components/seasons/SeasonSwitcher';
import TogoMap from '@/components/geo/TogoMap';
import { useGeoCities } from '@/components/geo/CitySelect';
import { layerCount, type MapCityBucket, type MapLayer, type MapPayload } from '@/components/geo/geo';
import AvatarFrame from '@/components/game/AvatarFrame';

const LAYERS: { id: MapLayer; icon: any; key: string }[] = [
  { id: 'players', icon: Users, key: 'geo.layer.players' },
  { id: 'teams', icon: Shield, key: 'geo.layer.teams' },
  { id: 'competitions', icon: Trophy, key: 'geo.layer.competitions' },
];

export default function MapPage() {
  const t = useT();
  const geo = useGeoCities();
  const { selection, seasonId, ready } = useSelectedSeason();

  const [data, setData] = useState<MapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState<Record<MapLayer, boolean>>({ players: true, teams: true, competitions: true });
  const [region, setRegion] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!ready) return;
    setLoading(true);
    api.geo
      .map(selection === 'all' ? null : seasonId)
      .then((res: MapPayload | null) => setData(res && Array.isArray(res.cities) ? res : null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ready, selection, seasonId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleLayer = (id: MapLayer) =>
    setLayers((l) => {
      const next = { ...l, [id]: !l[id] };
      // Keep at least one layer active.
      return Object.values(next).some(Boolean) ? next : l;
    });

  const allBuckets = useMemo<MapCityBucket[]>(() => (data ? [...data.cities, data.other] : []), [data]);

  const ranked = useMemo(
    () =>
      allBuckets
        .filter((c) => !region || c.region === region || (c.id === 'other' && !region))
        .map((c) => ({ bucket: c, count: layerCount(c, layers) }))
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count || a.bucket.name.localeCompare(b.bucket.name)),
    [allBuckets, layers, region],
  );

  const selected = useMemo(() => allBuckets.find((c) => c.id === selectedId) ?? null, [allBuckets, selectedId]);

  const nothingLocated = !!data && data.totals.located + data.totals.unlocated === 0;

  const rankingColumns: DataColumn<{ bucket: MapCityBucket; count: number }>[] = [
    { key: 'rank', header: '#', width: 'w-10', align: 'center', render: (_r, i) => <span className="font-display font-bold text-ink-3">{i + 1}</span> },
    {
      key: 'name',
      header: t('geo.city'),
      render: (r) => <span className="font-medium text-ink-1">{r.bucket.id === 'other' ? t('geo.other.label') : r.bucket.name}</span>,
    },
    {
      key: 'region',
      header: t('geo.regionFilter'),
      hideBelow: 'md',
      render: (r) => <span className="text-ink-2">{r.bucket.region ? t(`geo.region.${r.bucket.region}`) : ''}</span>,
    },
    { key: 'players', header: t('geo.layer.players'), align: 'right', hideBelow: 'lg', render: (r) => r.bucket.counts.players },
    { key: 'teams', header: t('geo.layer.teams'), align: 'right', hideBelow: 'lg', render: (r) => r.bucket.counts.teams },
    {
      key: 'count',
      header: t('geo.ranking.total'),
      align: 'right',
      render: (r) => <span className="font-display font-bold text-primary">{r.count}</span>,
    },
  ];
  const competitions = data ? data.totals.tournaments + data.totals.events + data.totals.drafts : 0;
  const locatedCities = data ? data.cities.filter((c) => c.counts.total > 0).length : 0;

  return (
    <div>
      <PageHeader
        eyebrow={t('geo.eyebrow')}
        icon={<MapPin size={22} />}
        title={t('geo.title')}
        subtitle={t('geo.subtitle')}
        variant="green"
        action={<SeasonSwitcher variant="inline" />}
      >
        <StatCard icon={<Users size={18} />} label={t('geo.stat.players')} value={data?.totals.players ?? 0} accent="cyan" />
        <StatCard icon={<Shield size={18} />} label={t('geo.stat.teams')} value={data?.totals.teams ?? 0} accent="violet" />
        <StatCard icon={<Trophy size={18} />} label={t('geo.stat.competitions')} value={competitions} accent="gold" />
        <StatCard icon={<MapPin size={18} />} label={t('geo.stat.cities')} value={locatedCities} accent="green" />
      </PageHeader>

      {/* Filters */}
      <SectionCard className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-2.5">{t('geo.layers')}</p>
            <div className="flex flex-wrap gap-2">
              {LAYERS.map(({ id, icon: Icon, key }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleLayer(id)}
                  aria-pressed={layers[id]}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-semibold transition-colors duration-fast',
                    layers[id]
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-line-subtle bg-surface-2 text-ink-2 hover:border-line-strong hover:text-ink-1',
                  )}
                >
                  <Icon size={14} /> {t(key)}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full sm:w-56">
            <Select
              label={t('geo.regionFilter')}
              value={region}
              onChange={(e: any) => {
                setRegion(e.target.value);
                setSelectedId(null);
              }}
            >
              <option value="">{t('geo.region.all')}</option>
              {(geo?.regions ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {t(`geo.region.${r.id}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </SectionCard>

      {loading && !data ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <Skeleton className="h-[420px] rounded-lg xl:col-span-2" />
          <Skeleton className="h-[420px] rounded-lg xl:col-span-3" />
        </div>
      ) : nothingLocated ? (
        <SectionCard>
          <EmptyState
            icon={<MapPin size={28} />}
            title={t('geo.empty.title')}
            description={t('geo.empty.desc')}
            action={
              <Link href="/dashboard/settings">
                <Button>
                  <SettingsIcon size={16} /> {t('geo.empty.cta')}
                </Button>
              </Link>
            }
          />
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          {/* Map */}
          <Card className="xl:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display font-bold tracking-tight2 text-ink-1">{t('geo.map.heading')}</h3>
              {data?.season && (
                <Badge variant="blue" size="sm">
                  {data.season.name}
                </Badge>
              )}
            </div>
            <TogoMap
              cities={data?.cities ?? []}
              layers={layers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              region={region || null}
              onRegionSelect={(id) => {
                setRegion(id ?? '');
                setSelectedId(null);
              }}
            />
            {!!data?.other.counts.total && (
              <button
                type="button"
                onClick={() => setSelectedId(selectedId === 'other' ? null : 'other')}
                className={cn(
                  'mt-3 flex w-full items-center justify-between rounded border px-3 py-2 text-sm transition-colors duration-fast',
                  selectedId === 'other' ? 'border-primary bg-primary/5' : 'border-line-subtle hover:border-line-strong',
                )}
              >
                <span className="text-ink-1">{t('geo.other.label')}</span>
                <span className="font-semibold text-primary num">{layerCount(data.other, layers)}</span>
              </button>
            )}
          </Card>

          {/* Side panel */}
          <div className="space-y-6 xl:col-span-3">
            {selected ? (
              <CityPanel bucket={selected} onClose={() => setSelectedId(null)} />
            ) : (
              <Card>
                <h3 className="mb-3 font-display font-bold tracking-tight2 text-ink-1">{t('geo.ranking.title')}</h3>
                <DataTable
                  columns={rankingColumns}
                  rows={ranked}
                  rowKey={(r) => r.bucket.id}
                  onRowClick={(r) => setSelectedId(r.bucket.id)}
                  dense
                  emptyMessage={t('geo.ranking.empty')}
                />
                <p className="mt-4 text-xs text-ink-3">{t('geo.ranking.hint')}</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* City detail panel                                                   */
/* ------------------------------------------------------------------ */

function CityPanel({ bucket, onClose }: { bucket: MapCityBucket; onClose: () => void }) {
  const t = useT();
  const isOther = bucket.id === 'other';
  const upcomingTournaments = bucket.tournaments.filter((x) => x.upcoming);
  const pastTournaments = bucket.tournaments.filter((x) => !x.upcoming);
  const upcomingEvents = bucket.events.filter((x) => x.upcoming);
  const hidden = Math.max(0, bucket.players - bucket.topPlayers.length);

  return (
    <Card accent="green">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">{isOther ? t('geo.other.desc') : bucket.region ? t(`geo.region.${bucket.region}`) : t('geo.map.heading')}</p>
          <h3 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight2 text-ink-1">
            <MapPin size={18} className="text-accent-green" />
            {isOther ? t('geo.other.label') : bucket.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="rounded p-1.5 text-ink-2 transition-colors duration-fast hover:bg-surface-2 hover:text-ink-1"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2 rounded border border-line-subtle bg-surface-2/60 p-3">
        <StatTile label={t('geo.layer.players')} value={bucket.counts.players} accent="cyan" align="center" />
        <StatTile label={t('geo.layer.teams')} value={bucket.counts.teams} accent="violet" align="center" />
        <StatTile label={t('geo.layer.competitions')} value={bucket.counts.tournaments + bucket.counts.events + bucket.counts.drafts} accent="gold" align="center" />
      </div>

      {/* Players */}
      <Section icon={<Users size={14} />} title={t('geo.panel.players', { n: bucket.counts.players })}>
        {bucket.topPlayers.length === 0 ? (
          <p className="text-xs text-ink-3">
            {bucket.counts.players > 0 ? t('geo.panel.playersPrivate') : t('geo.panel.none')}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {bucket.topPlayers.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/players/${p.id}`}
                  className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-ink-1 transition-colors duration-fast hover:bg-surface-2"
                >
                  <AvatarFrame frame={p.equippedFrame} name={p.username} src={p.avatar ? avatarSrc(p.avatar, 64) : null} avatarSize={32} bleed showBadge={false} />
                  <span className="truncate">{p.username}</span>
                </Link>
              </li>
            ))}
            {hidden > 0 && (
              <li className="px-1 text-xs text-ink-3">{t('geo.panel.morePlayers', { n: hidden })}</li>
            )}
          </ul>
        )}
      </Section>

      {/* Teams */}
      <Section icon={<Shield size={14} />} title={t('geo.panel.teams', { n: bucket.counts.teams })}>
        {bucket.teams.length === 0 ? (
          <p className="text-xs text-ink-3">{t('geo.panel.none')}</p>
        ) : (
          <ul className="space-y-1.5">
            {bucket.teams.map((team) => (
              <li key={team.id}>
                <Link
                  href={`/dashboard/teams/${team.id}`}
                  className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-ink-1 transition-colors duration-fast hover:bg-surface-2"
                >
                  <Avatar name={team.name} src={avatarSrc(team.image, 64)} size="sm" />
                  <span className="flex-1 truncate">{team.name}</span>
                  <Badge variant={team.type === 'esport' ? 'blue' : 'default'} size="sm">
                    {t(team.type === 'esport' ? 'geo.team.esport' : 'geo.team.community')}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Tournaments & events */}
      <Section icon={<Trophy size={14} />} title={t('geo.panel.upcoming', { n: bucket.counts.upcoming })}>
        {upcomingTournaments.length + upcomingEvents.length === 0 ? (
          <p className="text-xs text-ink-3">{t('geo.panel.none')}</p>
        ) : (
          <ul className="space-y-1.5">
            {upcomingTournaments.map((x) => (
              <li key={x.id}>
                <Link
                  href={`/dashboard/tournaments/${x.id}`}
                  className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-ink-1 transition-colors duration-fast hover:bg-surface-2"
                >
                  <Medal size={14} className="shrink-0 text-accent-gold" />
                  <span className="flex-1 truncate">{x.name}</span>
                  {x.startDate && <span className="text-xs text-ink-3 num">{x.startDate}</span>}
                </Link>
              </li>
            ))}
            {upcomingEvents.map((x) => (
              <li key={x.id}>
                <Link
                  href="/dashboard/events"
                  className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-ink-1 transition-colors duration-fast hover:bg-surface-2"
                >
                  <CalendarDays size={14} className="shrink-0 text-accent-cyan" />
                  <span className="flex-1 truncate">{x.title}</span>
                  {x.date && <span className="text-xs text-ink-3 num">{x.date}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {pastTournaments.length > 0 && (
        <Section icon={<Trophy size={14} />} title={t('geo.panel.past', { n: bucket.counts.past })}>
          <ul className="space-y-1.5">
            {pastTournaments.slice(0, 5).map((x) => (
              <li key={x.id}>
                <Link
                  href={`/dashboard/tournaments/${x.id}`}
                  className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-ink-2 transition-colors duration-fast hover:bg-surface-2"
                >
                  <Medal size={14} className="shrink-0" />
                  <span className="flex-1 truncate">{x.name}</span>
                  {x.startDate && <span className="text-xs num">{x.startDate}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {bucket.drafts.length > 0 && (
        <Section icon={<Gamepad2 size={14} />} title={t('geo.panel.drafts', { n: bucket.counts.drafts })}>
          <ul className="space-y-1.5">
            {bucket.drafts.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/dashboard/draft/${d.id}`}
                  className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-ink-1 transition-colors duration-fast hover:bg-surface-2"
                >
                  <Gamepad2 size={14} className="shrink-0 text-primary" />
                  <span className="flex-1 truncate">{d.name}</span>
                  {d.category && <Badge size="sm">{d.category}</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </Card>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}
