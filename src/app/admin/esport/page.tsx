'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
  UserCog,
  Medal,
  Target,
  Shield,
} from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import {
  Avatar,
  Badge,
  Button,
  Card,
  PageHeader,
  EmptyState,
  LoadingSpinner,
  StatCard,
  Tabs,
} from '@/components/ui';
import { teamTag } from '@/components/game/TeamCard';
import { fadeUp, stagger, still } from '@/lib/motion';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import RoleIcon from '@/components/game/RoleIcon';
import RoleSelect from '@/components/game/RoleSelect';
import toast from 'react-hot-toast';
import { StaffPanel, HonoursPanel } from './TeamExtrasPanels';
import CitySelect from '@/components/geo/CitySelect';

const LANES = ['roam', 'jungle', 'mid', 'exp', 'gold'];

type TeamForm = {
  name: string;
  image: string;
  description: string;
  city: string;
};

const emptyTeamForm: TeamForm = {
  name: '',
  image: '',
  description: '',
  city: '',
};

const inputCls =
  'w-full rounded border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-base ease-out focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-60 dark:bg-surface-0/60';
const labelCls = 'mb-1.5 block text-xs font-medium text-ink-2';

type Pending = {
  message: string;
  action: () => Promise<any>;
  confirmLabel?: string;
  danger?: boolean;
} | null;

