'use client';

import { useCallback, useState } from 'react';
import { Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getToken, type CommunityBuild } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button, Select, Textarea } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { REPORT_REASONS, buildErrorMessage } from './shared';

type Patch = (id: string, patch: Partial<CommunityBuild>) => void;

/**
 * Like toggling (optimistic, idempotent on the API side) and the report
 * dialog, shared by the builds page and the hero modal. `patch` updates the
 * caller's copy of a build.
 */
export function useBuildInteractions(patch: Patch) {
  const t = useT();
  const [busy, setBusy] = useState<string | null>(null);
  const [reporting, setReporting] = useState<CommunityBuild | null>(null);
  const [reason, setReason] = useState<string>('spam');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const toggleLike = useCallback(
    async (build: CommunityBuild) => {
      if (!getToken()) {
        toast.error(t('communityBuilds.loginRequired'));
        return;
      }
      if (busy) return;
      const liked = !build.likedByMe;
      setBusy(build.id);
      patch(build.id, { likedByMe: liked, likesCount: Math.max(0, build.likesCount + (liked ? 1 : -1)) });
      try {
        const res = liked ? await api.communityBuilds.like(build.id) : await api.communityBuilds.unlike(build.id);
        patch(build.id, { likedByMe: res.liked, likesCount: res.likesCount });
      } catch (err) {
        patch(build.id, { likedByMe: build.likedByMe, likesCount: build.likesCount });
        toast.error(buildErrorMessage(t, err));
      } finally {
        setBusy(null);
      }
    },
    [busy, patch, t],
  );

  const openReport = useCallback(
    (build: CommunityBuild) => {
      if (!getToken()) {
        toast.error(t('communityBuilds.loginRequired'));
        return;
      }
      setReason('spam');
      setDetails('');
      setReporting(build);
    },
    [t],
  );

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporting) return;
    setSending(true);
    try {
      await api.communityBuilds.report(reporting.id, { reason, details: details.trim() || undefined });
      patch(reporting.id, { reportedByMe: true });
      toast.success(t('communityBuilds.report.sent'));
      setReporting(null);
    } catch (err) {
      toast.error(buildErrorMessage(t, err));
    } finally {
      setSending(false);
    }
  };

  const reportModal = (
    <Modal
      open={!!reporting}
      onClose={() => setReporting(null)}
      closeLabel={t('common.close')}
      size="sm"
      icon={<Flag size={20} />}
      title={t('communityBuilds.report.title')}
      subtitle={reporting?.title}
    >
      <form onSubmit={submitReport} className="space-y-3">
        <Select
          label={t('communityBuilds.report.reason')}
          value={reason}
          onChange={(e: any) => setReason(e.target.value)}
          options={REPORT_REASONS.map((r) => ({ value: r, label: t(`communityBuilds.report.reason.${r}`) }))}
        />
        <Textarea
          label={t('communityBuilds.report.details')}
          value={details}
          maxLength={500}
          rows={3}
          onChange={(e: any) => setDetails(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" size="sm" variant="ghost" onClick={() => setReporting(null)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" size="sm" variant="danger" loading={sending}>
            {t('communityBuilds.report.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );

  return { toggleLike, openReport, likeBusy: busy, reportModal };
}
