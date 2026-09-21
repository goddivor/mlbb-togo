'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Select } from '@/components/ui';
import { OTHER_CITY_NAME, type GeoCities, type GeoCity } from './geo';

let cache: GeoCities | null = null;
let inFlight: Promise<GeoCities> | null = null;

/** Loads the static gazetteer once per session. */
export function useGeoCities(): GeoCities | null {
  const [data, setData] = useState<GeoCities | null>(cache);
  useEffect(() => {
    if (cache) return;
    inFlight ??= api.geo.cities().then((res: GeoCities) => {
      cache = res && Array.isArray(res.cities) ? res : { regions: [], cities: [], other: { id: 'other', name: OTHER_CITY_NAME } };
      return cache;
    });
    let alive = true;
    inFlight.then((res) => alive && setData(res)).catch(() => alive && setData({ regions: [], cities: [], other: { id: 'other', name: OTHER_CITY_NAME } }));
    return () => {
      alive = false;
    };
  }, []);
  return data;
}

/**
 * City select fed by GET /geo/cities, grouped by region, with an "Autre"
 * entry. The value is the canonical city name (what the API stores as free
 * text). A legacy value that is not in the list is kept as an extra option.
 */
export default function CitySelect({
  value,
  onChange,
  label,
  className,
  allowEmpty = true,
  disabled,
}: {
  value: string;
  onChange: (city: string) => void;
  label?: string;
  className?: string;
  /** Offer an empty "not specified" option. */
  allowEmpty?: boolean;
  disabled?: boolean;
}) {
  const t = useT();
  const geo = useGeoCities();

  const groups = useMemo(() => {
    if (!geo) return [];
    return geo.regions
      .map((r) => ({ region: r, cities: geo.cities.filter((c: GeoCity) => c.region === r.id) }))
      .filter((g) => g.cities.length > 0);
  }, [geo]);

  const known = useMemo(() => {
    const set = new Set<string>(['', OTHER_CITY_NAME]);
    geo?.cities.forEach((c) => set.add(c.name));
    if (geo?.other?.name) set.add(geo.other.name);
    return set;
  }, [geo]);

  return (
    <Select
      label={label ?? t('geo.city')}
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      className={className}
      disabled={disabled}
    >
      {allowEmpty && <option value="">{t('geo.city.none')}</option>}
      {value && !known.has(value) && <option value={value}>{value}</option>}
      {groups.map((g) => (
        <optgroup key={g.region.id} label={t(`geo.region.${g.region.id}`)}>
          {g.cities.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </optgroup>
      ))}
      <option value={geo?.other?.name ?? OTHER_CITY_NAME}>{t('geo.city.other')}</option>
    </Select>
  );
}
