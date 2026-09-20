/**
 * Shared types and projection helpers for the Togo map (issue #70).
 * Mirrors the backend `src/geo` module payloads.
 */

import { geoCentroid, geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';

/* ------------------------------------------------------------------ */
/* Region boundaries                                                   */
/* ------------------------------------------------------------------ */

/**
 * The five administrative regions of Togo (ADM1) are served as a static
 * GeoJSON from `public/geo/togo-regions.geojson`.
 *
 * Source: geoBoundaries (www.geoboundaries.org), gbOpen release, TGO ADM1
 * simplified geometry, build of Dec 12, 2023 (commit 9469f09). Boundary data
 * derived from OpenStreetMap contributors, Open Data Commons Open Database
 * License (ODbL) 1.0. Coordinates are rounded to 4 decimals and exterior
 * rings rewound clockwise as d3-geo expects.
 * Runfola, D. et al. (2020) geoBoundaries: A global database of political
 * administrative boundaries. PLoS ONE 15(4): e0231866.
 */
export const TOGO_REGIONS_URL = '/geo/togo-regions.geojson';

export const TOGO_GEO_SOURCE = {
  name: 'geoBoundaries (gbOpen, TGO ADM1)',
  url: 'https://www.geoboundaries.org/',
  license: 'ODbL 1.0',
  /** ODbL requires crediting the upstream data producer. */
  data: '© OpenStreetMap contributors',
  dataUrl: 'https://www.openstreetmap.org/copyright',
};

export type TogoRegionFeature = {
  type: 'Feature';
  properties: { id: string; name: string; iso: string };
  geometry: { type: 'Polygon'; coordinates: number[][][] };
};

export type TogoRegionsCollection = {
  type: 'FeatureCollection';
  features: TogoRegionFeature[];
};

export type GeoRegion = { id: string; name: string };

export type GeoCity = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
};

export type GeoCities = {
  regions: GeoRegion[];
  cities: GeoCity[];
  other: { id: string; name: string };
};

export type MapPlayerPreview = {
  id: string;
  username: string;
  avatar: string | null;
};

export type MapCityBucket = {
  id: string;
  name: string;
  region: string | null;
  lat: number | null;
  lng: number | null;
  players: number;
  topPlayers: MapPlayerPreview[];
  teams: {
    id: string;
    name: string;
    image: string | null;
    type: string;
    memberCount: number;
  }[];
  tournaments: {
    id: string;
    name: string;
    status: string | null;
    startDate: string | null;
    endDate: string | null;
    upcoming: boolean;
  }[];
  events: {
    id: string;
    title: string;
    type: string | null;
    date: string | null;
    time: string | null;
    upcoming: boolean;
  }[];
  drafts: {
    id: string;
    name: string;
    status: string | null;
    category: string | null;
  }[];
  counts: {
    players: number;
    teams: number;
    tournaments: number;
    events: number;
    drafts: number;
    upcoming: number;
    past: number;
    total: number;
  };
};

export type MapPayload = {
  season: { id: string; name: string } | null;
  totals: {
    players: number;
    teams: number;
    tournaments: number;
    events: number;
    drafts: number;
    located: number;
    unlocated: number;
  };
  cities: MapCityBucket[];
  other: MapCityBucket;
};

export type MapLayer = 'players' | 'teams' | 'competitions';

export const OTHER_CITY_ID = 'other';
export const OTHER_CITY_NAME = 'Autre';

/** Number shown on a bubble for the active layers. */
export function layerCount(bucket: MapCityBucket, layers: Record<MapLayer, boolean>): number {
  let n = 0;
  if (layers.players) n += bucket.counts.players;
  if (layers.teams) n += bucket.counts.teams;
  if (layers.competitions) n += bucket.counts.tournaments + bucket.counts.events + bucket.counts.drafts;
  return n;
}

/* ------------------------------------------------------------------ */
/* Projection                                                          */
/* ------------------------------------------------------------------ */

export const MAP_WIDTH = 520;
export const MAP_HEIGHT = 1000;
export const MAP_PADDING = 24;

export type TogoProjection = {
  projection: GeoProjection;
  path: GeoPath;
  regions: {
    feature: TogoRegionFeature;
    id: string;
    d: string;
    centroid: [number, number];
  }[];
  /** Projects a real lat/lng into SVG coordinates. */
  project: (lat: number, lng: number) => { x: number; y: number };
};

/**
 * Mercator projection fitted to the real Togo regions (geoBoundaries ADM1),
 * shared by the region outlines and the city markers so both line up.
 */
export function buildTogoProjection(
  regions: TogoRegionsCollection,
  width = MAP_WIDTH,
  height = MAP_HEIGHT,
): TogoProjection {
  const projection = geoMercator().fitExtent(
    [
      [MAP_PADDING, MAP_PADDING],
      [width - MAP_PADDING, height - MAP_PADDING],
    ],
    regions as any,
  );
  const path = geoPath(projection);
  return {
    projection,
    path,
    regions: regions.features.map((feature) => {
      const c = projection(geoCentroid(feature as any)) ?? [0, 0];
      return {
        feature,
        id: feature.properties.id,
        d: path(feature as any) ?? '',
        centroid: [c[0], c[1]],
      };
    }),
    project: (lat, lng) => {
      const p = projection([lng, lat]);
      return p ? { x: p[0], y: p[1] } : { x: -100, y: -100 };
    },
  };
}

/** Regional capitals: always labelled, even when empty. */
export const MAJOR_CITY_IDS = new Set(['lome', 'atakpame', 'sokode', 'kara', 'dapaong']);

/** Bubble radius (SVG units) from a count: sqrt scale, clamped. */
export function bubbleRadius(count: number): number {
  if (count <= 0) return 0;
  return Math.min(36, 9 + Math.sqrt(count) * 5);
}
