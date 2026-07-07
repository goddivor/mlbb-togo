'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, Search, Shield, ShieldCheck, Ban, CheckCircle2, Trash2 } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useAuthStore } from '@/store/useStore';
import { Card, Badge, Avatar, Button, PageHeader, EmptyState, LoadingSpinner, Tabs } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';

const ROLE_BADGE: Record<string, { label: string; variant: any }> = {
  admin: { label: 'Admin', variant: 'danger' },
  moderator: { label: 'Modérateur', variant: 'gold' },
  user: { label: 'Joueur', variant: 'neon' },
};

const ROLE_CYCLE: Record<string, string> = {
  user: 'moderator',
  moderator: 'admin',
  admin: 'user',
};

export default function AdminUsers() {
  const t = useT();
  const me = useAuthStore((s: any) => s.userProfile);
  const isAdmin = me?.roleUser === 'admin';

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const load = () =>
    api.users
      .adminList()
      .then((l: any) => setUsers(Array.isArray(l) ? l : []))
      .catch(() => setUsers([]));

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

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

  const cycleRole = (u: any) =>
    act(u.id + 'r', () => api.users.setRole(u.id, ROLE_CYCLE[u.roleUser] || 'user'), t('admin.users.roleChanged'));

  const runDelete = async () => {
    if (!confirmDelete) return;
    await act(confirmDelete.id + 'd', () => api.users.remove(confirmDelete.id), t('admin.users.deleted'));
    setConfirmDelete(null);
  };

  const fmtDate = (v: any) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={<Users size={28} />} title={t('admin.users.title')} variant="blue" />

      <Card hover={false}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bodydark2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.users.search')}
              className="w-full rounded-sm border border-stroke bg-gray-2 py-2.5 pl-10 pr-4 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
            />
          </div>
          <Tabs
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

        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title={t('admin.users.none')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-stroke text-xs uppercase text-bodydark2 dark:border-strokedark">
                  <th className="py-3 pr-4 font-medium">{t('admin.users.colUser')}</th>
                  <th className="py-3 pr-4 font-medium">{t('admin.users.colRole')}</th>
                  <th className="py-3 pr-4 font-medium">{t('admin.users.colStatus')}</th>
                  <th className="py-3 pr-4 font-medium">{t('admin.users.colJoined')}</th>
                  <th className="py-3 pr-4 font-medium text-right">{t('admin.users.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const rb = ROLE_BADGE[u.roleUser] || ROLE_BADGE.user;
                  const self = u.id === me?.id;
                  return (
                    <tr key={u.id} className="border-b border-stroke dark:border-strokedark">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={u.displayName || u.username}
                            src={u.avatar ? avatarSrc(u.avatar, 64) : undefined}
                            size="sm"
                            online={u.isOnline}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-black dark:text-white">
                              {u.displayName || u.username}
                              {self && <span className="ml-1 text-xs text-bodydark2">({t('admin.users.you')})</span>}
                            </p>
                            <p className="truncate text-xs text-body dark:text-bodydark">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={rb.variant} size="sm">{rb.label}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {u.isBanned ? (
                          <Badge variant="danger" size="sm">{t('admin.users.bannedTag')}</Badge>
                        ) : (
                          <Badge variant="green" size="sm">{t('admin.users.active')}</Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs text-body dark:text-bodydark">{fmtDate(u.joinedAt)}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Ban / unban: admin + moderator */}
                          <Button
                            size="sm"
                            variant={u.isBanned ? 'ghost' : 'ghost'}
                            disabled={self || busy === u.id + 'b'}
                            onClick={() => toggleBan(u)}
                            title={u.isBanned ? t('admin.users.unban') : t('admin.users.ban')}
                          >
                            {u.isBanned ? <CheckCircle2 size={15} className="text-success" /> : <Ban size={15} className="text-danger" />}
                          </Button>

                          {/* Change role + delete: admin only */}
                          {isAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={self || busy === u.id + 'r'}
                                onClick={() => cycleRole(u)}
                                title={t('admin.users.changeRole')}
                              >
                                {u.roleUser === 'admin' ? <ShieldCheck size={15} className="text-danger" /> : <Shield size={15} />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={self || busy === u.id + 'd'}
                                onClick={() => setConfirmDelete(u)}
                                title={t('admin.users.delete')}
                              >
                                <Trash2 size={15} className="text-danger" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
