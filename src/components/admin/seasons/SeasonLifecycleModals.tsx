'use client';

import { Lock, SlidersHorizontal } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { Button, Badge, LoadingSpinner, Input, Select, Table, Th, Td } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { SeasonPodium } from '@/components/seasons/shared';
import type { LifecycleAction, SeasonLifecycle } from './useSeasonLifecycle';

// Compact field sizing for the modal forms (primitives default to a taller field).
const fieldCls = '!px-3 !py-2 text-sm';

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
          <p className="text-sm text-ink-2">{t('admin.seasons.lifecycle.closeIntro')}</p>
          {previewLoading ? (
            <LoadingSpinner size="md" className="py-8" />
          ) : preview ? (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="blue">{t('admin.seasons.summary.matches', { n: preview.matches.completed, total: preview.matches.total })}</Badge>
                <Badge variant="purple">{t('admin.seasons.summary.teams', { n: preview.standings.length })}</Badge>
              </div>
              <div className="rounded-lg border border-line-subtle bg-surface-2/60 p-4">
                <p className="eyebrow mb-3 text-center !text-ink-3">
                  {t('admin.seasons.summary.podiumPreview')}
                </p>
                <SeasonPodium podium={preview.podium} t={t} compact />
              </div>
              {preview.standings.length > 0 && (
                <div className="max-h-48 overflow-auto rounded-lg border border-line-subtle">
                  <Table className="text-xs">
                    <thead className="sticky top-0 z-10 bg-surface-2">
                      <tr className="border-b border-line-subtle">
                        <Th className="py-1.5">#</Th>
                        <Th className="py-1.5">{t('seasons.standings.team')}</Th>
                        <Th className="py-1.5" align="right">{t('seasons.standings.played')}</Th>
                        <Th className="py-1.5" align="right">{t('seasons.standings.wins')}</Th>
                        <Th className="py-1.5" align="right">{t('seasons.standings.losses')}</Th>
                        <Th className="py-1.5" align="right">{t('seasons.standings.diff')}</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.standings.map((r) => (
                        <tr key={r.teamId} className="border-b border-line-subtle last:border-b-0">
                          <Td className="py-1.5 text-ink-3">{r.rank}</Td>
                          <Td className="py-1.5 font-medium">{r.team.name}</Td>
                          <Td className="py-1.5" align="right">{r.played}</Td>
                          <Td className="py-1.5 text-accent-green" align="right">{r.wins}</Td>
                          <Td className="py-1.5 text-accent-red" align="right">{r.losses}</Td>
                          <Td className="py-1.5" align="right">{r.scoreDiff > 0 ? `+${r.scoreDiff}` : r.scoreDiff}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              {preview.matches.completed === 0 && (
                <label className="flex cursor-pointer items-start gap-2 text-sm text-accent-gold">
                  <input type="checkbox" className="mt-0.5 accent-primary" checked={force} onChange={(e) => setForce(e.target.checked)} />
                  {t('admin.seasons.lifecycle.forceClose')}
                </label>
              )}
            </>
          ) : (
            <p className="text-sm text-accent-red">{t('admin.esport.errorGeneric')}</p>
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
            <p className="text-xs text-ink-3">{t('admin.seasons.settings.hint')}</p>
            <Select
              label={t('admin.seasons.settings.qualifyTop')}
              value={settings.qualifyTop}
              onChange={(e: any) => setSettings((v) => ({ ...v, qualifyTop: Number(e.target.value) }))}
              className={fieldCls}
              options={[1, 2, 3, 4, 6, 8].map((n) => ({ value: n, label: t('admin.seasons.settings.topN', { n }) }))}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(['win', 'draw', 'loss'] as const).map((key) => (
                <Input
                  key={key}
                  label={t(`admin.seasons.settings.${key}`)}
                  type="number"
                  min={0}
                  max={100}
                  value={settings[key]}
                  onChange={(e: any) => setSettings((v) => ({ ...v, [key]: Number(e.target.value) }))}
                  className={`${fieldCls} num`}
                />
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
