'use client';

import { Play, Flag, Lock, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui';
import type { Season } from '@/store/useSeasonStore';
import type { SeasonLifecycle } from './useSeasonLifecycle';

/**
 * Status-dependent lifecycle actions of a season (activate, playoffs, close,
 * reopen) plus the standings settings shortcut. Pair with
 * `SeasonLifecycleModals` rendered once on the page.
 */
export default function SeasonLifecycleButtons({
  season,
  lifecycle,
  showSettings = true,
  size = 'sm',
}: {
  season: Season;
  lifecycle: SeasonLifecycle;
  showSettings?: boolean;
  size?: 'sm' | 'md';
}) {
  const t = useT();
  return (
    <>
      {season.status === 'upcoming' && (
        <Button size={size} variant="success" onClick={() => lifecycle.ask('activate', season)}>
          <Play size={14} /> {t('admin.seasons.lifecycle.activate')}
        </Button>
      )}
      {season.status === 'active' && (
        <Button size={size} variant="secondary" onClick={() => lifecycle.ask('playoffs', season)}>
          <Flag size={14} /> {t('admin.seasons.lifecycle.playoffs')}
        </Button>
      )}
      {(season.status === 'active' || season.status === 'playoffs') && (
        <Button size={size} variant="outline" onClick={() => lifecycle.openClose(season)}>
          <Lock size={14} /> {t('admin.seasons.lifecycle.close')}
        </Button>
      )}
      {season.status === 'closed' && (
        <Button size={size} variant="ghost" onClick={() => lifecycle.ask('reopen', season)}>
          <RotateCcw size={14} /> {t('admin.seasons.lifecycle.reopen')}
        </Button>
      )}
      {showSettings && (
        <Button size={size} variant="ghost" onClick={() => lifecycle.openSettings(season)}>
          <SlidersHorizontal size={14} /> {t('admin.seasons.settings.action')}
        </Button>
      )}
    </>
  );
}
