'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, Search, Ban, CheckCircle2, Trash2, KeyRound, ServerCog } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useAuthStore } from '@/store/useStore';
import { Card, Badge, Avatar, Button, PageHeader, EmptyState, LoadingSpinner, Tabs, DataTable, StatTile, type DataColumn } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';
import { can } from '@/lib/permissions';
import UserRolesModal from '@/components/admin/roles/UserRolesModal';
import type { Role } from '@/components/admin/roles/types';

const ROLE_BADGE: Record<string, { label: string; variant: any }> = {
  admin: { label: 'admin.users.role.admin', variant: 'red' },
  moderator: { label: 'admin.users.role.moderator', variant: 'gold' },
  user: { label: 'admin.users.role.user', variant: 'neon' },
};

export default function AdminUsers() {
  const t = useT();
  const me = useAuthStore((s: any) => s.userProfile);
  // RBAC: role assignment and deletion are separate permissions.
  const canRoles = can(me, 'admin.roles');
  const canDelete = can(me, 'users.delete');

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesFor, setRolesFor] = useState<any>(null);

  const load = () =>
    api.users
      .adminList()
      .then((l: any) => setUsers(Array.isArray(l) ? l : []))
      .catch(() => setUsers([]));

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    api.roles.list().then((l: any) => setRoles(Array.isArray(l) ? l : []));
  }, []);

  const roleById = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleTab === 'banned' ? !u.isBanned : roleTab !== 'all' && u.roleUser !== roleTab) return false;
      if (!q) return true;
      return (
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    });
  }, [users, search, roleTab]);

  const act = async (key: string, fn: () => Promise<any>, done?: string) => {
    setBusy(key);
    try {
      await fn();
      if (done) toast.success(done);
      await load();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  const toggleBan = (u: any) =>
    act(u.id + 'b', () => api.users.setBan(u.id, !u.isBanned), u.isBanned ? t('admin.users.unbanned') : t('admin.users.banned'));

  const toggleSystem = (u: any) =>
    act(
      u.id + 's',
      () => api.users.setSystemAccount(u.id, !u.isSystemAccount),
      u.isSystemAccount ? t('admin.users.systemAccountOff') : t('admin.users.systemAccountOn'),
    );

  const runDelete = async () => {
    if (!confirmDelete) return;
    await act(confirmDelete.id + 'd', () => api.users.remove(confirmDelete.id), t('admin.users.deleted'));
    setConfirmDelete(null);
  };

  const fmtDate = (v: any) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };

  const counts = useMemo(
    () => ({
      total: users.length,
      mods: users.filter((u) => u.roleUser === 'moderator').length,
      admins: users.filter((u) => u.roleUser === 'admin').length,
      banned: users.filter((u) => u.isBanned).length,
    }),
    [users],
  );

  const columns: DataColumn<any>[] = [
    {
      key: 'user',
      header: t('admin.users.colUser'),
      render: (u) => {
        const self = u.id === me?.id;
        return (
          <div className="flex items-center gap-3">
            <Avatar
              name={u.displayName || u.username}
              src={u.avatar ? avatarSrc(u.avatar, 64) : undefined}
              size="sm"
              online={u.isOnline}
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-1">
                {u.displayName || u.username}
                {self && <span className="ml-1 text-xs text-ink-3">({t('admin.users.you')})</span>}
              </p>
              <p className="truncate text-xs text-ink-2">{u.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: t('admin.users.colRoles'),
      render: (u) => {
        const held = (u.roleIds || []).map((id: string) => roleById.get(id)).filter(Boolean) as Role[];
        if (!held.length) {
          const rb = ROLE_BADGE[u.roleUser] || ROLE_BADGE.user;
          return <Badge variant={rb.variant} size="sm">{t(rb.label)}</Badge>;
        }
        return (
          <div className="flex max-w-[16rem] flex-wrap gap-1">
            {held.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-semibold leading-none text-ink-1 ring-1 ring-inset"
                style={{ backgroundColor: `${r.color}1f`, ['--tw-ring-color' as any]: `${r.color}55` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.color }} />
                {r.name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: t('admin.users.colStatus'),
      hideBelow: 'sm',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.isBanned ? (
            <Badge variant="red" size="sm">{t('admin.users.bannedTag')}</Badge>
          ) : (
            <Badge variant="green" size="sm">{t('admin.users.active')}</Badge>
          )}
          {u.isSystemAccount && <Badge variant="outline" size="sm">{t('admin.users.systemAccount')}</Badge>}
        </div>
      ),
    },
    {
      key: 'joined',
      header: t('admin.users.colJoined'),
      hideBelow: 'md',
      className: 'text-xs text-ink-2 num',
      render: (u) => fmtDate(u.joinedAt),
    },
    {
      key: 'actions',
      header: t('admin.users.colActions'),
      align: 'right',
      render: (u) => {
        const self = u.id === me?.id;
        return (
          <div className="flex items-center justify-end gap-1">
            {/* Ban / unban: admin + moderator */}
            <Button
              size="sm"
              variant="ghost"
              disabled={self || busy === u.id + 'b'}
              onClick={() => toggleBan(u)}
              title={u.isBanned ? t('admin.users.unban') : t('admin.users.ban')}
            >
              {u.isBanned ? <CheckCircle2 size={15} className="text-accent-green" /> : <Ban size={15} className="text-accent-red" />}
            </Button>

            {/* System account (hidden from player-facing features) */}
            <Button
              size="sm"
              variant="ghost"
              disabled={busy === u.id + 's'}
              onClick={() => toggleSystem(u)}
              title={t('admin.users.toggleSystem')}
              aria-label={t('admin.users.toggleSystem')}
              aria-pressed={!!u.isSystemAccount}
            >
              <ServerCog size={15} className={u.isSystemAccount ? 'text-primary' : undefined} />
            </Button>

            {/* Roles: `admin.roles` (self-demotion is refused by the API) */}
            {canRoles && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRolesFor(u)}
                title={t('admin.users.manageRoles')}
                aria-label={t('admin.users.manageRoles')}
              >
                <KeyRound size={15} className={(u.roleIds || []).length ? 'text-accent-violet' : undefined} />
              </Button>
            )}

            {/* Delete: `users.delete` */}
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                disabled={self || busy === u.id + 'd'}
                onClick={() => setConfirmDelete(u)}
                title={t('admin.users.delete')}
              >
                <Trash2 size={15} className="text-accent-red" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users size={28} />}
        eyebrow={t('nav.section.community')}
        title={t('admin.users.title')}
        variant="blue"
      />

      {!loading && (
        <Card className="!p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label={t('admin.users.all')} value={counts.total} />
            <StatTile label={t('admin.users.mods')} value={counts.mods} accent="gold" />
            <StatTile label={t('admin.users.admins')} value={counts.admins} accent="red" />
            <StatTile label={t('admin.users.banned2')} value={counts.banned} accent={counts.banned ? 'red' : undefined} />
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.users.search')}
              className="w-full rounded border border-line-strong bg-surface-1 py-2.5 pl-10 pr-4 text-sm text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
            />
          </div>
          <div className="overflow-x-auto whitespace-nowrap">
            <Tabs
              variant="underline"
              size="sm"
              tabs={[
                { id: 'all', label: t('admin.users.all') },
                { id: 'user', label: t('admin.users.players') },
                { id: 'moderator', label: t('admin.users.mods') },
                { id: 'admin', label: t('admin.users.admins') },
                { id: 'banned', label: t('admin.users.banned2') },
              ]}
              active={roleTab}
              onChange={setRoleTab}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title={t('admin.users.none')} className="!min-h-0 py-12" />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(u) => u.id}
            emptyMessage={t('admin.users.none')}
          />
        )}
      </div>

      <UserRolesModal user={rolesFor} roles={roles} onClose={() => setRolesFor(null)} onSaved={() => void load()} />

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={runDelete}
        loading={!!busy}
        variant="danger"
        title={t('admin.users.delete')}
        message={`${confirmDelete?.displayName || confirmDelete?.username || ''} — ${t('admin.users.deleteWarn')}`}
        confirmLabel={t('admin.users.delete')}
      />
    </div>
  );
}