export default function AdminEsportPage() {
  const t = useT();
  const reduce = useReducedMotion();
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
  const [staffId, setStaffId] = useState<string | null>(null);
  const [honoursId, setHonoursId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [confirming, setConfirming] = useState(false);

  const visibleTeams = useMemo(
    () => teams.filter((tm) => (tm.type || 'community') === tab),
    [teams, tab],
  );

  // KPI strip derived from the already loaded list (no extra request).
  const kpis = useMemo(() => {
    const esport = teams.filter((tm) => tm.type === 'esport').length;
    const members = teams.reduce(
      (acc, tm) => acc + (tm.memberCount ?? tm.members?.length ?? 0),
      0,
    );
    return { total: teams.length, esport, community: teams.length - esport, members };
  }, [teams]);

  const membersTeam = useMemo(
    () => teams.find((tm) => tm.id === membersId) || null,
    [teams, membersId],
  );
  const staffTeam = useMemo(() => teams.find((tm) => tm.id === staffId) || null, [teams, staffId]);
  const honoursTeam = useMemo(() => teams.find((tm) => tm.id === honoursId) || null, [teams, honoursId]);

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
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.section.esport')}
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
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t('header.teams')} value={loading ? '…' : kpis.total} icon={<Shield size={16} />} />
        <StatCard
          label={t('admin.esport.type.esport')}
          value={loading ? '…' : kpis.esport}
          icon={<Trophy size={16} />}
          accent="gold"
        />
        <StatCard
          label={t('admin.esport.type.community')}
          value={loading ? '…' : kpis.community}
          icon={<Users size={16} />}
          accent="violet"
        />
        <StatCard
          label={t('teams.members')}
          value={loading ? '…' : kpis.members}
          icon={<UserCog size={16} />}
          accent="green"
        />
      </div>

      <FiguresPanel t={t} errMsg={errMsg} />

      <div className="overflow-x-auto whitespace-nowrap">
        <Tabs
          variant="underline"
          active={tab}
          onChange={(id: 'community' | 'esport') => setTab(id)}
          tabs={[
            { id: 'community', label: t('admin.esport.type.community'), count: kpis.community },
            { id: 'esport', label: t('admin.esport.type.esport'), count: kpis.esport },
          ]}
        />
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : visibleTeams.length === 0 ? (
        <EmptyState icon={<Users size={28} />} title={t('admin.esport.noTeams')} />
      ) : (
        <motion.div
          variants={reduce ? still : stagger()}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {visibleTeams.map((team) => (
            <motion.div key={team.id} variants={reduce ? still : fadeUp} className="h-full">
              <Card className="!p-0 flex h-full flex-col overflow-hidden" accent={team.type === 'esport' ? 'gold' : 'cyan'}>
                <div className="relative aspect-video w-full bg-surface-2">
                  {team.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={team.image}
                      alt={team.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-3xl font-bold tracking-tight2 text-ink-3">
                      {teamTag(team)}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-1 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display text-base font-bold tracking-tight2 text-ink-1">{team.name}</h3>
                    <Badge variant={team.type === 'esport' ? 'gold' : 'default'} size="sm">
                      {t('admin.esport.badge.' + (team.type || 'community'))}
                    </Badge>
                  </div>
                  <div className="mb-4 mt-1 flex items-center gap-1 text-xs text-ink-2">
                    <Users size={13} />
                    <span className="num">{team.memberCount ?? team.members?.length ?? 0}</span> {t('teams.members')}
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                    {team.type !== 'esport' && (
                      <Button size="sm" variant="secondary" onClick={() => askTransform(team)}>
                        <Rocket size={14} /> {t('admin.esport.transform')}
                      </Button>
                    )}
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setStaffId(team.id)}>
                        <UserCog size={14} /> {t('admin.esport.staff')}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setHonoursId(team.id)}>
                        <Medal size={14} /> {t('admin.esport.honours')}
                      </Button>
                    </div>
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
              </Card>
            </motion.div>
          ))}
        </motion.div>
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

      <Modal
        open={!!staffTeam}
        onClose={() => setStaffId(null)}
        maxWidth="max-w-2xl"
        closeLabel={t('common.close')}
        icon={<UserCog size={20} />}
        title={staffTeam ? `${t('admin.esport.staffTitle')} · ${staffTeam.name}` : ''}
      >
        {staffTeam && <StaffPanel team={staffTeam} t={t} errMsg={errMsg} onAsk={setPending} />}
      </Modal>

      <Modal
        open={!!honoursTeam}
        onClose={() => setHonoursId(null)}
        maxWidth="max-w-2xl"
        closeLabel={t('common.close')}
        icon={<Medal size={20} />}
        title={honoursTeam ? `${t('admin.esport.honoursTitle')} · ${honoursTeam.name}` : ''}
      >
        {honoursTeam && <HonoursPanel team={honoursTeam} t={t} errMsg={errMsg} onSaved={() => setHonoursId(null)} />}
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
/* Public target figures (About page)                                  */
/* ------------------------------------------------------------------ */

const FIGURE_KEYS = ['streamAudience', 'socialReach', 'teams', 'offlineEvents'] as const;
type FigureKey = (typeof FIGURE_KEYS)[number];
type FiguresForm = Record<FigureKey, string>;

const emptyFigures: FiguresForm = { streamAudience: '', socialReach: '', teams: '', offlineEvents: '' };

function FiguresPanel({ t, errMsg }: { t: (k: string) => string; errMsg: (e: any) => string }) {
  const [form, setForm] = useState<FiguresForm>(emptyFigures);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.esport
      .figures()
      .then((f: any) => {
        if (f && typeof f === 'object') {
          const next = { ...emptyFigures };
          for (const k of FIGURE_KEYS) next[k] = f[k] != null ? String(f[k]) : '';
          setForm(next);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, number> = {};
      for (const k of FIGURE_KEYS) if (form[k] !== '') payload[k] = Number(form[k]);
      const saved = await api.esport.updateFigures(payload);
      const next = { ...emptyFigures };
      for (const k of FIGURE_KEYS) next[k] = saved?.[k] != null ? String(saved[k]) : '';
      setForm(next);
      toast.success(t('admin.esport.figures.saved'));
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="!p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink-1">
          <span className="flex h-7 w-7 items-center justify-center rounded cut-corners-sm bg-accent-cyan/10 text-accent-cyan">
            <Target size={14} />
          </span>
          {t('admin.esport.figures.title')}
        </span>
        <span className="text-xs text-ink-3">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <form onSubmit={save} className="mt-4 space-y-4">
          <p className="text-xs text-ink-2">{t('admin.esport.figures.desc')}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {FIGURE_KEYS.map((k) => (
              <label key={k} className="block">
                <span className={labelCls}>{t(`admin.esport.figures.${k}`)}</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className={`${inputCls} num`}
                  value={form[k]}
                  disabled={!loaded}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={saving} disabled={!loaded}>
              <Check size={14} /> {t('common.save')}
            </Button>
          </div>
        </form>
      )}
    </Card>
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
            city: team.city || '',
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
        city: form.city || null,
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
          <label className={labelCls}>{t('admin.esport.teamName')}</label>
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className={labelCls}>{t('admin.esport.teamImage')}</label>
          <input className={inputCls} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>{t('admin.esport.teamDesc')}</label>
          <textarea
            className={`${inputCls} min-h-[80px] resize-y`}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <CitySelect
          label={t('admin.esport.teamCity')}
          value={form.city}
          onChange={(city) => setForm({ ...form, city })}
          className="py-2 px-3 text-sm"
        />
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
        <div className="text-sm text-ink-3">{t('admin.esport.noMembers')}</div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const u = m.user || {};
            return (
              <div
                key={m.id ?? m.userId}
                className="flex flex-col gap-3 rounded-md border border-line-subtle bg-surface-2/60 p-2.5 sm:flex-row sm:items-center"
              >
                <Avatar
                  name={u.displayName || u.username || 'J'}
                  src={u.avatar ? avatarSrc(u.avatar, 64) : undefined}
                  size="md"
                  square
                  className="shrink-0"
                />

                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {m.role && <RoleIcon role={m.role} size={16} />}
                  <span className="truncate text-sm font-medium text-ink-1">{u.displayName || u.username}</span>
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
                    className={`rounded border px-2 py-1 text-xs font-semibold transition-colors duration-fast ${
                      m.isSubstitute
                        ? 'border-line-strong bg-surface-2 text-ink-2'
                        : 'border-primary bg-primary/10 text-primary'
                    }`}
                  >
                    {m.isSubstitute ? t('admin.esport.substitute') : t('admin.esport.starter')}
                  </button>

                  {!m.isCaptain && (
                    <button
                      onClick={() => makeCaptain(m)}
                      disabled={busy}
                      title={t('admin.esport.setCaptain')}
                      className="inline-flex items-center gap-1 rounded border border-line-strong px-2 py-1 text-xs text-ink-2 transition-colors duration-fast hover:border-accent-gold hover:text-accent-gold"
                    >
                      <Star size={11} />
                    </button>
                  )}

                  <button
                    onClick={() => askRemove(m)}
                    disabled={busy}
                    title={t('admin.esport.remove')}
                    className="inline-flex items-center gap-1 rounded border border-accent-red/30 px-2 py-1 text-xs text-accent-red transition-colors duration-fast hover:bg-accent-red/10"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-line-subtle pt-3">
        <p className="eyebrow mb-2">{t('admin.esport.addMember')}</p>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin.esport.searchPlayer')}
            className={`${inputCls} pl-9`}
          />
        </div>

        {results.length === 0 ? (
          <div className="text-sm text-ink-3">{t('admin.esport.noPlayers')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => addPlayer(p)}
                disabled={busy}
                className="flex items-center gap-2 rounded-md border border-line-subtle bg-surface-2/60 p-2 text-left transition-colors duration-fast hover:border-primary"
              >
                <Avatar
                  name={p.displayName || p.username || 'J'}
                  src={p.avatar ? avatarSrc(p.avatar, 64) : undefined}
                  size="sm"
                  square
                  className="shrink-0"
                />
                <span className="truncate text-sm text-ink-1">{p.displayName || p.username}</span>
                <Plus size={14} className="ml-auto text-primary shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
