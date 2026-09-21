'use client';

import { useEffect, useState } from 'react';
import { Check, KeyRound, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { Button } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import type { Role } from './types';

interface Props {
  user: any | null;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}

/** Multi-select of the roles held by one user (`PATCH /users/:id/roles`). */
export default function UserRolesModal({ user, roles, onClose, onSaved }: Props) {
  const t = useT();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setSelected(new Set(user.roleIds ?? []));
  }, [user]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.users.setRoles(user.id, Array.from(selected));
      toast.success(t('admin.users.rolesSaved'));
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      size="md"
      icon={<KeyRound size={20} />}
      title={t('admin.users.rolesTitle', { name: user?.displayName || user?.username || '' })}
    >
      <div className="space-y-4">
        <p className="text-sm text-ink-2">{t('admin.users.rolesHint')}</p>
        <ul className="space-y-2">
          {roles.map((role) => {
            const checked = selected.has(role.id);
            return (
              <li key={role.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors duration-fast',
                    checked ? 'border-primary/50 bg-primary/5' : 'border-line-subtle hover:bg-surface-2',
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-[rgb(var(--primary))]"
                    checked={checked}
                    onChange={() => toggle(role.id)}
                  />
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: role.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-ink-1">
                      {role.name}
                      {role.isSystem && <Lock size={12} className="text-ink-3" />}
                    </span>
                    {role.description && <span className="block truncate text-xs text-ink-3">{role.description}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-ink-3">
                    {t('admin.roles.permissionCount', { n: role.permissions.length })}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col-reverse gap-2 border-t border-line-subtle pt-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            {t('admin.roles.cancel')}
          </Button>
          <Button onClick={save} loading={saving}>
            <Check size={15} />
            {t('admin.roles.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
