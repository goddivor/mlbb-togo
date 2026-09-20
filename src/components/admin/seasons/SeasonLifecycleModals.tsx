'use client';

import { Lock, SlidersHorizontal } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { SeasonPodium } from '@/components/seasons/shared';
import type { LifecycleAction, SeasonLifecycle } from './useSeasonLifecycle';

const fieldCls =
  'w-full rounded-sm border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:bg-meta-4';

/**
 * Modals backing `useSeasonLifecycle`: lifecycle confirmation, closing flow
 * with the frozen summary preview, and the standings settings editor.
 */
export default function SeasonLifecycleModals({ lifecycle }: { lifecycle: SeasonLifecycle }) {
  const t = useT();
  const {
    pending,
    confirming,
    cancelPending,
    runPending,
    closing,
    preview,
    previewLoading,
    force,
    setForce,
    cancelClose,
    confirmClose,
    settingsFor,
    settings,
    setSettings,
    settingsLoading,
    settingsSaving,
    cancelSettings,
    saveSettings,
  } = lifecycle;

  const copy: Record<LifecycleAction, { title: string; message: string; variant: any }> = {
    activate: {
      title: t('admin.seasons.lifecycle.activate'),
      message: t('admin.seasons.lifecycle.activateConfirm'),
      variant: 'success',
    },
    playoffs: {
      title: t('admin.seasons.lifecycle.playoffs'),
      message: t('admin.seasons.lifecycle.playoffsConfirm'),
      variant: 'warning',
    },
    reopen: {
      title: t('admin.seasons.lifecycle.reopen'),
      message: t('admin.seasons.lifecycle.reopenConfirm'),
      variant: 'warning',
    },
  };

  return (
    <>
      {/* Close with preview of the frozen podium */}
      <Modal
        open={!!closing}
        onClose={() => (confirming ? undefined : cancelClose())}
        closeLabel={t('common.close')}
        title={t('admin.seasons.lifecycle.close')}
        subtitle={closing?.name}
        icon={<Lock size={20} />}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-body dark:text-bodydark">{t('admin.seasons.lifecycle.closeIntro')}</p>
          {previewLoading ? (
            <LoadingSpinner size="md" className="py-8" />
          ) : preview ? (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="blue">{t('admin.seasons.summary.matches', { n: preview.matches.completed, total: preview.matches.total })}</Badge>
                <Badge variant="purple">{t('admin.seasons.summary.teams', { n: preview.standings.length })}</Badge>
              </div>
              <div className="rounded-lg border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4">
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-bodydark2">
                  {t('admin.seasons.summary.podiumPreview')}
                </p>
                <SeasonPodium podium={preview.podium} t={t} compact />
              </div>
              {preview.standings.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-stroke dark:border-strokedark">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-2 dark:bg-meta-4 text-bodydark2">
                      <tr>
                        <th className="px-2 py-1.5 text-left">#</th>
                        <th className="px-2 py-1.5 text-left">{t('seasons.standings.team')}</th>
                        <th className="px-2 py-1.5 text-right">{t('seasons.standings.played')}</th>
                        <th className="px-2 py-1.5 text-right">{t('seasons.standings.wins')}</th>
                        <th className="px-2 py-1.5 text-right">{t('seasons.standings.losses')}</th>
                        <th className="px-2 py-1.5 text-right">{t('seasons.standings.diff')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.standings.map((r) => (
                        <tr key={r.teamId} className="border-t border-stroke dark:border-strokedark">
                          <td className="px-2 py-1.5">{r.rank}</td>
                          <td className="px-2 py-1.5 font-medium text-black dark:text-white">{r.team.name}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{r.played}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-success">{r.wins}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-danger">{r.losses}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{r.scoreDiff > 0 ? `+${r.scoreDiff}` : r.scoreDiff}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {preview.matches.completed === 0 && (
                <label className="flex items-start gap-2 text-sm text-warning cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-primary" checked={force} onChange={(e) => setForce(e.target.checked)} />
                  {t('admin.seasons.lifecycle.forceClose')}
                </label>
              )}
            </>
          ) : (
            <p className="text-sm text-danger">{t('admin.esport.errorGeneric')}</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="danger"
              onClick={confirmClose}
              disabled={confirming || !preview || (preview.matches.completed === 0 && !force)}
              loading={confirming}
            >
              <Lock size={14} /> {t('admin.seasons.lifecycle.closeConfirm')}
            </Button>
            <Button size="sm" variant="ghost" type="button" disabled={confirming} onClick={cancelClose}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Standings settings */}
      <Modal
        open={!!settingsFor}
        onClose={cancelSettings}
        closeLabel={t('common.close')}
        title={t('admin.seasons.settings.title')}
        subtitle={settingsFor?.name}
        icon={<SlidersHorizontal size={20} />}
      >
        {settingsLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-bodydark2">{t('admin.seasons.settings.hint')}</p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                {t('admin.seasons.settings.qualifyTop')}
              </label>
              <select
                value={settings.qualifyTop}
                onChange={(e) => setSettings((v) => ({ ...v, qualifyTop: Number(e.target.value) }))}
                className={fieldCls}
              >
                {[1, 2, 3, 4, 6, 8].map((n) => (
                  <option key={n} value={n}>
                    {t('admin.seasons.settings.topN', { n })}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['win', 'draw', 'loss'] as const).map((key) => (
                <div key={key}>
                  <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                    {t(`admin.seasons.settings.${key}`)}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settings[key]}
                    onChange={(e) => setSettings((v) => ({ ...v, [key]: Number(e.target.value) }))}
                    className={fieldCls}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelSettings}>
                {t('admin.esport.cancel')}
              </Button>
              <Button onClick={saveSettings} loading={settingsSaving}>
                {t('admin.esport.save')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!pending}
        onClose={cancelPending}
        onConfirm={runPending}
        loading={confirming}
        variant={pending ? copy[pending.action].variant : 'info'}
        title={pending ? `${copy[pending.action].title} · ${pending.season.name}` : ''}
        message={pending ? copy[pending.action].message : ''}
        confirmLabel={pending ? copy[pending.action].title : ''}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
      />
    </>
  );
}
