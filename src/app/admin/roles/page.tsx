'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { KeyRound, Lock, Pencil, Plus, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { fadeUp, stagger, still } from '@/lib/motion';
import { Badge, Button, Card, EmptyState, LoadingSpinner, PageHeader, StatTile } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import RoleEditorModal from '@/components/admin/roles/RoleEditorModal';
import { pick, type PermissionCatalogue, type Role } from '@/components/admin/roles/types';

const EMPTY_CATALOGUE: PermissionCatalogue = { groups: [], permissions: [] };

/** RBAC administration: roles, their permissions and their members. */
export default function AdminRolesPage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const reduce = useReducedMotion();
  const [roles, setRoles] = useState<Role[]>([]);
  const [catalogue, setCatalogue] = useState<PermissionCatalogue>(EMPTY_CATALOGUE);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Role | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    () =>
      api.roles
        .list()
        .then((l: any) => setRoles(Array.isArray(l) ? l : []))
        .catch(() => setRoles([])),
    [],
  );

  useEffect(() => {
    Promise.all([
      load(),
      api.roles.catalogue().then((c: any) => setCatalogue(c?.permissions ? c : EMPTY_CATALOGUE)),
    ]).finally(() => setLoading(false));
  }, [load]);

  const labelOf = useMemo(() => {
    const map = new Map(catalogue.permissions.map((p) => [p.key, pick(p.label, lang)]));
    return (key: string) => map.get(key) || key;
  }, [catalogue, lang]);

  const totalPermissions = catalogue.permissions.length;
  const staffCount = roles.reduce((n, r) => n + (r.memberCount || 0), 0);

  const openEditor = (role: Role | null) => {
    setEditing(role);
    setEditorOpen(true);
  };

  const runDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.roles.remove(toDelete.id);
      toast.success(t('admin.roles.deleted'));
      setToDelete(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<KeyRound size={28} />}
        eyebrow={t('nav.section.system')}
        title={t('admin.roles.title')}
        subtitle={t('admin.roles.subtitle')}
        variant="purple"
        action={
          <Button onClick={() => openEditor(null)}>
            <Plus size={16} />
            {t('admin.roles.new')}
          </Button>
        }
      />

      {!loading && (
        <Card className="!p-4">
          <div className="grid grid-cols-3 gap-4">
            <StatTile label={t('admin.roles.kpiRoles')} value={roles.length} />
            <StatTile label={t('admin.roles.kpiStaff')} value={staffCount} accent="violet" />
            <StatTile label={t('admin.roles.kpiPermissions')} value={totalPermissions} accent="cyan" />
          </div>
        </Card>
      )}

      {loading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : roles.length === 0 ? (
        <EmptyState icon={<KeyRound size={28} />} title={t('admin.roles.none')} className="!min-h-0 py-12" />
      ) : (
        <motion.div
          variants={reduce ? still : stagger()}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {roles.map((role) => {
            const all = role.permissions.length >= totalPermissions && totalPermissions > 0;
            const shown = role.permissions.slice(0, 5);
            return (
              <motion.div key={role.id} variants={reduce ? still : fadeUp}>
                <Card hover className="relative flex h-full flex-col overflow-hidden !p-0">
                  <span aria-hidden="true" className="h-1 w-full" style={{ backgroundColor: role.color }} />
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md cut-corners-sm text-white"
                          style={{ backgroundColor: role.color }}
                        >
                          {role.isSystem ? <Lock size={18} /> : <KeyRound size={18} />}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-lg font-bold text-ink-1">{role.name}</h3>
                          <p className="flex items-center gap-1.5 text-xs text-ink-3">
                            <Users size={12} />
                            {t('admin.roles.memberCount', { n: role.memberCount })}
                          </p>
                        </div>
                      </div>
                      {role.isSystem && (
                        <Badge variant="red" size="sm">
                          {t('admin.roles.system')}
                        </Badge>
                      )}
                    </div>

                    {role.description && <p className="line-clamp-2 text-sm text-ink-2">{role.description}</p>}

                    <div className="flex flex-wrap gap-1.5">
                      {all ? (
                        <Badge variant="gold" size="sm">
                          {t('admin.roles.allPermissions')}
                        </Badge>
                      ) : (
                        <>
                          {shown.map((p) => (
                            <Badge key={p} variant="default" size="sm">
                              {labelOf(p)}
                            </Badge>
                          ))}
                          {role.permissions.length > shown.length && (
                            <Badge variant="outline" size="sm">
                              +{role.permissions.length - shown.length}
                            </Badge>
                          )}
                          {role.permissions.length === 0 && (
                            <span className="text-xs text-ink-3">{t('admin.roles.permissionCount', { n: 0 })}</span>
                          )}
                        </>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-subtle pt-3">
                      <span className="text-xs text-ink-3">
                        {t('admin.roles.permissionCount', { n: role.permissions.length })}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="secondary" onClick={() => openEditor(role)}>
                          <Pencil size={14} />
                          {t('admin.roles.manage')}
                        </Button>
                        {role.deletable && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setToDelete(role)}
                            title={t('admin.roles.delete')}
                            aria-label={t('admin.roles.delete')}
                          >
                            <Trash2 size={15} className="text-accent-red" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <RoleEditorModal
        open={editorOpen}
        role={editing}
        catalogue={catalogue}
        onClose={() => setEditorOpen(false)}
        onChanged={() => void load()}
      />

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={runDelete}
        loading={deleting}
        variant="danger"
        title={t('admin.roles.delete')}
        message={`${toDelete?.name ?? ''} : ${t('admin.roles.deleteWarn')}`}
        confirmLabel={t('admin.roles.delete')}
      />
    </div>
  );
}
