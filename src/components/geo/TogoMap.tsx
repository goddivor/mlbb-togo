'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/lib/i18n';
import { LoadingSpinner } from '@/components/ui';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  MAJOR_CITY_IDS,
  TOGO_GEO_SOURCE,
  TOGO_REGIONS_URL,
  buildTogoProjection,
  bubbleRadius,
  layerCount,
  type MapCityBucket,
  type MapLayer,
  type TogoRegionsCollection,
} from './geo';

let regionsCache: TogoRegionsCollection | null = null;
let regionsInFlight: Promise<TogoRegionsCollection | null> | null = null;

/** Loads the static region boundaries once per session (see TOGO_REGIONS_URL). */
export function useTogoRegions(): {
  regions: TogoRegionsCollection | null;
  failed: boolean;
} {
  const [regions, setRegions] = useState<TogoRegionsCollection | null>(regionsCache);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (regionsCache) return;
    regionsInFlight ??= fetch(TOGO_REGIONS_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((fc: TogoRegionsCollection | null) => {
        if (fc && fc.type === 'FeatureCollection' && Array.isArray(fc.features)) regionsCache = fc;
        else regionsInFlight = null;
        return regionsCache;
      })
      .catch(() => {
        regionsInFlight = null;
        return null;
      });
    let alive = true;
    regionsInFlight.then((fc) => {
      if (!alive) return;
      if (fc) setRegions(fc);
      else setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  return { regions, failed };
}

type Tooltip = { x: number; y: number; bucket: MapCityBucket };

/** Nudges (SVG units) so region names do not sit on their capital's marker. */
const REGION_LABEL_OFFSET: Record<string, [number, number]> = {
  plateaux: [0, -50],
  kara: [-10, 30],
  maritime: [-20, -10],
};

/**
 * Interactive SVG map of Togo: the real ADM1 regions (geoBoundaries) drawn
 * through a Mercator projection, plus one bubble per city (same projection)
 * sized by the count of the active layers.
 */
export default function TogoMap({
  cities,
  layers,
  selectedId,
  onSelect,
  region,
  onRegionSelect,
  className = '',
}: {
  cities: MapCityBucket[];
  layers: Record<MapLayer, boolean>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Region filter: other regions are dimmed. */
  region: string | null;
  /** Clicking a region toggles the region filter. */
  onRegionSelect?: (id: string | null) => void;
  className?: string;
}) {
  const t = useT();
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [hoverRegion, setHoverRegion] = useState<string | null>(null);
  const { regions, failed } = useTogoRegions();
  const geo = useMemo(() => (regions ? buildTogoProjection(regions) : null), [regions]);

  const markers = useMemo(
    () =>
      !geo
        ? []
        : cities
            .filter((c) => c.lat !== null && c.lng !== null)
            .map((c) => {
              const { x, y } = geo.project(c.lat as number, c.lng as number);
              const count = layerCount(c, layers);
              return { bucket: c, x, y, count, r: bubbleRadius(count) };
            })
            // Small bubbles on top so they stay clickable.
            .sort((a, b) => b.r - a.r),
    [cities, layers, geo],
  );

  if (!geo) {
    return (
      <div className={`flex min-h-[320px] items-center justify-center ${className}`}>
        {failed ? <p className="text-sm text-body dark:text-bodydark">{t('geo.map.loadError')}</p> : <LoadingSpinner />}
      </div>
    );
  }

  const show = (e: React.MouseEvent, bucket: MapCityBucket) => {
    const host = (e.currentTarget as SVGElement).ownerSVGElement?.parentElement;
    const rect = host?.getBoundingClientRect();
    setTooltip({
      x: rect ? e.clientX - rect.left : 0,
      y: rect ? e.clientY - rect.top : 0,
      bucket,
    });
  };

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-label={t('geo.map.aria')}
        className="mx-auto h-auto w-full max-h-[75vh]"
        onClick={() => onSelect(null)}
      >
        {/* Regions */}
        {geo.regions.map((r) => {
          const active = !region || region === r.id;
          const hovered = hoverRegion === r.id;
          return (
            <path
              key={r.id}
              d={r.d}
              className={`transition-colors ${
                region === r.id
                  ? 'fill-primary/25 stroke-primary'
                  : hovered
                    ? 'fill-primary/15 stroke-bodydark2 dark:stroke-bodydark/60'
                    : active
                      ? 'fill-gray-2 stroke-bodydark2/70 dark:fill-meta-4 dark:stroke-bodydark/40'
                      : 'fill-gray-2/50 stroke-bodydark2/40 dark:fill-meta-4/40 dark:stroke-bodydark/20'
              } ${onRegionSelect ? 'cursor-pointer' : ''}`}
              strokeWidth={region === r.id ? 2 : 1.5}
              strokeLinejoin="round"
              onMouseEnter={() => setHoverRegion(r.id)}
              onMouseLeave={() => setHoverRegion(null)}
              onClick={(e) => {
                if (!onRegionSelect) return;
                e.stopPropagation();
                onRegionSelect(region === r.id ? null : r.id);
              }}
            >
              <title>{t(`geo.region.${r.id}`)}</title>
            </path>
          );
        })}

        {/* Region labels */}
        {geo.regions.map((r) => {
          const dim = region && region !== r.id;
          return (
            <text
              key={`label-${r.id}`}
              x={r.centroid[0] + (REGION_LABEL_OFFSET[r.id]?.[0] ?? 0)}
              y={r.centroid[1] + (REGION_LABEL_OFFSET[r.id]?.[1] ?? 0)}
              textAnchor="middle"
              className={`pointer-events-none select-none fill-bodydark2 text-[14px] font-bold uppercase tracking-[0.25em] dark:fill-bodydark ${
                dim ? 'opacity-25' : 'opacity-60'
              }`}
            >
              {t(`geo.region.${r.id}`)}
            </text>
          );
        })}

        {/* City markers */}
        {markers.map(({ bucket, x, y, count, r }) => {
          const dim = region && bucket.region !== region;
          const selected = selectedId === bucket.id;
          const has = count > 0;
          const core = has ? Math.max(7, r * 0.6) : 3.5;
          return (
            <g
              key={bucket.id}
              className={`cursor-pointer transition-opacity ${dim ? 'opacity-20' : 'opacity-100'}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(selected ? null : bucket.id);
              }}
              onMouseEnter={(e) => show(e, bucket)}
              onMouseMove={(e) => show(e, bucket)}
              onMouseLeave={() => setTooltip(null)}
            >
              {has && (
                <circle
                  cx={x}
                  cy={y}
                  r={r + (selected ? 6 : 0)}
                  className={`fill-primary transition-all ${selected ? 'opacity-40' : 'opacity-20'}`}
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={core}
                className={
                  has
                    ? `fill-primary stroke-white dark:stroke-boxdark ${selected ? 'stroke-[3px]' : 'stroke-2'}`
                    : 'fill-bodydark2 dark:fill-bodydark'
                }
              />
              {has && (
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  className="pointer-events-none select-none fill-white text-[12px] font-bold"
                >
                  {count}
                </text>
              )}
              {(has || selected || MAJOR_CITY_IDS.has(bucket.id)) && (
                <text
                  x={x}
                  y={y + core + 13}
                  textAnchor="middle"
                  className={`pointer-events-none select-none fill-black text-[12px] dark:fill-white ${
                    has || selected ? 'font-semibold' : 'opacity-70'
                  }`}
                >
                  {bucket.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <p className="mt-2 text-center text-[11px] text-body dark:text-bodydark">
        {t('geo.map.source')}{' '}
        <a href={TOGO_GEO_SOURCE.url} target="_blank" rel="noreferrer" className="underline hover:text-primary">
          {TOGO_GEO_SOURCE.name}
        </a>{' '}
        ({TOGO_GEO_SOURCE.license}) ·{' '}
        <a href={TOGO_GEO_SOURCE.dataUrl} target="_blank" rel="noreferrer" className="underline hover:text-primary">
          {TOGO_GEO_SOURCE.data}
        </a>
      </p>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 w-max max-w-[220px] -translate-x-1/2 -translate-y-full rounded-md border border-stroke bg-white px-3 py-2 text-xs shadow-lg dark:border-strokedark dark:bg-boxdark"
          style={{ left: tooltip.x, top: tooltip.y - 12 }}
        >
          <p className="font-semibold text-black dark:text-white">{tooltip.bucket.name}</p>
          <p className="text-body dark:text-bodydark">
            {t('geo.tooltip.players', { n: tooltip.bucket.counts.players })} ·{' '}
            {t('geo.tooltip.teams', { n: tooltip.bucket.counts.teams })} ·{' '}
            {t('geo.tooltip.competitions', {
              n: tooltip.bucket.counts.tournaments + tooltip.bucket.counts.events + tooltip.bucket.counts.drafts,
            })}
          </p>
        </div>
      )}
    </div>
  );
}
