'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import type { Season, SeasonSummary } from '@/store/useSeasonStore';

export type LifecycleAction = 'activate' | 'playoffs' | 'reopen';

export type StandingsSettings = { qualifyTop: number; win: number; draw: number; loss: number };

const DEFAULT_SETTINGS: StandingsSettings = { qualifyTop: 4, win: 3, draw: 1, loss: 0 };

/**
 * Season lifecycle state shared by the seasons list and the league control
 * room: confirmations (activate / playoffs / reopen), the closing flow with
 * its frozen-summary preview and the standings settings editor. Render the
 * matching UI with `SeasonLifecycleButtons` and `SeasonLifecycleModals`.
 */
export function useSeasonLifecycle(onChanged?: () => void | Promise<void>) {
  const t = useT();
  const [pending, setPending] = useState<{ action: LifecycleAction; season: Season } | null>(null);
  const [confirming, setConfirming] = useState(false);
  // Closing flow: preview of the frozen summary before confirming.
  const [closing, setClosing] = useState<Season | null>(null);
  const [preview, setPreview] = useState<SeasonSummary | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [force, setForce] = useState(false);
  // Standings settings (qualification threshold + points rule) per season.
  const [settingsFor, setSettingsFor] = useState<Season | null>(null);
  const [settings, setSettings] = useState<StandingsSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const errMsg = (e: any) => e?.message || t('admin.esport.errorGeneric');

  const changed = async () => {
    try {
      await onChanged?.();
    } catch {
      /* the caller reports its own errors */
    }
  };

  const ask = (action: LifecycleAction, season: Season) => setPending({ action, season });

  const runPending = async () => {
    if (!pending) return;
    setConfirming(true);
    try {
      const { action, season } = pending;
      if (action === 'activate') await api.esport.activateSeason(season.id);
      else if (action === 'playoffs') await api.esport.startSeasonPlayoffs(season.id);
      else if (action === 'reopen') await api.esport.reopenSeason(season.id);
      toast.success(t('admin.seasons.lifecycle.done'));
      await changed();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setConfirming(false);
      setPending(null);
    }
  };

  const openClose = async (season: Season) => {
    setClosing(season);
    setPreview(null);
    setForce(false);
    setPreviewLoading(true);
    try {
      const p = (await api.esport.seasonSummaryPreview(season.id)) as SeasonSummary | null;
      setPreview(p);
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmClose = async () => {
    if (!closing) return;
    setConfirming(true);
    try {
      await api.esport.closeSeason(closing.id, force);
      toast.success(t('admin.seasons.lifecycle.closed'));
      setClosing(null);
      await changed();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setConfirming(false);
    }
  };

  const openSettings = async (season: Season) => {
    setSettingsFor(season);
    setSettingsLoading(true);
    try {
      const data = await api.standings.settings(season.id);
      setSettings({
        qualifyTop: data?.qualifyTop ?? DEFAULT_SETTINGS.qualifyTop,
        win: data?.points?.win ?? DEFAULT_SETTINGS.win,
        draw: data?.points?.draw ?? DEFAULT_SETTINGS.draw,
        loss: data?.points?.loss ?? DEFAULT_SETTINGS.loss,
      });
    } catch (e: any) {
      toast.error(errMsg(e));
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settingsFor) return;
    setSettingsSaving(true);
    try {
      await api.standings.updateSettings(settingsFor.id, {
        qualifyTop: settings.qualifyTop,
        points: { win: settings.win, draw: settings.draw, loss: settings.loss },
      });
      toast.success(t('admin.seasons.settings.saved'));
      setSettingsFor(null);
    } catch (e: any) {
      toast.error(errMsg(e));
    } finally {
      setSettingsSaving(false);
    }
  };

  return {
    pending,
    confirming,
    ask,
    cancelPending: () => setPending(null),
    runPending,
    closing,
    preview,
    previewLoading,
    force,
    setForce,
    openClose,
    cancelClose: () => setClosing(null),
    confirmClose,
    settingsFor,
    settings,
    setSettings,
    settingsLoading,
    settingsSaving,
    openSettings,
    cancelSettings: () => setSettingsFor(null),
    saveSettings,
  };
}

export type SeasonLifecycle = ReturnType<typeof useSeasonLifecycle>;
