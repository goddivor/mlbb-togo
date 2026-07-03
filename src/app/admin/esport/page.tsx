'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Crown,
  X,
  Check,
  Star,
  Rocket,
  Trophy,
} from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import {
  Badge,
  Button,
  PageHeader,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingSpinner,
  Tabs,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import RoleIcon from '@/components/game/RoleIcon';
import RoleSelect from '@/components/game/RoleSelect';
import toast from 'react-hot-toast';

const LANES = ['roam', 'jungle', 'mid', 'exp', 'gold'];

type TeamForm = {
  name: string;
  image: string;
  description: string;
};

const emptyTeamForm: TeamForm = {
  name: '',
  image: '',
  description: '',
};

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-blue';

type Pending = {
  message: string;
  action: () => Promise<any>;
  confirmLabel?: string;
  danger?: boolean;
} | null;

export default function AdminEsportPage() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);

  const [tab, setTab] = useState<'community' | 'esport'>('community');

  const errMsg = (e: any) => e?.message || t('admin.esport.errorGeneric');

  const load = async () => {
    try {
      const data = await api.esport.teams();
      setTeams(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [formOpen, setFormOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<any>(null);
  const [membersId, setMembersId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [confirming, setConfirming] = useState(false);

  const visibleTeams = useMemo(
    () => teams.filter((tm) => (tm.type || 'community') === tab),
    [teams, tab],
  );

  const communityCount = useMemo(
    () => teams.filter((tm) => (tm.type || 'community') === 'community').length,
    [teams],
  );
  const esportCount = useMemo(
    () => teams.filter((tm) => tm.type === 'esport').length,
    [teams],
  );

  const membersTeam = useMemo(
    () => teams.find((tm) => tm.id === membersId) || null,
    [teams, membersId],
  );

  const runConfirm = async () => {
    if (!pending) return;
    setConfirming(true);
    try {
      await pending.action();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setConfirming(false);
      setPending(null);
    }
  };

  const askDeleteTeam = (team: any) =>
    setPending({
      message: t('admin.esport.deleteTeamConfirm'),
      confirmLabel: t('admin.esport.delete'),
      danger: true,
      action: async () => {
        await api.esport.deleteTeam(team.id);
        toast.success(t('admin.esport.deleted'));
        if (membersId === team.id) setMembersId(null);
        await load();
      },
    });

  const askTransform = (team: any) =>
    setPending({
      message: t('admin.esport.transformConfirm'),
      confirmLabel: t('admin.esport.transform'),
      action: async () => {
        await api.esport.transform(team.id);
        toast.success(t('admin.esport.transformed'));
        await load();
      },
    });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={<Trophy size={28} />}
        title={t('header.teams')}
        variant="default"
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditTeam(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> {t('admin.esport.newTeam')}
          </Button>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard translucent label={t('header.teams')} value={teams.length} icon={<Users size={18} />} />
          <StatCard
            translucent
            label={t('admin.esport.type.community')}
            value={communityCount}
            icon={<Users size={18} />}
          />
          <StatCard
            translucent
            label={t('admin.esport.type.esport')}
            value={esportCount}
            icon={<Trophy size={18} />}
          />
        </div>
      </PageHeader>

      <SectionCard className="!p-4">
        <Tabs
          active={tab}
          onChange={(id: 'community' | 'esport') => setTab(id)}
          tabs={[
            { id: 'community', label: t('admin.esport.type.community') },
            { id: 'esport', label: t('admin.esport.type.esport') },
          ]}
        />
      </SectionCard>

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : visibleTeams.length === 0 ? (
        <EmptyState icon={<Users size={28} />} title={t('admin.esport.noTeams')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleTeams.map((team) => (
            <div
              key={team.id}
              className="rounded-xl border border-gaming-border bg-gaming-card overflow-hidden flex flex-col"
            >
              <div className="relative aspect-video w-full bg-gaming-dark">
                {team.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={team.image}
                    alt={team.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-600">
                    {team.name?.[0]?.toUpperCase() || 'T'}
                  </div>
                )}
              </div>

              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                  <Badge variant={team.type === 'esport' ? 'gold' : 'default'} size="sm">
                    {t('admin.esport.badge.' + (team.type || 'community'))}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mt-1 mb-3 text-xs text-gray-400">
                  <Users size={13} /> {team.memberCount ?? team.members?.length ?? 0} {t('teams.members')}
                </div>

                <div className="mt-auto flex flex-col gap-2">
                  {team.type !== 'esport' && (
                    <Button size="sm" variant="secondary" onClick={() => askTransform(team)}>
                      <Rocket size={14} /> {t('admin.esport.transform')}
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => setMembersId(team.id)}>
                      <Users size={14} /> {t('admin.esport.members')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title={t('admin.esport.editTeam')}
                      onClick={() => {
                        setEditTeam(team);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="danger" title={t('admin.esport.delete')} onClick={() => askDeleteTeam(team)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TeamFormModal
        open={formOpen}
        team={editTeam}
        type={tab}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        t={t}
        errMsg={errMsg}
      />

      <Modal
        open={!!membersTeam}
        onClose={() => setMembersId(null)}
        maxWidth="max-w-2xl"
        closeLabel={t('common.close')}
        title={membersTeam ? `${t('admin.esport.members')} · ${membersTeam.name}` : ''}
      >
        {membersTeam && (
          <MembersPanel team={membersTeam} reload={load} t={t} errMsg={errMsg} onAsk={setPending} />
        )}
      </Modal>

      <ConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={runConfirm}
        loading={confirming}
        danger={!!pending?.danger}
        title={t('admin.confirm.title')}
        message={pending?.message}
        confirmLabel={pending?.confirmLabel || t('admin.esport.delete')}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Team create / edit modal                                            */
/* ------------------------------------------------------------------ */

function TeamFormModal({
  open,
  team,
  type,
  onClose,
  onSaved,
  t,
  errMsg,
}: {
  open: boolean;
  team: any;
  type: 'community' | 'esport';
  onClose: () => void;
  onSaved: () => Promise<void>;
  t: (k: string) => string;
  errMsg: (e: any) => string;
}) {
  const [form, setForm] = useState<TeamForm>(emptyTeamForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      team
        ? {
            name: team.name || '',
            image: team.image || '',
            description: team.description || '',
          }
        : emptyTeamForm,
    );
  }, [open, team]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        image: form.image.trim() || undefined,
        description: form.description.trim() || undefined,
      };
      if (team) await api.esport.updateTeam(team.id, payload);
      else await api.esport.createTeam({ ...payload, type });
      toast.success(t('admin.esport.saved'));
      onClose();
      await onSaved();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeLabel={t('common.close')}
      title={team ? t('admin.esport.editTeam') : t('admin.esport.newTeam')}
      icon={<Users size={20} />}
      headerVariant={team ? 'plain' : 'gradient'}
    >
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.teamName')}</label>
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.teamImage')}</label>
          <input className={inputCls} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.teamDesc')}</label>
          <textarea
            className={`${inputCls} min-h-[80px] resize-y`}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button size="sm" type="submit" disabled={saving}>
            <Check size={16} /> {team ? t('admin.esport.save') : t('admin.esport.create')}
          </Button>
          <Button size="sm" variant="ghost" type="button" onClick={onClose}>
            {t('admin.esport.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Members panel (rendered inside a modal)                             */
/* ------------------------------------------------------------------ */

function MembersPanel({
  team,
  reload,
  t,
  errMsg,
  onAsk,
}: {
  team: any;
  reload: () => Promise<void>;
  t: (k: string) => string;
  errMsg: (e: any) => string;
  onAsk: (p: Pending) => void;
}) {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const members: any[] = Array.isArray(team.members) ? team.members : [];
  const memberIds = useMemo(() => new Set(members.map((m) => m.userId ?? m.user?.id)), [members]);

  useEffect(() => {
    api.users
      .list()
      .then((u: any) => setPlayers(Array.isArray(u) ? u : []))
      .catch(() => setPlayers([]));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players
      .filter((p) => !memberIds.has(p.id))
      .filter(
        (p) =>
          !q ||
          (p.displayName || '').toLowerCase().includes(q) ||
          (p.username || '').toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [players, query, memberIds]);

  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    try {
      await fn();
      await reload();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const changeRole = (m: any, value: string) =>
    run(() => api.esport.updateMember(team.id, m.userId, { role: value || null }));
  const toggleSub = (m: any) =>
    run(() => api.esport.updateMember(team.id, m.userId, { isSubstitute: !m.isSubstitute }));
  const makeCaptain = (m: any) => run(() => api.esport.setCaptain(team.id, m.userId));
  const addPlayer = (p: any) => run(() => api.esport.addMember(team.id, { userId: p.id }));

  const askRemove = (m: any) =>
    onAsk({
      message: t('admin.esport.removeMemberConfirm'),
      confirmLabel: t('admin.esport.remove'),
      danger: true,
      action: () => run(() => api.esport.removeMember(team.id, m.userId)),
    });

  return (
    <div className="space-y-4">
      {members.length === 0 ? (
        <div className="text-sm text-gray-500">{t('admin.esport.noMembers')}</div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const u = m.user || {};
            return (
              <div
                key={m.id ?? m.userId}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-gaming-border bg-gaming-surface/40 p-2.5"
              >
                {u.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc(u.avatar, 64)}
                    alt={u.displayName || u.username}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-gaming-border shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {(u.displayName || u.username)?.[0]?.toUpperCase() || 'J'}
                  </div>
                )}

                <div className="min-w-0 flex-1 flex items-center gap-2">
                  {m.role && <RoleIcon role={m.role} size={16} />}
                  <span className="text-sm text-white truncate">{u.displayName || u.username}</span>
                  {hasRankBadge(u.gameRank) && <RankBadge rank={u.gameRank} size={16} />}
                  {m.isCaptain && (
                    <Badge variant="gold" size="sm">
                      <Crown size={11} className="mr-1" /> {t('admin.esport.captain')}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <RoleSelect
                    value={m.role || ''}
                    onChange={(v) => changeRole(m, v)}
                    options={LANES}
                    noneLabel={t('admin.esport.noRole')}
                    labelFor={(l) => t('lane.' + l)}
                    disabled={busy}
                  />

                  <button
                    onClick={() => toggleSub(m)}
                    disabled={busy}
                    className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                      m.isSubstitute
                        ? 'bg-gaming-surface border-gaming-border text-gray-400'
                        : 'bg-neon-blue/15 border-neon-blue text-neon-blue'
                    }`}
                  >
                    {m.isSubstitute ? t('admin.esport.substitute') : t('admin.esport.starter')}
                  </button>

                  {!m.isCaptain && (
                    <button
                      onClick={() => makeCaptain(m)}
                      disabled={busy}
                      title={t('admin.esport.setCaptain')}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-gaming-border text-gray-400 hover:text-neon-gold hover:border-neon-gold transition-colors"
                    >
                      <Star size={11} />
                    </button>
                  )}

                  <button
                    onClick={() => askRemove(m)}
                    disabled={busy}
                    title={t('admin.esport.remove')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-3 border-t border-gaming-border">
        <p className="text-xs font-medium text-gray-300 mb-2">{t('admin.esport.addMember')}</p>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin.esport.searchPlayer')}
            className={`${inputCls} pl-9`}
          />
        </div>

        {results.length === 0 ? (
          <div className="text-sm text-gray-500">{t('admin.esport.noPlayers')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => addPlayer(p)}
                disabled={busy}
                className="flex items-center gap-2 rounded-lg border border-gaming-border bg-gaming-surface/40 p-2 text-left hover:border-neon-blue transition-colors"
              >
                {p.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc(p.avatar, 64)}
                    alt={p.displayName || p.username}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-lg object-cover border border-gaming-border shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {(p.displayName || p.username)?.[0]?.toUpperCase() || 'J'}
                  </div>
                )}
                <span className="text-sm text-gray-200 truncate">{p.displayName || p.username}</span>
                <Plus size={14} className="ml-auto text-neon-blue shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
