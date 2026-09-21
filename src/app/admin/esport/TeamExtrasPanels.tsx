'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, X, Check, UserCog, Trophy, Search, Award } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { Avatar, Badge, Button, LoadingSpinner } from '@/components/ui';
import toast from 'react-hot-toast';
import { STAFF_ROLES } from '@/components/teams/TeamStaff';
import ImageUpload from '@/components/ui/ImageUpload';

type TFn = (k: string, params?: Record<string, string | number>) => string;

const inputCls =
  'w-full rounded border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-base ease-out focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-60 dark:bg-surface-0/60';
const labelCls = 'mb-1.5 block text-xs font-medium text-ink-2';

type Pending = {
  message: string;
  action: () => Promise<any>;
  confirmLabel?: string;
  danger?: boolean;
} | null;

/* ------------------------------------------------------------------ */
/* Staff panel                                                         */
/* ------------------------------------------------------------------ */

type StaffForm = { name: string; role: string; avatar: string; bio: string; userId: string };
const emptyStaff: StaffForm = { name: '', role: 'coach', avatar: '', bio: '', userId: '' };

export function StaffPanel({ team, t, errMsg, onAsk }: { team: any; t: TFn; errMsg: (e: any) => string; onAsk: (p: Pending) => void }) {
  const [staff, setStaff] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<any | 'new' | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyStaff);
  const [players, setPlayers] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  const load = () =>
    api.esport.teamStaff(team.id).then((r: any) => setStaff(Array.isArray(r) ? r : [])).catch(() => setStaff([]));

  useEffect(() => {
    load();
    api.users.list().then((u: any) => setPlayers(Array.isArray(u) ? u : [])).catch(() => setPlayers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id]);

  const openNew = () => { setEditing('new'); setForm(emptyStaff); setQuery(''); };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name || '', role: s.role || 'coach', avatar: s.avatar || '', bio: s.bio || '', userId: s.userId || '' });
    setQuery('');
  };

  const linked = useMemo(() => players.find((p) => p.id === form.userId) || null, [players, form.userId]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return players
      .filter((p) => (p.displayName || '').toLowerCase().includes(q) || (p.username || '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [players, query]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() && !form.userId) { toast.error(t('admin.esport.staffName')); return; }
    setBusy(true);
    try {
      const payload: any = {
        name: form.name.trim() || undefined,
        role: form.role,
        avatar: form.avatar.trim() || null,
        bio: form.bio.trim() || null,
        userId: form.userId || null,
      };
      const res = editing === 'new'
        ? await api.esport.addStaff(team.id, payload)
        : await api.esport.updateStaff(team.id, editing.id, payload);
      setStaff(Array.isArray(res) ? res : []);
      toast.success(t('admin.esport.saved'));
      setEditing(null);
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const askRemove = (s: any) =>
    onAsk({
      message: t('admin.esport.removeStaffConfirm'),
      confirmLabel: t('admin.esport.remove'),
      danger: true,
      action: async () => {
        const res = await api.esport.removeStaff(team.id, s.id);
        setStaff(Array.isArray(res) ? res : []);
        toast.success(t('admin.esport.deleted'));
      },
    });

  if (staff === null) return <LoadingSpinner size="md" className="py-10" />;

  return (
    <div className="space-y-4">
      {staff.length === 0 ? (
        <div className="text-sm text-ink-3">{t('admin.esport.staffEmpty')}</div>
      ) : (
        <div className="space-y-2">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-md border border-line-subtle bg-surface-2/60 p-2.5">
              {s.avatar ? (
                <Avatar name={s.name || 'S'} src={avatarSrc(s.avatar, 64)} size="md" square className="shrink-0" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md cut-corners-sm bg-accent-gold/15 text-accent-gold"><UserCog size={16} /></div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-ink-1">{s.name}</span>
                  <Badge variant="gold" size="sm">{t('staffRole.' + (s.role || 'other'))}</Badge>
                  {s.user && <span className="text-xs text-ink-3">@{s.user.username}</span>}
                </div>
                {s.bio && <p className="truncate text-xs text-ink-2">{s.bio}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button size="sm" variant="ghost" title={t('admin.esport.editStaff')} onClick={() => openEdit(s)} disabled={busy}><Pencil size={14} /></Button>
                <Button size="sm" variant="danger" title={t('admin.esport.remove')} onClick={() => askRemove(s)} disabled={busy}><X size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <form onSubmit={submit} className="space-y-3 rounded-md border border-line-subtle bg-surface-1 p-3">
          <p className="eyebrow">
            {editing === 'new' ? t('admin.esport.addStaff') : t('admin.esport.editStaff')}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t('admin.esport.staffName')}</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={linked ? linked.displayName || linked.username : ''} />
              {form.userId && <p className="mt-1 text-[11px] text-ink-3">{t('admin.esport.staffNameHint')}</p>}
            </div>
            <div>
              <label className={labelCls}>{t('admin.esport.staffRole')}</label>
              <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {STAFF_ROLES.map((r) => <option key={r} value={r}>{t('staffRole.' + r)}</option>)}
              </select>
            </div>
          </div>
          <ImageUpload
            purpose="team-staff"
            targetId={editing === 'new' ? null : editing.id}
            label={t('admin.esport.staffAvatar')}
            value={form.avatar}
            onChange={(avatar) => setForm((f) => ({ ...f, avatar }))}
            allowUrl
          />
          <div>
            <label className={labelCls}>{t('admin.esport.staffBio')}</label>
            <textarea className={`${inputCls} min-h-[60px] resize-y`} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>{t('admin.esport.staffUser')}</label>
            {linked ? (
              <div className="flex items-center gap-2 rounded border border-line-strong bg-surface-2 px-3 py-2 text-sm">
                <span className="flex-1 truncate text-ink-1">{linked.displayName || linked.username} <span className="text-xs text-ink-3">@{linked.username}</span></span>
                <button type="button" className="text-accent-red" title={t('admin.esport.remove')} onClick={() => setForm({ ...form, userId: '' })}><X size={14} /></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('admin.esport.searchPlayer')} className={`${inputCls} pl-9`} />
                {results.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-line-strong bg-surface-1 shadow-elev-2">
                    {results.map((p) => (
                      <button key={p.id} type="button" onClick={() => { setForm({ ...form, userId: p.id }); setQuery(''); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-fast hover:bg-surface-2">
                        <span className="truncate text-ink-1">{p.displayName || p.username}</span>
                        <span className="text-xs text-ink-3">@{p.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" disabled={busy}><Check size={15} /> {t('admin.esport.save')}</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setEditing(null)}>{t('admin.esport.cancel')}</Button>
          </div>
        </form>
      ) : (
        <div className="border-t border-line-subtle pt-3">
          <Button size="sm" variant="secondary" onClick={openNew}><Plus size={15} /> {t('admin.esport.addStaff')}</Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Honours panel                                                       */
/* ------------------------------------------------------------------ */

type HonourRow = { id?: string; title: string; year: string; placement: string; description: string };

export function HonoursPanel({ team, t, errMsg, onSaved }: { team: any; t: TFn; errMsg: (e: any) => string; onSaved?: () => void }) {
  const [rows, setRows] = useState<HonourRow[] | null>(null);
  const [derived, setDerived] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.esport
      .teamHonours(team.id)
      .then((list: any) => {
        const all = Array.isArray(list) ? list : [];
        setDerived(all.filter((h) => h.source === 'derived'));
        setRows(
          all
            .filter((h) => h.source === 'manual')
            .map((h) => ({ id: h.id, title: h.title || '', year: h.year ? String(h.year) : '', placement: h.placement ? String(h.placement) : '', description: h.description || '' })),
        );
      })
      .catch(() => { setRows([]); setDerived([]); });
  }, [team.id]);

  const update = (i: number, patch: Partial<HonourRow>) =>
    setRows((prev) => (prev ? prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) : prev));
  const remove = (i: number) => setRows((prev) => (prev ? prev.filter((_, idx) => idx !== i) : prev));
  const add = () => setRows((prev) => [...(prev || []), { title: '', year: '', placement: '', description: '' }]);

  const save = async () => {
    if (!rows) return;
    setSaving(true);
    try {
      await api.esport.setHonours(
        team.id,
        rows.map((r) => ({
          id: r.id,
          title: r.title.trim(),
          year: r.year ? Number(r.year) : null,
          placement: r.placement ? Number(r.placement) : null,
          description: r.description.trim() || null,
        })),
      );
      toast.success(t('admin.esport.saved'));
      onSaved?.();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  if (rows === null) return <LoadingSpinner size="md" className="py-10" />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-2">{t('admin.esport.honoursHint')}</p>

      {derived.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {derived.map((h) => (
            <Badge key={h.id} variant={h.placement === 1 ? 'gold' : 'purple'} size="sm" className="gap-1">
              <Award size={11} /> {h.title}{h.year ? ` · ${h.year}` : ''} · #{h.placement}
            </Badge>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-sm text-ink-3">{t('admin.esport.honoursEmpty')}</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.id || i} className="space-y-2 rounded-md border border-line-subtle bg-surface-2/60 p-2.5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_5rem_5rem_auto]">
                <input className={inputCls} placeholder={t('admin.esport.honourTitle')} value={r.title} onChange={(e) => update(i, { title: e.target.value })} required />
                <input className={`${inputCls} num`} type="number" min={1900} max={2200} placeholder={t('admin.esport.honourYear')} value={r.year} onChange={(e) => update(i, { year: e.target.value })} />
                <input className={`${inputCls} num`} type="number" min={1} max={99} placeholder={t('admin.esport.honourPlacement')} value={r.placement} onChange={(e) => update(i, { placement: e.target.value })} />
                <Button size="sm" variant="danger" type="button" title={t('admin.esport.remove')} onClick={() => remove(i)}><X size={14} /></Button>
              </div>
              <input className={inputCls} placeholder={t('admin.esport.honourDesc')} value={r.description} onChange={(e) => update(i, { description: e.target.value })} />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
        <Button size="sm" variant="secondary" type="button" onClick={add}><Plus size={15} /> {t('admin.esport.addHonour')}</Button>
        <Button size="sm" type="button" onClick={save} disabled={saving || rows.some((r) => !r.title.trim())}><Trophy size={15} /> {t('admin.esport.save')}</Button>
      </div>
    </div>
  );
}
