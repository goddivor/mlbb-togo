'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ExternalLink,
} from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, Badge, Button } from '@/components/ui';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import toast from 'react-hot-toast';

const LANES = ['roam', 'jungle', 'mid', 'exp', 'gold'];

type TeamForm = {
  name: string;
  tag: string;
  image: string;
  description: string;
  isRecruiting: boolean;
};

const emptyTeamForm: TeamForm = {
  name: '',
  tag: '',
  image: '',
  description: '',
  isRecruiting: false,
};

type SponsorForm = { logo: string; name: string; url: string };
const emptySponsorForm: SponsorForm = { logo: '', name: '', url: '' };

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-blue';

export default function AdminEsportPage() {
  const t = useT();

  const [tab, setTab] = useState<'teams' | 'sponsors'>('teams');
  const [loading, setLoading] = useState(true);

  const [org, setOrg] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);

  const errMsg = (e: any) => e?.message || t('admin.esport.errorGeneric');

  const loadOrg = async () => {
    try {
      const data = await api.esport.org();
      setOrg(data);
      setTeams(Array.isArray(data?.teams) ? data.teams : []);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };

  const loadSponsors = async () => {
    try {
      const data = await api.esport.sponsors();
      setSponsors(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadOrg(), loadSponsors()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{t('admin.esport.title')}</h1>

      <div className="flex gap-2 mb-6">
        {(['teams', 'sponsors'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              tab === tb
                ? 'bg-neon-blue/15 border-neon-blue text-neon-blue'
                : 'bg-gaming-surface/40 border-gaming-border text-gray-400 hover:text-gray-200'
            }`}
          >
            {tb === 'teams' ? t('admin.esport.tab.teams') : t('admin.esport.tab.sponsors')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
        </div>
      ) : tab === 'teams' ? (
        <TeamsTab teams={teams} reload={loadOrg} t={t} errMsg={errMsg} />
      ) : (
        <SponsorsTab sponsors={sponsors} reload={loadSponsors} t={t} errMsg={errMsg} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Teams tab                                                           */
/* ------------------------------------------------------------------ */

function TeamsTab({
  teams,
  reload,
  t,
  errMsg,
}: {
  teams: any[];
  reload: () => Promise<void>;
  t: (k: string) => string;
  errMsg: (e: any) => string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamForm>(emptyTeamForm);
  const [saving, setSaving] = useState(false);
  const [openMembers, setOpenMembers] = useState<string | null>(null);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyTeamForm);
    setShowForm(true);
  };

  const openEdit = (team: any) => {
    setEditId(team.id);
    setForm({
      name: team.name || '',
      tag: team.tag || '',
      image: team.image || '',
      description: team.description || '',
      isRecruiting: !!team.isRecruiting,
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        tag: form.tag.trim() || undefined,
        image: form.image.trim() || undefined,
        description: form.description.trim() || undefined,
        isRecruiting: form.isRecruiting,
      };
      if (editId) await api.esport.updateTeam(editId, payload);
      else await api.esport.createTeam(payload);
      toast.success(t('admin.esport.saved'));
      setShowForm(false);
      setEditId(null);
      setForm(emptyTeamForm);
      await reload();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (team: any) => {
    if (!window.confirm(t('admin.esport.deleteTeamConfirm'))) return;
    try {
      await api.esport.deleteTeam(team.id);
      toast.success(t('admin.esport.deleted'));
      if (openMembers === team.id) setOpenMembers(null);
      await reload();
    } catch (err: any) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} /> {t('admin.esport.newTeam')}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={submit}
            className="mb-6 rounded-xl border border-gaming-border bg-gaming-surface/40 p-4 space-y-3 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.teamTag')}</label>
                <input
                  className={inputCls}
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                />
              </div>
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
                className={`${inputCls} min-h-[80px] resize-y`}
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
            <div className="flex gap-2 pt-1">
              <Button size="sm" type="submit" disabled={saving}>
                <Check size={16} /> {t('admin.esport.create')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                }}
              >
                {t('admin.esport.cancel')}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {teams.length === 0 ? (
        <div className="text-center py-16 text-gray-500">{t('admin.esport.noMembers')}</div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-xl border border-gaming-border bg-gaming-surface/40 overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3">
                {team.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={team.image}
                    alt={team.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-lg object-cover border border-gaming-border shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xl font-bold text-white shrink-0">
                    {team.name?.[0]?.toUpperCase() || 'T'}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                    {team.tag && (
                      <span className="text-xs text-gray-500 uppercase">[{team.tag}]</span>
                    )}
                    {team.isRecruiting && <Badge variant="green" size="sm">{t('admin.esport.recruiting')}</Badge>}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <Users size={13} /> {team.memberCount ?? team.members?.length ?? 0}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setOpenMembers(openMembers === team.id ? null : team.id)}
                  >
                    <Users size={14} /> {t('admin.esport.manageMembers')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(team)}>
                    <Pencil size={14} />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(team)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {openMembers === team.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gaming-border overflow-hidden"
                  >
                    <MembersPanel team={team} reload={reload} t={t} errMsg={errMsg} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Members panel                                                       */
/* ------------------------------------------------------------------ */

function MembersPanel({
  team,
  reload,
  t,
  errMsg,
}: {
  team: any;
  reload: () => Promise<void>;
  t: (k: string) => string;
  errMsg: (e: any) => string;
}) {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const members: any[] = Array.isArray(team.members) ? team.members : [];
  const memberIds = useMemo(
    () => new Set(members.map((m) => m.userId ?? m.user?.id)),
    [members],
  );

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

  const removeMember = (m: any) => {
    if (!window.confirm(t('admin.esport.removeMemberConfirm'))) return;
    run(() => api.esport.removeMember(team.id, m.userId));
  };

  const addPlayer = (p: any) => run(() => api.esport.addMember(team.id, { userId: p.id }));

  return (
    <div className="p-4 space-y-4 bg-gaming-dark/40">
      {/* members list */}
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
                  <span className="text-sm text-white truncate">
                    {u.displayName || u.username}
                  </span>
                  {hasRankBadge(u.gameRank) && <RankBadge rank={u.gameRank} size={16} />}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={m.role || ''}
                    disabled={busy}
                    onChange={(e) => changeRole(m, e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 focus:outline-none focus:border-neon-blue"
                  >
                    <option value="">{t('admin.esport.noRole')}</option>
                    {LANES.map((l) => (
                      <option key={l} value={l}>
                        {t('lane.' + l)}
                      </option>
                    ))}
                  </select>

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

                  {m.isCaptain ? (
                    <Badge variant="gold" size="sm">
                      <Crown size={11} className="mr-1" /> {t('admin.esport.captain')}
                    </Badge>
                  ) : (
                    <button
                      onClick={() => makeCaptain(m)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-gaming-border text-gray-400 hover:text-neon-gold hover:border-neon-gold transition-colors"
                    >
                      <Star size={11} /> {t('admin.esport.setCaptain')}
                    </button>
                  )}

                  <button
                    onClick={() => removeMember(m)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <X size={11} /> {t('admin.esport.remove')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* add player */}
      <div className="pt-2 border-t border-gaming-border">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                <span className="text-sm text-gray-200 truncate">
                  {p.displayName || p.username}
                </span>
                <Plus size={14} className="ml-auto text-neon-blue shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sponsors tab                                                        */
/* ------------------------------------------------------------------ */

function SponsorsTab({
  sponsors,
  reload,
  t,
  errMsg,
}: {
  sponsors: any[];
  reload: () => Promise<void>;
  t: (k: string) => string;
  errMsg: (e: any) => string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SponsorForm>(emptySponsorForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditId(null);
    setForm(emptySponsorForm);
    setShowForm(true);
  };

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({ logo: s.logo || '', name: s.name || '', url: s.url || '' });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.logo.trim()) return;
    setSaving(true);
    try {
      const payload = {
        logo: form.logo.trim(),
        name: form.name.trim() || undefined,
        url: form.url.trim() || undefined,
      };
      if (editId) await api.esport.updateSponsor(editId, payload);
      else await api.esport.createSponsor(payload);
      toast.success(t('admin.esport.saved'));
      setShowForm(false);
      setEditId(null);
      setForm(emptySponsorForm);
      await reload();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: any) => {
    if (!window.confirm(t('admin.esport.deleteSponsorConfirm'))) return;
    try {
      await api.esport.deleteSponsor(s.id);
      toast.success(t('admin.esport.deleted'));
      await reload();
    } catch (err: any) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} /> {t('admin.esport.newSponsor')}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={submit}
            className="mb-6 rounded-xl border border-gaming-border bg-gaming-surface/40 p-4 space-y-3 overflow-hidden"
          >
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.sponsorLogo')}</label>
              <input
                className={inputCls}
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.sponsorName')}</label>
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.sponsorUrl')}</label>
                <input
                  className={inputCls}
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" type="submit" disabled={saving}>
                <Check size={16} /> {t('admin.esport.create')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                }}
              >
                {t('admin.esport.cancel')}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {sponsors.length === 0 ? (
        <div className="text-center py-16 text-gray-500">{t('admin.esport.noSponsors')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sponsors.map((s) => (
            <Card key={s.id} hover={false} className="!p-3 flex items-center gap-3">
              {s.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.logo}
                  alt={s.name || 'sponsor'}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-lg object-contain bg-gaming-surface border border-gaming-border shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gaming-surface border border-gaming-border shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{s.name || '—'}</p>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-neon-blue truncate hover:underline"
                  >
                    <ExternalLink size={11} /> {s.url}
                  </a>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                  <Pencil size={14} />
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(s)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
