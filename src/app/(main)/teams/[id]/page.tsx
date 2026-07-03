'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Crown, Users, Calendar, Check, X,
  Swords, MessageSquare, Plus, Trash2, Send, Megaphone,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { api, avatarSrc } from '@/lib/api';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import RoleIcon from '@/components/game/RoleIcon';
import RoleSelect from '@/components/game/RoleSelect';
import { useAuthStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

const LANES = ['roam', 'jungle', 'mid', 'exp', 'gold'];
const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-blue';

function StatBox({ label, value, color = 'text-white' }: any) {
  return (
    <div className="rounded-xl border border-gaming-border bg-gaming-surface/40 p-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function MemberCard({ m, t, highlight = false }: any) {
  const u = m?.user || {};
  const name = u.displayName || u.username || '';
  return (
    <Link href={`/players/${m.userId}`} className={`flex items-center gap-3 rounded-xl border bg-gaming-surface/40 p-3 transition-colors ${highlight ? 'border-yellow-500/40 hover:border-yellow-400' : 'border-gaming-border hover:border-neon-blue'}`}>
      {u.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarSrc(u.avatar, 96)} alt={name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-xl object-cover border border-gaming-border" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-lg font-bold text-white">{name?.[0]?.toUpperCase() || 'J'}</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {m.isCaptain && <Crown size={14} className="text-yellow-400 shrink-0" />}
          <p className="text-sm font-semibold text-white truncate">{name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {m.role && <Badge variant="purple" size="sm" className="gap-1"><RoleIcon role={m.role} size={14} /> {t('lane.' + m.role)}</Badge>}
          {hasRankBadge(u.gameRank) && <span className="inline-flex items-center gap-1 text-xs text-gray-300"><RankBadge rank={u.gameRank} size={16} /> {u.gameRank}</span>}
        </div>
      </div>
    </Link>
  );
}

function MatchRow({ m, t, onResult }: any) {
  const completed = m.status === 'completed';
  const aWin = m.winnerTeamId && m.winnerTeamId === m.teamA?.id;
  const bWin = m.winnerTeamId && m.winnerTeamId === m.teamB?.id;
  let dateLabel = '';
  if (m.scheduledAt) { const d = new Date(m.scheduledAt); if (!isNaN(d.getTime())) dateLabel = d.toLocaleDateString(); }
  return (
    <div className="rounded-lg border border-gaming-border bg-gaming-surface/40 p-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
        <span className={`text-right truncate ${aWin ? 'text-neon-gold font-bold' : 'text-white'}`}>{m.teamA?.name}</span>
        <span className="px-2 text-gray-400 font-semibold shrink-0">{completed ? `${m.scoreA} - ${m.scoreB}` : 'vs'}</span>
        <span className={`text-left truncate ${bWin ? 'text-neon-gold font-bold' : 'text-white'}`}>{m.teamB?.name}</span>
      </div>
      <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
        <Badge variant="purple" size="sm">{t('matchType.' + m.type)}</Badge>
        <Badge variant={completed ? 'green' : 'default'} size="sm">{t('matchStatus.' + m.status)}</Badge>
        {dateLabel && <span className="text-xs text-gray-500">{dateLabel}</span>}
        {onResult && <button type="button" onClick={onResult} className="text-xs text-neon-blue hover:underline">{t('admin.matches.setResult')}</button>}
      </div>
    </div>
  );
}

function ApplicationRow({ a, t, onDecide, onContact, acting }: any) {
  const u = a.user || {};
  const name = u.displayName || u.username || '—';
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gaming-border bg-gaming-surface/40 p-2.5">
      {u.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarSrc(u.avatar, 64)} alt={name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold text-white shrink-0">{name[0]?.toUpperCase() || 'J'}</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/players/${a.userId}`} className="text-sm font-medium text-white truncate hover:text-neon-blue">{name}</Link>
          {a.role && <Badge variant="purple" size="sm" className="gap-1"><RoleIcon role={a.role} size={13} /> {t('lane.' + a.role)}</Badge>}
        </div>
        {a.message && <p className="text-xs text-gray-400 truncate">{a.message}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button size="sm" disabled={acting === a.id + 'accepted'} onClick={() => onDecide(a, 'accepted')}><Check size={14} /></Button>
        <Button size="sm" variant="danger" disabled={acting === a.id + 'rejected'} onClick={() => onDecide(a, 'rejected')}><X size={14} /></Button>
        <Button size="sm" variant="ghost" title={t('teams.contact')} onClick={() => onContact(u)}><MessageSquare size={14} /></Button>
      </div>
    </div>
  );
}

export default function TeamDetailPage() {
  const t = useT();
  const params = useParams();
  const id = String(params?.id || '');
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const myId = useAuthStore((s: any) => s.user?.id);
  const isAdmin = useAuthStore((s: any) => ['admin', 'moderator'].includes(s.user?.roleUser));
  const [tab, setTab] = useState<'roster' | 'recruitment' | 'matches'>('roster');

  const refresh = () => api.esport.team(id).then(setTeam).catch(() => setTeam(null));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.esport.team(id).then(setTeam).catch(() => setTeam(null)).finally(() => setLoading(false));
  }, [id]);

  const members: any[] = Array.isArray(team?.members) ? team.members : [];
  const isMember = !!myId && members.some((m) => m.userId === myId);
  const captainId = team?.captain?.userId ?? team?.captain?.id;
  const amCaptain = !!myId && captainId === myId;
  const canManage = amCaptain || isAdmin;

  const err = (e: any) => toast.error(e?.message || t('common.error'));

  // --- Recrutement (campagnes) ---
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [myAppliedIds, setMyAppliedIds] = useState<Set<string>>(new Set());
  const [actingApp, setActingApp] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [newSlots, setNewSlots] = useState<Record<string, number>>({});
  const [creating, setCreating] = useState(false);
  const [applyCampaign, setApplyCampaign] = useState<any | null>(null);
  const [applyForm, setApplyForm] = useState({ role: '', message: '' });
  const [applying, setApplying] = useState(false);
  const [pendingDel, setPendingDel] = useState<any | null>(null);

  const loadCampaigns = () =>
    api.recruitment.byTeam(id).then((r: any) => setCampaigns(Array.isArray(r) ? r : [])).catch(() => {});

  useEffect(() => {
    if (!id) return;
    loadCampaigns();
    if (myId) api.recruitment.mine().then((m: any) => setMyAppliedIds(new Set((Array.isArray(m) ? m : []).filter((a: any) => a.status === 'pending').map((a: any) => a.recruitmentId)))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, myId, canManage]);

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const slots = LANES.filter((l) => (newSlots[l] || 0) > 0).map((l) => ({ role: l, quantity: newSlots[l] }));
    if (slots.length === 0) { toast.error(t('recruitment.needRole')); return; }
    setCreating(true);
    try {
      await api.recruitment.create({ teamId: id, message: newMsg.trim() || undefined, slots });
      toast.success(t('admin.esport.saved'));
      setNewOpen(false); setNewMsg(''); setNewSlots({});
      await loadCampaigns();
    } catch (e2: any) { err(e2); } finally { setCreating(false); }
  };

  const toggleCampaign = async (c: any) => {
    try {
      await api.recruitment.update(c.id, { status: c.status === 'open' ? 'closed' : 'open' });
      await loadCampaigns();
    } catch (e2: any) { err(e2); }
  };

  const doDeleteCampaign = async () => {
    if (!pendingDel) return;
    try {
      await api.recruitment.remove(pendingDel.id);
      toast.success(t('admin.esport.deleted'));
      setPendingDel(null);
      await loadCampaigns();
    } catch (e2: any) { err(e2); }
  };

  const decideApp = async (a: any, status: 'accepted' | 'rejected') => {
    setActingApp(a.id + status);
    try {
      await api.recruitment.decide(a.id, status);
      toast.success(status === 'accepted' ? t('teams.accepted') : t('teams.refused'));
      await loadCampaigns();
      if (status === 'accepted') await refresh();
    } catch (e2: any) { err(e2); } finally { setActingApp(null); }
  };

  const openApply = (c: any) => { setApplyCampaign(c); setApplyForm({ role: c.slots?.[0]?.role || '', message: '' }); };
  const submitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyCampaign) return;
    setApplying(true);
    try {
      await api.recruitment.apply(applyCampaign.id, { role: applyForm.role || undefined, message: applyForm.message.trim() || undefined });
      toast.success(t('recruitment.applySent'));
      setMyAppliedIds((prev) => new Set(prev).add(applyCampaign.id));
      setApplyCampaign(null);
    } catch (e2: any) { err(e2); } finally { setApplying(false); }
  };

  // --- Membres (capitaine) ---
  const [busyMember, setBusyMember] = useState(false);
  const runMember = async (fn: () => Promise<any>) => {
    setBusyMember(true);
    try { await fn(); await refresh(); } catch (e2: any) { err(e2); } finally { setBusyMember(false); }
  };

  // --- Matchs (capitaine) ---
  const [planOpen, setPlanOpen] = useState(false);
  const [otherTeams, setOtherTeams] = useState<any[]>([]);
  const [planForm, setPlanForm] = useState({ opponentId: '', type: 'friendly', scheduledAt: '' });
  const [planning, setPlanning] = useState(false);
  const [resultMatch, setResultMatch] = useState<any | null>(null);
  const [resultForm, setResultForm] = useState({ scoreA: 0, scoreB: 0, winnerTeamId: '' });
  const [savingResult, setSavingResult] = useState(false);

  useEffect(() => {
    if (!amCaptain) return;
    api.esport.teams().then((all: any) => setOtherTeams(Array.isArray(all) ? all.filter((x: any) => x.id !== id) : [])).catch(() => {});
  }, [amCaptain, id]);

  const submitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.opponentId) return;
    setPlanning(true);
    try {
      await api.esport.createMatch({ teamAId: id, teamBId: planForm.opponentId, type: planForm.type, scheduledAt: planForm.scheduledAt || undefined });
      toast.success(t('admin.esport.saved'));
      setPlanOpen(false); setPlanForm({ opponentId: '', type: 'friendly', scheduledAt: '' });
      await refresh();
    } catch (e2: any) { err(e2); } finally { setPlanning(false); }
  };
  const openResult = (m: any) => { setResultMatch(m); setResultForm({ scoreA: m.scoreA ?? 0, scoreB: m.scoreB ?? 0, winnerTeamId: m.winnerTeamId || '' }); };
  const submitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultMatch) return;
    setSavingResult(true);
    try {
      await api.esport.setMatchResult(resultMatch.id, { scoreA: Number(resultForm.scoreA), scoreB: Number(resultForm.scoreB), winnerTeamId: resultForm.winnerTeamId || undefined });
      toast.success(t('admin.esport.saved'));
      setResultMatch(null);
      await refresh();
    } catch (e2: any) { err(e2); } finally { setSavingResult(false); }
  };

  // --- Contacter ---
  const [contactUser, setContactUser] = useState<any | null>(null);
  const [contactBody, setContactBody] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const sendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactUser || !contactBody.trim()) return;
    setContactSending(true);
    try {
      await api.messages.startThread({ userId: contactUser.id, subject: team?.name, body: contactBody.trim() });
      toast.success(t('messages.sent'));
      setContactUser(null); setContactBody('');
    } catch (e2: any) { err(e2); } finally { setContactSending(false); }
  };

  const stats = team?.stats || {};
  const matches: any[] = Array.isArray(team?.matches) ? team.matches : [];
  const captainMember = useMemo(
    () => members.find((m) => m.isCaptain || m.userId === captainId) || (team?.captain ? { userId: captainId, isCaptain: true, role: null, user: team.captain } : null),
    [members, captainId, team],
  );
  const others = members.filter((m) => m.userId !== captainId && !m.isCaptain);
  const starters = others.filter((m) => !m.isSubstitute);
  const substitutes = others.filter((m) => m.isSubstitute);
  const pendingCandidates = campaigns.reduce((n, c) => n + (c.applicationCount || 0), 0);

  if (loading) {
    return <div className="p-4 sm:p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]"><div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" /></div>;
  }
  if (!team) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <Link href="/teams" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6"><ArrowLeft size={16} /> {t('teams.back')}</Link>
        <p className="text-center text-gray-500 py-20">{t('teams.detail.notFound')}</p>
      </div>
    );
  }

  let foundedLabel = '';
  if (team.foundedAt) { const d = new Date(team.foundedAt); if (!isNaN(d.getTime())) foundedLabel = d.toLocaleDateString(); }

  const TABS = [
    { key: 'roster' as const, label: t('teams.tab.roster') },
    { key: 'recruitment' as const, label: t('teams.tab.recruitment'), badge: canManage ? pendingCandidates : 0 },
    { key: 'matches' as const, label: t('teams.tab.matches') },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Link href="/teams" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-5"><ArrowLeft size={16} /> {t('teams.back')}</Link>

      {/* En-tête profil */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full overflow-hidden border-2 border-gaming-border bg-gaming-surface">
          {team.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={team.image} alt={team.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-blue to-neon-purple text-3xl font-bold text-white">{team.name?.[0]?.toUpperCase() || 'T'}</div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{team.name}</h1>
            <Badge variant={team.type === 'esport' ? 'gold' : 'default'} size="sm">{t('admin.esport.badge.' + (team.type || 'community'))}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
            <span className="inline-flex items-center gap-1.5"><Users size={14} className="text-neon-blue" />{team.memberCount ?? members.length} {t('teams.members')}</span>
            {foundedLabel && <span className="inline-flex items-center gap-1.5"><Calendar size={14} className="text-neon-blue" />{t('teams.detail.founded')} {foundedLabel}</span>}
          </div>
          {team.description && <p className="text-sm text-gray-400 mt-2 whitespace-pre-line">{team.description}</p>}
        </div>
      </div>

      {/* Bilan */}
      {stats.played > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatBox label={t('teams.detail.played')} value={stats.played} />
          <StatBox label={t('teams.detail.wins')} value={stats.wins} color="text-green-400" />
          <StatBox label={t('teams.detail.losses')} value={stats.losses} color="text-red-400" />
          <StatBox label={t('teams.detail.winRate')} value={`${stats.winRate ?? 0}%`} color="text-neon-blue" />
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b border-gaming-border">
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-4 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors ${tab === tb.key ? 'border-neon-blue text-neon-blue' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {tb.label}
            {tb.badge ? <span className="ml-1.5 text-xs px-1.5 rounded-full bg-neon-blue/20 text-neon-blue">{tb.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* Onglet Effectif */}
      {tab === 'roster' && (
        <div>
          {amCaptain ? (
            members.length === 0 ? <p className="text-sm text-gray-500">{t('teams.detail.noMembers')}</p> : (
              <div className="space-y-2">
                {members.map((m) => {
                  const u = m.user || {}; const isCap = m.userId === captainId;
                  return (
                    <div key={m.id ?? m.userId} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-gaming-border bg-gaming-surface/40 p-2.5">
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <span className="text-sm text-white truncate">{u.displayName || u.username}</span>
                        {isCap && <Badge variant="gold" size="sm" className="gap-1"><Crown size={11} /> {t('teams.detail.captain')}</Badge>}
                        {hasRankBadge(u.gameRank) && <RankBadge rank={u.gameRank} size={16} />}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <RoleSelect value={m.role || ''} onChange={(v) => runMember(() => api.esport.updateMember(id, m.userId, { role: v || null }))} options={LANES} noneLabel={t('admin.esport.noRole')} labelFor={(l) => t('lane.' + l)} disabled={busyMember} />
                        <button onClick={() => runMember(() => api.esport.updateMember(id, m.userId, { isSubstitute: !m.isSubstitute }))} disabled={busyMember}
                          className={`px-2 py-1 text-xs rounded-lg border transition-colors ${m.isSubstitute ? 'bg-gaming-surface border-gaming-border text-gray-400' : 'bg-neon-blue/15 border-neon-blue text-neon-blue'}`}>
                          {m.isSubstitute ? t('admin.esport.substitute') : t('admin.esport.starter')}
                        </button>
                        {!isCap && <button onClick={() => runMember(() => api.esport.removeMember(id, m.userId))} disabled={busyMember} title={t('admin.esport.remove')} className="inline-flex items-center px-2 py-1 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"><X size={12} /></button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : !captainMember && members.length === 0 ? <p className="text-sm text-gray-500">{t('teams.detail.noMembers')}</p> : (
            <div className="space-y-5">
              {captainMember && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5"><Crown size={15} className="text-yellow-400" /><span className="text-xs font-semibold uppercase tracking-wide text-yellow-400">{t('teams.detail.captain')}</span></div>
                  <MemberCard m={captainMember} t={t} highlight />
                </div>
              )}
              {starters.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2.5">{t('teams.detail.starters')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{starters.map((m, i) => <MemberCard key={m.id ?? m.userId ?? i} m={m} t={t} />)}</div>
                </div>
              )}
              {substitutes.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2.5">{t('teams.detail.substitutes')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{substitutes.map((m, i) => <MemberCard key={m.id ?? m.userId ?? i} m={m} t={t} />)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Onglet Recrutement */}
      {tab === 'recruitment' && (
        <div className="space-y-4">
          {canManage && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setNewOpen(true)}><Plus size={15} /> {t('recruitment.new')}</Button>
            </div>
          )}

          {campaigns.length === 0 ? (
            <p className="text-sm text-gray-500">{canManage ? t('recruitment.noCampaigns') : t('teams.notRecruitingMsg')}</p>
          ) : (
            campaigns.map((c) => {
              const applied = myAppliedIds.has(c.id);
              return (
                <div key={c.id} className="rounded-xl border border-gaming-border bg-gaming-surface/40 p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Megaphone size={16} className="text-neon-blue" />
                      {(c.slots || []).map((s: any) => (
                        <Badge key={s.role} variant="purple" size="sm" className="gap-1">
                          <RoleIcon role={s.role} size={13} /> {t('lane.' + s.role)}{s.quantity > 1 && <span className="ml-0.5 opacity-80">×{s.quantity}</span>}
                        </Badge>
                      ))}
                      <Badge variant={c.status === 'open' ? 'green' : 'default'} size="sm">{c.status === 'open' ? t('recruitment.statusOpen') : t('recruitment.statusClosed')}</Badge>
                    </div>
                    {canManage ? (
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => toggleCampaign(c)}>{c.status === 'open' ? t('recruitment.close') : t('recruitment.reopen')}</Button>
                        <Button size="sm" variant="danger" title={t('recruitment.close')} onClick={() => setPendingDel(c)}><Trash2 size={14} /></Button>
                      </div>
                    ) : c.status === 'open' && !isMember && myId ? (
                      applied ? <span className="text-xs text-gray-400">{t('recruitment.applied')}</span> : <Button size="sm" onClick={() => openApply(c)}><Send size={14} /> {t('recruitment.apply')}</Button>
                    ) : null}
                  </div>
                  {c.message && <p className="text-sm text-gray-400 mb-3 whitespace-pre-line">{c.message}</p>}

                  {canManage && (
                    <div className="pt-3 border-t border-gaming-border">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t('recruitment.candidates')}{c.applicationCount ? ` (${c.applicationCount})` : ''}</p>
                      {(c.applications || []).length === 0 ? (
                        <p className="text-sm text-gray-500">{t('recruitment.noCandidates')}</p>
                      ) : (
                        <div className="space-y-2">
                          {c.applications.map((a: any) => (
                            <ApplicationRow key={a.id} a={a} t={t} acting={actingApp} onDecide={decideApp} onContact={(u: any) => { setContactUser(u); setContactBody(''); }} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Onglet Matchs */}
      {tab === 'matches' && (
        <div>
          {amCaptain && <div className="flex justify-end mb-4"><Button size="sm" onClick={() => setPlanOpen(true)}><Swords size={15} /> {t('teams.planMatch')}</Button></div>}
          {matches.length === 0 ? <p className="text-sm text-gray-500">{t('teams.detail.noMatches')}</p> : (
            <div className="space-y-2">{matches.map((m, i) => <MatchRow key={m.id ?? i} m={m} t={t} onResult={amCaptain && m.type !== 'official' ? () => openResult(m) : undefined} />)}</div>
          )}
        </div>
      )}

      {/* Modal nouveau recrutement */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} closeLabel={t('common.close')} title={t('recruitment.newTitle')}>
        <form onSubmit={createCampaign} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('recruitment.pickRoles')}</label>
            <p className="text-xs text-gray-500 mb-2">{t('recruitment.pickRolesHint')}</p>
            <div className="space-y-2">
              {LANES.map((l) => (
                <div key={l} className="flex items-center gap-2">
                  <RoleIcon role={l} size={16} />
                  <span className="text-sm text-gray-200 flex-1">{t('lane.' + l)}</span>
                  <input type="number" min={0} max={20} value={newSlots[l] || 0} onChange={(e) => setNewSlots({ ...newSlots, [l]: Math.max(0, parseInt(e.target.value, 10) || 0) })} className="w-20 px-2 py-1 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 focus:outline-none focus:border-neon-blue" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('recruitment.message')}</label>
            <textarea className={`${inputCls} min-h-[70px] resize-y`} value={newMsg} onChange={(e) => setNewMsg(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" disabled={creating}><Megaphone size={15} /> {t('recruitment.create')}</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setNewOpen(false)}>{t('admin.esport.cancel')}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal postuler */}
      <Modal open={!!applyCampaign} onClose={() => setApplyCampaign(null)} closeLabel={t('common.close')} title={t('recruitment.applyTitle')}>
        <form onSubmit={submitApply} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('recruitment.applyRole')}</label>
            <RoleSelect value={applyForm.role} onChange={(v) => setApplyForm({ ...applyForm, role: v })} options={(applyCampaign?.slots || []).map((s: any) => s.role)} noneLabel={t('admin.esport.noRole')} labelFor={(l) => t('lane.' + l)} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('recruitment.applyMessage')}</label>
            <textarea className={`${inputCls} min-h-[80px] resize-y`} value={applyForm.message} onChange={(e) => setApplyForm({ ...applyForm, message: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" disabled={applying}><Send size={15} /> {t('recruitment.applySubmit')}</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setApplyCampaign(null)}>{t('admin.esport.cancel')}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal planifier match */}
      <Modal open={planOpen} onClose={() => setPlanOpen(false)} closeLabel={t('common.close')} title={t('teams.planMatch')}>
        <form onSubmit={submitPlan} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('teams.opponent')}</label>
            <select value={planForm.opponentId} onChange={(e) => setPlanForm({ ...planForm, opponentId: e.target.value })} required className={inputCls}>
              <option value="">{t('teams.selectOpponent')}</option>
              {otherTeams.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('admin.matches.type')}</label>
            <select value={planForm.type} onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })} className={inputCls}>
              <option value="friendly">{t('matchType.friendly')}</option>
              <option value="training">{t('matchType.training')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('admin.matches.date')}</label>
            <input type="datetime-local" value={planForm.scheduledAt} onChange={(e) => setPlanForm({ ...planForm, scheduledAt: e.target.value })} className={inputCls} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" disabled={planning || !planForm.opponentId}><Calendar size={15} /> {t('admin.matches.schedule')}</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setPlanOpen(false)}>{t('admin.esport.cancel')}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal résultat */}
      <Modal open={!!resultMatch} onClose={() => setResultMatch(null)} closeLabel={t('common.close')} title={t('admin.matches.result')}>
        {resultMatch && (
          <form onSubmit={submitResult} className="space-y-3">
            <p className="text-sm text-white text-center">{resultMatch.teamA?.name} <span className="text-gray-500">vs</span> {resultMatch.teamB?.name}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-gray-400 mb-1">{t('admin.matches.scoreA')}</label><input type="number" min={0} value={resultForm.scoreA} onChange={(e) => setResultForm({ ...resultForm, scoreA: Number(e.target.value) })} className={inputCls} /></div>
              <div><label className="block text-xs text-gray-400 mb-1">{t('admin.matches.scoreB')}</label><input type="number" min={0} value={resultForm.scoreB} onChange={(e) => setResultForm({ ...resultForm, scoreB: Number(e.target.value) })} className={inputCls} /></div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('admin.matches.winner')}</label>
              <select value={resultForm.winnerTeamId} onChange={(e) => setResultForm({ ...resultForm, winnerTeamId: e.target.value })} className={inputCls}>
                <option value="">{t('admin.matches.autoWinner')}</option>
                <option value={resultMatch.teamA?.id}>{resultMatch.teamA?.name}</option>
                <option value={resultMatch.teamB?.id}>{resultMatch.teamB?.name}</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" type="submit" disabled={savingResult}><Check size={15} /> {t('admin.esport.save')}</Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => setResultMatch(null)}>{t('admin.esport.cancel')}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal contacter */}
      <Modal open={!!contactUser} onClose={() => setContactUser(null)} closeLabel={t('common.close')} title={`${t('messages.newMessageTo')} ${contactUser?.displayName || contactUser?.username || ''}`}>
        <form onSubmit={sendContact} className="space-y-3">
          <textarea className={`${inputCls} min-h-[100px] resize-y`} value={contactBody} onChange={(e) => setContactBody(e.target.value)} placeholder={t('messages.placeholder')} required />
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" disabled={contactSending || !contactBody.trim()}><MessageSquare size={15} /> {t('messages.send')}</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setContactUser(null)}>{t('admin.esport.cancel')}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!pendingDel}
        onClose={() => setPendingDel(null)}
        onConfirm={doDeleteCampaign}
        danger
        title={t('admin.confirm.title')}
        message={t('recruitment.deleteConfirm')}
        confirmLabel={t('admin.esport.delete')}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}
