'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Lock, Search, UserMinus, UserPlus, KeyRound, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useAuthStore, useLangStore } from '@/store/useStore';
import { permissionsOf } from '@/lib/permissions';
import { cn } from '@/lib/helpers';
import { Avatar, Badge, Button, Input, Tabs, Textarea } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { ROLE_COLORS, pick, type PermissionCatalogue, type Role, type RoleMember } from './types';

interface Props {
  open: boolean;
  /** Role to edit, or null to create a new one. */
  role: Role | null;
  catalogue: PermissionCatalogue;
  onClose: () => void;
  /** Called after any change (save, member add/remove) so the list refreshes. */
  onChanged: (role?: Role) => void;
}

/**
 * Role editor: details (name, description, colour), permissions as grouped
 * checkboxes with a select-all per group, and the members tab with a user
 * picker. The Administrateur system role is read-only except for its members.
 */
export default function RoleEditorModal({ open, role, catalogue, onClose, onChanged }: Props) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [current, setCurrent] = useState<Role | null>(role);
  const [tab, setTab] = useState<'permissions' | 'members'>('permissions');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(ROLE_COLORS[0]);
  const [perms, setPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<RoleMember[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [busyMember, setBusyMember] = useState<string | null>(null);

  const locked = !!current && !current.editable;
  // Only permissions the signed-in user holds can be granted (the API refuses
  // the others), so the rest are read-only here.
  const me = useAuthStore((s: any) => s.user);
  const held = useMemo(() => new Set(permissionsOf(me)), [me]);

  useEffect(() => {
    if (!open) return;
    setCurrent(role);
    setTab('permissions');
    setName(role?.name ?? '');
    setDescription(role?.description ?? '');
    setColor(role?.color ?? ROLE_COLORS[0]);
    setPerms(new Set(role?.permissions ?? []));
    setMembers([]);
    setQuery('');
  }, [open, role]);

  // Members + user directory, loaded lazily when the tab opens.
  useEffect(() => {
    if (!open || tab !== 'members' || !current) return;
    api.roles
      .get(current.id)
      .then((r: any) => setMembers(Array.isArray(r?.members) ? r.members : []))
      .catch(() => setMembers([]));
    if (!users.length) {
      api.users.adminList().then((l: any) => setUsers(Array.isArray(l) ? l : []));
    }
  }, [open, tab, current, users.length]);

  const groups = useMemo(
    () =>
      catalogue.groups
        .map((g) => ({ ...g, items: catalogue.permissions.filter((p) => p.group === g.key) }))
        .filter((g) => g.items.length > 0),
    [catalogue],
  );

  const toggle = (key: string) =>
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleGroup = (keys: string[], on: boolean) =>
    setPerms((prev) => {
      const next = new Set(prev);
      keys.filter((k) => held.has(k)).forEach((k) => (on ? next.add(k) : next.delete(k)));
      return next;
    });

  const save = async () => {
    if (name.trim().length < 2) {
      toast.error(t('admin.roles.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        color,
        permissions: catalogue.permissions.map((p) => p.key).filter((k) => perms.has(k)),
      };
      const saved: Role = current
        ? await api.roles.update(current.id, body)
        : await api.roles.create(body);
      toast.success(t(current ? 'admin.roles.saved' : 'admin.roles.created'));
      onChanged(saved);
      if (!current) {
        // Stay open on the new role so members can be added right away.
        setCurrent(saved);
        setTab('members');
      } else {
        onClose();
      }
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (userId: string) => {
    if (!current) return;
    setBusyMember(userId);
    try {
      const r: any = await api.roles.addMember(current.id, userId);
      setMembers(Array.isArray(r?.members) ? r.members : []);
      toast.success(t('admin.roles.memberAdded'));
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusyMember(null);
    }
  };

  const removeMember = async (userId: string) => {
    if (!current) return;
    setBusyMember(userId);
    try {
      const r: any = await api.roles.removeMember(current.id, userId);
      setMembers(Array.isArray(r?.members) ? r.members : []);
      toast.success(t('admin.roles.memberRemoved'));
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusyMember(null);
    }
  };

  const memberIds = new Set(members.map((m) => m.id));
  const q = query.trim().toLowerCase();
  const candidates = q
    ? users
        .filter((u) => !memberIds.has(u.id))
        .filter((u) =>
          [u.username, u.displayName, u.email].some((v) => (v || '').toLowerCase().includes(q)),
        )
        .slice(0, 6)
    : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      icon={<KeyRound size={20} />}
      title={current ? t('admin.roles.edit') : t('admin.roles.new')}
      subtitle={current?.name}
    >
      <div className="space-y-5">
        {locked && (
          <div className="flex items-start gap-2 rounded-md border border-accent-red/30 bg-accent-red/5 p-3 text-sm text-ink-2">
            <Lock size={16} className="mt-0.5 shrink-0 text-accent-red" />
            {t('admin.roles.systemLocked')}
          </div>
        )}

        {/* Details */}
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <Input
              label={t('admin.roles.name')}
              value={name}
              maxLength={40}
              disabled={locked}
              placeholder={t('admin.roles.namePlaceholder')}
              onChange={(e: any) => setName(e.target.value)}
            />
            <Textarea
              label={t('admin.roles.description')}
              value={description}
              rows={2}
              maxLength={300}
              disabled={locked}
              placeholder={t('admin.roles.descriptionPlaceholder')}
              onChange={(e: any) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <p className="mb-2.5 text-sm font-medium text-ink-1">{t('admin.roles.color')}</p>
            <div className="grid w-fit grid-cols-5 gap-2">
              {ROLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={locked}
                  onClick={() => setColor(c)}
                  aria-label={c}
                  aria-pressed={color === c}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md ring-offset-2 ring-offset-surface-1 transition-transform duration-fast hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60',
                    color === c && 'ring-2 ring-ink-1',
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Tabs
          variant="underline"
          size="sm"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'permissions', label: t('admin.roles.permissions'), icon: KeyRound, count: perms.size },
            ...(current
              ? [{ id: 'members', label: t('admin.roles.members'), icon: Users, count: current.memberCount }]
              : []),
          ]}
        />

        {tab === 'permissions' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {groups.map((g) => {
              const keys = g.items.map((p) => p.key).filter((k) => held.has(k));
              const all = keys.length > 0 && keys.every((k) => perms.has(k));
              return (
                <div key={g.key} className="rounded-lg border border-line-subtle bg-surface-2/40 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="eyebrow">{pick(g.label, lang)}</p>
                    {!locked && keys.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleGroup(keys, !all)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {all ? t('admin.roles.clearAll') : t('admin.roles.selectAll')}
                      </button>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {g.items.map((p) => {
                      const checked = perms.has(p.key);
                      return (
                        <li key={p.key}>
                          <label
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition-colors duration-fast hover:bg-surface-2',
                              locked && 'cursor-default hover:bg-transparent',
                            )}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--primary))]"
                              checked={checked}
                              disabled={locked || !held.has(p.key)}
                              title={!locked && !held.has(p.key) ? t('admin.roles.notDelegable') : undefined}
                              onChange={() => toggle(p.key)}
                            />
                            <span className="min-w-0">
                              <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-1">
                                {pick(p.label, lang)}
                                {p.route && (
                                  <Badge variant="outline" size="sm">
                                    {t('admin.roles.pageBadge')}
                                  </Badge>
                                )}
                              </span>
                              {p.description && (
                                <span className="mt-0.5 block text-xs text-ink-3">{pick(p.description, lang)}</span>
                              )}
                              <code className="mt-0.5 block text-[10px] text-ink-3">{p.key}</code>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'members' && current && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-ink-1">{t('admin.roles.addMember')}</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('admin.roles.searchUser')}
                  className="w-full rounded border border-line-strong bg-surface-1 py-2.5 pl-10 pr-4 text-sm text-ink-1 outline-none placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
                />
              </div>
              {q && (
                <ul className="mt-2 divide-y divide-line-subtle rounded-md border border-line-subtle">
                  {candidates.length === 0 && (
                    <li className="px-3 py-2.5 text-sm text-ink-3">{t('admin.roles.noUserFound')}</li>
                  )}
                  {candidates.map((u) => (
                    <li key={u.id} className="flex items-center gap-3 px-3 py-2">
                      <Avatar name={u.displayName || u.username} src={u.avatar ? avatarSrc(u.avatar, 64) : undefined} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-1">{u.displayName || u.username}</p>
                        <p className="truncate text-xs text-ink-3">{u.email}</p>
                      </div>
                      <Button size="sm" variant="secondary" loading={busyMember === u.id} onClick={() => addMember(u.id)}>
                        <UserPlus size={14} />
                        <span className="hidden sm:inline">{t('admin.roles.addMember')}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {members.length === 0 ? (
              <p className="rounded-md border border-dashed border-line-subtle p-6 text-center text-sm text-ink-3">
                {t('admin.roles.noMembers')}
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-md border border-line-subtle bg-surface-2/40 px-3 py-2">
                    <Avatar name={m.displayName || m.username} src={m.avatar ? avatarSrc(m.avatar, 64) : undefined} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-1">{m.displayName || m.username}</p>
                      <p className="truncate text-xs text-ink-3">@{m.username}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={busyMember === m.id}
                      onClick={() => removeMember(m.id)}
                      title={t('admin.roles.removeMember')}
                      aria-label={t('admin.roles.removeMember')}
                    >
                      <UserMinus size={15} className="text-accent-red" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!current && tab === 'permissions' && (
          <p className="text-xs text-ink-3">{t('admin.roles.saveFirst')}</p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-line-subtle pt-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            {t('admin.roles.cancel')}
          </Button>
          {!locked && tab === 'permissions' && (
            <Button onClick={save} loading={saving}>
              <Check size={15} />
              {current ? t('admin.roles.save') : t('admin.roles.create')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
