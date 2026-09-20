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
import { Avatar, Badge, Button, EmptyState, LoadingSpinner, PageHeader, SectionCard, Select, StatCard } from '@/components/ui';
import SeasonSwitcher from '@/components/seasons/SeasonSwitcher';
import TogoMap from '@/components/geo/TogoMap';
import { useGeoCities } from '@/components/geo/CitySelect';
import { layerCount, type MapCityBucket, type MapLayer, type MapPayload } from '@/components/geo/geo';

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
  const competitions = data ? data.totals.tournaments + data.totals.events + data.totals.drafts : 0;
  const locatedCities = data ? data.cities.filter((c) => c.counts.total > 0).length : 0;

  return (
    <div>
      <PageHeader
        title={t('geo.title')}
        subtitle={t('geo.subtitle')}
        action={<SeasonSwitcher variant="inline" />}
      >
        <StatCard icon={<Users size={22} />} label={t('geo.stat.players')} value={data?.totals.players ?? 0} />
        <StatCard icon={<Shield size={22} />} label={t('geo.stat.teams')} value={data?.totals.teams ?? 0} />
        <StatCard icon={<Trophy size={22} />} label={t('geo.stat.competitions')} value={competitions} />
        <StatCard icon={<MapPin size={22} />} label={t('geo.stat.cities')} value={locatedCities} />
      </PageHeader>

      {/* Filters */}
      <SectionCard className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">
              {t('geo.layers')}
            </p>
            <div className="flex flex-wrap gap-2">
              {LAYERS.map(({ id, icon: Icon, key }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleLayer(id)}
                  aria-pressed={layers[id]}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    layers[id]
                      ? 'border-primary bg-primary text-white'
                      : 'border-stroke bg-white text-body hover:border-primary dark:border-strokedark dark:bg-boxdark dark:text-bodydark'
                  }`}
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
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : nothingLocated ? (
        <SectionCard>
          <EmptyState
            icon={<MapPin size={28} />}
            title={t('geo.empty.title')}
            description={t('geo.empty.desc')}
            action={
              <Link href="/settings">
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
          <SectionCard className="xl:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-black dark:text-white">{t('geo.map.heading')}</h3>
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
                className={`mt-3 flex w-full items-center justify-between rounded-sm border px-3 py-2 text-sm transition-colors ${
                  selectedId === 'other'
                    ? 'border-primary bg-primary/5'
                    : 'border-stroke hover:border-primary dark:border-strokedark'
                }`}
              >
                <span className="text-black dark:text-white">{t('geo.other.label')}</span>
                <span className="font-semibold text-primary">{layerCount(data.other, layers)}</span>
              </button>
            )}
          </SectionCard>

          {/* Side panel */}
          <div className="space-y-6 xl:col-span-3">
            {selected ? (
              <CityPanel bucket={selected} onClose={() => setSelectedId(null)} />
            ) : (
              <SectionCard>
                <h3 className="mb-3 font-semibold text-black dark:text-white">{t('geo.ranking.title')}</h3>
                {ranked.length === 0 ? (
                  <p className="text-sm text-body dark:text-bodydark">{t('geo.ranking.empty')}</p>
                ) : (
                  <ol className="space-y-1.5">
                    {ranked.map(({ bucket, count }, i) => (
                      <li key={bucket.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(bucket.id)}
                          className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors hover:bg-gray-2 dark:hover:bg-meta-4"
                        >
                          <span className="w-6 text-center text-xs font-bold text-bodydark2">{i + 1}</span>
                          <span className="flex-1 truncate text-sm font-medium text-black dark:text-white">
                            {bucket.id === 'other' ? t('geo.other.label') : bucket.name}
                          </span>
                          <span className="hidden text-xs text-body dark:text-bodydark sm:block">
                            {bucket.region ? t(`geo.region.${bucket.region}`) : ''}
                          </span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                            {count}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
                <p className="mt-4 text-xs text-body dark:text-bodydark">{t('geo.ranking.hint')}</p>
              </SectionCard>
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
    <SectionCard>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-black dark:text-white">
            <MapPin size={18} className="text-primary" />
            {isOther ? t('geo.other.label') : bucket.name}
          </h3>
          <p className="text-xs text-body dark:text-bodydark">
            {isOther ? t('geo.other.desc') : bucket.region ? t(`geo.region.${bucket.region}`) : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="rounded-md p-1 text-body hover:bg-gray-2 hover:text-black dark:text-bodydark dark:hover:bg-meta-4 dark:hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2 text-center">
        {[
          { label: t('geo.layer.players'), value: bucket.counts.players },
          { label: t('geo.layer.teams'), value: bucket.counts.teams },
          { label: t('geo.layer.competitions'), value: bucket.counts.tournaments + bucket.counts.events + bucket.counts.drafts },
        ].map((s) => (
          <div key={s.label} className="rounded-sm bg-gray-2 py-2 dark:bg-meta-4">
            <p className="text-lg font-bold text-black dark:text-white">{s.value}</p>
            <p className="text-[11px] text-body dark:text-bodydark">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Players */}
      <Section icon={<Users size={14} />} title={t('geo.panel.players', { n: bucket.counts.players })}>
        {bucket.topPlayers.length === 0 ? (
          <p className="text-xs text-body dark:text-bodydark">
            {bucket.counts.players > 0 ? t('geo.panel.playersPrivate') : t('geo.panel.none')}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {bucket.topPlayers.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/players/${p.id}`}
                  className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm text-black hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4"
                >
                  <Avatar name={p.username} src={avatarSrc(p.avatar, 64)} size="sm" />
                  <span className="truncate">{p.username}</span>
                </Link>
              </li>
            ))}
            {hidden > 0 && (
              <li className="px-1 text-xs text-body dark:text-bodydark">{t('geo.panel.morePlayers', { n: hidden })}</li>
            )}
          </ul>
        )}
      </Section>

      {/* Teams */}
      <Section icon={<Shield size={14} />} title={t('geo.panel.teams', { n: bucket.counts.teams })}>
        {bucket.teams.length === 0 ? (
          <p className="text-xs text-body dark:text-bodydark">{t('geo.panel.none')}</p>
        ) : (
          <ul className="space-y-1.5">
            {bucket.teams.map((team) => (
              <li key={team.id}>
                <Link
                  href={`/teams/${team.id}`}
                  className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm text-black hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4"
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
          <p className="text-xs text-body dark:text-bodydark">{t('geo.panel.none')}</p>
        ) : (
          <ul className="space-y-1.5">
            {upcomingTournaments.map((x) => (
              <li key={x.id}>
                <Link
                  href={`/tournaments/${x.id}`}
                  className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm text-black hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4"
                >
                  <Medal size={14} className="shrink-0 text-warning" />
                  <span className="flex-1 truncate">{x.name}</span>
                  {x.startDate && <span className="text-xs text-body dark:text-bodydark">{x.startDate}</span>}
                </Link>
              </li>
            ))}
            {upcomingEvents.map((x) => (
              <li key={x.id}>
                <Link
                  href="/events"
                  className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm text-black hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4"
                >
                  <CalendarDays size={14} className="shrink-0 text-secondary" />
                  <span className="flex-1 truncate">{x.title}</span>
                  {x.date && <span className="text-xs text-body dark:text-bodydark">{x.date}</span>}
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
                  href={`/tournaments/${x.id}`}
                  className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm text-body hover:bg-gray-2 dark:text-bodydark dark:hover:bg-meta-4"
                >
                  <Medal size={14} className="shrink-0" />
                  <span className="flex-1 truncate">{x.name}</span>
                  {x.startDate && <span className="text-xs">{x.startDate}</span>}
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
                  href={`/draft/${d.id}`}
                  className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm text-black hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4"
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
    </SectionCard>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark">
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}
