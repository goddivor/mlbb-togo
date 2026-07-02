'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-blue';

export default function AdminCreateTeamPage() {
  return (
    <Suspense fallback={null}>
      <CreateTeamForm />
    </Suspense>
  );
}

function CreateTeamForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const requestId = params.get('requestId') || '';
  const nameParam = params.get('name') || '';

  const [request, setRequest] = useState<any>(null);
  const [form, setForm] = useState({ name: nameParam, image: '', description: '', isRecruiting: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    api.teamRequests
      .get(requestId)
      .then((r: any) => {
        if (r) {
          setRequest(r);
          setForm((f) => ({ ...f, name: f.name || r.proposedName || '' }));
        }
      })
      .catch(() => {});
  }, [requestId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const team: any = await api.esport.createTeam({
        name: form.name.trim(),
        image: form.image.trim() || undefined,
        description: form.description.trim() || undefined,
        isRecruiting: form.isRecruiting,
        type: 'community',
        requestId: requestId || undefined,
      });
      toast.success(t('admin.esport.saved'));
      router.replace(team?.id ? `/teams/${team.id}` : '/admin/esport');
    } catch (err: any) {
      toast.error(err?.message || t('admin.esport.errorGeneric'));
      setSaving(false);
    }
  };

  const requester = request?.requester;

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto">
      <Link
        href="/admin/requests"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4"
      >
        <ArrowLeft size={16} /> {t('requests.title')}
      </Link>

      <h1 className="text-2xl font-bold text-white mb-1">{t('admin.teams.createTitle')}</h1>
      {requester && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <span>{t('admin.teams.fromRequest')}</span>
          {requester.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc(requester.avatar, 48)}
              alt=""
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : null}
          <span className="text-gray-200 font-medium">
            {requester.displayName || requester.username}
          </span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-3 mt-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.teamName')}</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.teamImage')}</label>
          <input
            className={inputCls}
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.teamDesc')}</label>
          <textarea
            className={`${inputCls} min-h-[90px] resize-y`}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            className="accent-neon-blue"
            checked={form.isRecruiting}
            onChange={(e) => setForm({ ...form, isRecruiting: e.target.checked })}
          />
          {t('admin.esport.recruiting')}
        </label>
        <div className="flex gap-2 pt-2">
          <Button size="sm" type="submit" disabled={saving}>
            <Check size={16} /> {t('admin.esport.create')}
          </Button>
          <Link href="/admin/requests">
            <Button size="sm" variant="ghost" type="button">
              {t('admin.esport.cancel')}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
