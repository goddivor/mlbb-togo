'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, Button, Input, SectionCard, Textarea } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';

/** A catalog row: items, emblems and battle spells all share this shape. */
export interface CatalogEntity {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  type?: string | null;
  gold?: number | null;
  cooldown?: string | null;
  sort?: number | null;
}

/** Optional fields the section renders on top of name/description/icon/sort. */
export type ExtraField = 'type' | 'gold' | 'cooldown';

type Form = {
  name: string;
  description: string;
  icon: string;
  type: string;
  gold: string;
  cooldown: string;
  sort: string;
};

const emptyForm: Form = { name: '', description: '', icon: '', type: '', gold: '', cooldown: '', sort: '0' };

const toForm = (row: CatalogEntity): Form => ({
  name: row.name || '',
  description: row.description || '',
  icon: row.icon || '',
  type: row.type || '',
  gold: row.gold != null ? String(row.gold) : '',
  cooldown: row.cooldown || '',
  sort: String(row.sort ?? 0),
});

export default function CatalogEntitySection({
  title,
  icon,
  rows,
  extraFields,
  onCreate,
  onUpdate,
  onDelete,
  onChanged,
}: {
  title: string;
  icon: React.ReactNode;
  rows: CatalogEntity[];
  extraFields: ExtraField[];
  onCreate: (payload: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (id: string, payload: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onChanged: () => Promise<void> | void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogEntity | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<CatalogEntity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (row: CatalogEntity) => {
    setEditing(row);
    setForm(toForm(row));
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('admin.catalog.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      // Empty strings are sent as null on update so a field can be cleared.
      const blank = editing ? null : undefined;
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || blank,
        icon: form.icon.trim() || blank,
        sort: Number(form.sort) || 0,
      };
      if (extraFields.includes('type')) payload.type = form.type.trim() || blank;
      if (extraFields.includes('cooldown')) payload.cooldown = form.cooldown.trim() || blank;
      if (extraFields.includes('gold')) {
        payload.gold = form.gold.trim() === '' ? blank : Number(form.gold);
      }
      if (editing) await onUpdate(editing.id, payload);
      else await onCreate(payload);
      toast.success(t('admin.catalog.saved'));
      setOpen(false);
      await onChanged();
    } catch (err: any) {
      toast.error(err?.message || t('admin.catalog.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await onDelete(toDelete.id);
      toast.success(t('admin.catalog.deleted'));
      setToDelete(null);
      await onChanged();
    } catch (err: any) {
      toast.error(err?.message || t('admin.catalog.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SectionCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-black dark:text-white">{title}</h2>
          <Badge variant="purple" size="sm">
            {rows.length}
          </Badge>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} /> {t('admin.catalog.add')}
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-body dark:text-bodydark">
          {t('admin.catalog.emptyList')}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-start gap-3 rounded-lg border border-stroke bg-gray-2 p-3 dark:border-strokedark dark:bg-meta-4"
            >
              {row.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mlbbImg(row.icon, 80)}
                  alt={row.name}
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded border border-stroke bg-white dark:border-strokedark dark:bg-boxdark" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-black dark:text-white">{row.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-body dark:text-bodydark">
                  {row.type && <Badge size="sm">{row.type}</Badge>}
                  {row.gold != null && <span>{row.gold} g</span>}
                  {row.cooldown && <span>{row.cooldown}</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(row)} aria-label={t('admin.catalog.edit')}>
                  <Pencil size={14} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setToDelete(row)} aria-label={t('admin.catalog.delete')}>
                  <Trash2 size={14} className="text-danger" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeLabel={t('common.close')}
        title={editing ? t('admin.catalog.editEntry') : t('admin.catalog.newEntry')}
        subtitle={title}
        icon={icon}
      >
        <form onSubmit={submit} className="space-y-3">
          <Input
            label={t('admin.catalog.name')}
            value={form.name}
            onChange={(e: any) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Textarea
            label={t('admin.catalog.description')}
            value={form.description}
            onChange={(e: any) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label={t('admin.catalog.iconUrl')}
            value={form.icon}
            onChange={(e: any) => setForm({ ...form, icon: e.target.value })}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {extraFields.includes('type') && (
              <Input
                label={t('admin.catalog.type')}
                value={form.type}
                onChange={(e: any) => setForm({ ...form, type: e.target.value })}
              />
            )}
            {extraFields.includes('gold') && (
              <Input
                label={t('admin.catalog.gold')}
                type="number"
                value={form.gold}
                onChange={(e: any) => setForm({ ...form, gold: e.target.value })}
              />
            )}
            {extraFields.includes('cooldown') && (
              <Input
                label={t('admin.catalog.cooldown')}
                value={form.cooldown}
                onChange={(e: any) => setForm({ ...form, cooldown: e.target.value })}
                placeholder="60s"
              />
            )}
            <Input
              label={t('admin.catalog.sortOrder')}
              type="number"
              value={form.sort}
              onChange={(e: any) => setForm({ ...form, sort: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" size="sm" loading={saving} disabled={saving}>
              <Check size={16} /> {t('common.save')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        variant="danger"
        loading={deleting}
        title={t('admin.catalog.deleteTitle')}
        message={t('admin.catalog.deleteMessage', { name: toDelete?.name || '' })}
        confirmLabel={t('admin.catalog.delete')}
        cancelLabel={t('common.cancel')}
        closeLabel={t('common.close')}
      />
    </SectionCard>
  );
}
