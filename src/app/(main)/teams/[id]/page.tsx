'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Crown, Users, Calendar, Check, X,
  Swords, MessageSquare, Plus, Trash2, Send, Megaphone,
} from 'lucide-react';
import {
  Badge, Button, Card, SectionCard, EmptyState, LoadingSpinner, Tabs, Input, Textarea, Select,
} from '@/components/ui';
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
// Compact field (slot quantity): Input doesn't fit inline
const numCls =
  'w-20 px-2 py-1 text-sm rounded-md bg-gray-2 border border-stroke text-black focus:outline-none focus:border-primary dark:bg-meta-4 dark:border-strokedark dark:text-white';

function MemberCard({ m, t, highlight = false }: any) {
  const u = m?.user || {};
  const name = u.displayName || u.username || '';
  return (
    <Link href={`/players/${m.userId}`} className={`flex items-center gap-3 rounded-sm border bg-white p-3 shadow-default transition-colors dark:bg-boxdark ${highlight ? 'border-warning/40 hover:border-warning' : 'border-stroke hover:border-primary dark:border-strokedark'}`}>
      {u.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarSrc(u.avatar, 96)} alt={name} referrerPolicy="no-referrer" className="h-12 w-12 rounded-sm border border-stroke object-cover dark:border-strokedark" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary text-lg font-bold text-white">{name?.[0]?.toUpperCase() || 'J'}</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {m.isCaptain && <Crown size={14} className="shrink-0 text-warning" />}
          <p className="truncate text-sm font-medium text-black dark:text-white">{name}</p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {m.role && <Badge variant="purple" size="sm" className="gap-1"><RoleIcon role={m.role} size={14} /> {t('lane.' + m.role)}</Badge>}
          {hasRankBadge(u.gameRank) && <span className="inline-flex items-center gap-1 text-xs text-body dark:text-bodydark"><RankBadge rank={u.gameRank} size={16} /> {u.gameRank}</span>}
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
    <div className="rounded-sm border border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
        <span className={`truncate text-right ${aWin ? 'font-bold text-warning' : 'text-black dark:text-white'}`}>{m.teamA?.name}</span>
        <span className="shrink-0 px-2 font-semibold text-body dark:text-bodydark">{completed ? `${m.scoreA} - ${m.scoreB}` : 'vs'}</span>
        <span className={`truncate text-left ${bWin ? 'font-bold text-warning' : 'text-black dark:text-white'}`}>{m.teamB?.name}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Badge variant="purple" size="sm">{t('matchType.' + m.type)}</Badge>
        <Badge variant={completed ? 'green' : 'default'} size="sm">{t('matchStatus.' + m.status)}</Badge>
        {dateLabel && <span className="text-xs text-bodydark2">{dateLabel}</span>}
        {onResult && <Button variant="ghost" size="sm" onClick={onResult}>{t('admin.matches.setResult')}</Button>}
      </div>
    </div>
  );
}

function ApplicationRow({ a, t, onDecide, onContact, acting }: any) {
  const u = a.user || {};
  const name = u.displayName || u.username || '—';
  return (
    <div className="flex items-center gap-3 rounded-sm border border-stroke bg-white p-2.5 shadow-default dark:border-strokedark dark:bg-boxdark">
      {u.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarSrc(u.avatar, 64)} alt={name} referrerPolicy="no-referrer" className="h-8 w-8 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{name[0]?.toUpperCase() || 'J'}</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/players/${a.userId}`} className="truncate text-sm font-medium text-black hover:text-primary dark:text-white">{name}</Link>
          {a.role && <Badge variant="purple" size="sm" className="gap-1"><RoleIcon role={a.role} size={13} /> {t('lane.' + a.role)}</Badge>}
        </div>
        {a.message && <p className="truncate text-xs text-body dark:text-bodydark">{a.message}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button size="sm" variant="success" disabled={acting === a.id + 'accepted'} onClick={() => onDecide(a, 'accepted')}><Check size={14} /></Button>
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

  // --- Recruitment (campaigns) ---
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

  // --- Members (captain) ---
  const [busyMember, setBusyMember] = useState(false);
  const runMember = async (fn: () => Promise<any>) => {
    setBusyMember(true);
    try { await fn(); await refresh(); } catch (e2: any) { err(e2); } finally { setBusyMember(false); }
  };

  // --- Matches (captain) ---
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

  // --- Contact ---
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
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-4xl items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!team) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/teams" className="inline-flex items-center gap-1.5 text-sm text-body hover:text-primary dark:text-bodydark"><ArrowLeft size={16} /> {t('teams.back')}</Link>
        <EmptyState icon={<Users size={28} />} title={t('teams.detail.notFound')} />
      </div>
    );
  }

  let foundedLabel = '';
  if (team.foundedAt) { const d = new Date(team.foundedAt); if (!isNaN(d.getTime())) foundedLabel = d.toLocaleDateString(); }

  const TABS = [
    { id: 'roster', icon: Users, label: t('teams.tab.roster') },
    {
      id: 'recruitment',
      icon: Megaphone,
      label: (
        <span className="flex items-center gap-1.5">
          {t('teams.tab.recruitment')}
          {canManage && pendingCandidates > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">{pendingCandidates}</span>
          )}
        </span>
      ),
    },
    { id: 'matches', icon: Swords, label: t('teams.tab.matches') },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/teams" className="inline-flex items-center gap-1.5 text-sm text-body hover:text-primary dark:text-bodydark"><ArrowLeft size={16} /> {t('teams.back')}</Link>

      {/* Profile header */}
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-stroke bg-gray-2 dark:border-strokedark dark:bg-meta-4 sm:h-28 sm:w-28">
          {team.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={team.image} alt={team.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary text-3xl font-bold text-white">{team.name?.[0]?.toUpperCase() || 'T'}</div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-black dark:text-white sm:text-3xl">{team.name}</h1>
            <Badge variant={team.type === 'esport' ? 'gold' : 'default'} size="sm">{t('admin.esport.badge.' + (team.type || 'community'))}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-body dark:text-bodydark">
            <span className="inline-flex items-center gap-1.5"><Users size={14} className="text-primary" />{team.memberCount ?? members.length} {t('teams.members')}</span>
            {foundedLabel && <span className="inline-flex items-center gap-1.5"><Calendar size={14} className="text-primary" />{t('teams.detail.founded')} {foundedLabel}</span>}
          </div>
          {team.description && <p className="mt-2 whitespace-pre-line text-sm text-body dark:text-bodydark">{team.description}</p>}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={TABS} active={tab} onChange={(v: string) => setTab(v as typeof tab)} className="flex-wrap" />

      {/* Roster tab */}
      {tab === 'roster' && (
        <div>
          {amCaptain ? (
            members.length === 0 ? <EmptyState icon={<Users size={28} />} title={t('teams.detail.noMembers')} /> : (
              <div className="space-y-2">
                {members.map((m) => {
                  const u = m.user || {}; const isCap = m.userId === captainId;
                  return (
                    <div key={m.id ?? m.userId} className="flex flex-col gap-2 rounded-sm border border-stroke bg-white p-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <span className="truncate text-sm text-black dark:text-white">{u.displayName || u.username}</span>
                        {isCap && <Badge variant="gold" size="sm" className="gap-1"><Crown size={11} /> {t('teams.detail.captain')}</Badge>}
                        {hasRankBadge(u.gameRank) && <RankBadge rank={u.gameRank} size={16} />}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <RoleSelect value={m.role || ''} onChange={(v) => runMember(() => api.esport.updateMember(id, m.userId, { role: v || null }))} options={LANES} noneLabel={t('admin.esport.noRole')} labelFor={(l) => t('lane.' + l)} disabled={busyMember} />
                        <Button size="sm" variant={m.isSubstitute ? 'outline' : 'secondary'} onClick={() => runMember(() => api.esport.updateMember(id, m.userId, { isSubstitute: !m.isSubstitute }))} disabled={busyMember}>
                          {m.isSubstitute ? t('admin.esport.substitute') : t('admin.esport.starter')}
                        </Button>
                        {!isCap && <Button size="sm" variant="danger" onClick={() => runMember(() => api.esport.removeMember(id, m.userId))} disabled={busyMember} title={t('admin.esport.remove')}><X size={12} /></Button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : !captainMember && members.length === 0 ? <EmptyState icon={<Users size={28} />} title={t('teams.detail.noMembers')} /> : (
            <div className="space-y-5">
              {captainMember && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5"><Crown size={15} className="text-yellow-400" /><span className="text-xs font-semibold uppercase tracking-wide text-yellow-400">{t('teams.detail.captain')}</span></div>
                  <MemberCard m={captainMember} t={t} highlight />
                </div>
              )}
              {starters.length > 0 && (
                <div>
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark">{t('teams.detail.starters')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{starters.map((m, i) => <MemberCard key={m.id ?? m.userId ?? i} m={m} t={t} />)}</div>
                </div>
              )}
              {substitutes.length > 0 && (
                <div>
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark">{t('teams.detail.substitutes')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{substitutes.map((m, i) => <MemberCard key={m.id ?? m.userId ?? i} m={m} t={t} />)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recruitment tab */}
      {tab === 'recruitment' && (
        <div className="space-y-4">
          {canManage && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setNewOpen(true)}><Plus size={15} /> {t('recruitment.new')}</Button>
            </div>
          )}

          {campaigns.length === 0 ? (
            <EmptyState icon={<Megaphone size={28} />} title={canManage ? t('recruitment.noCampaigns') : t('teams.notRecruitingMsg')} />
          ) : (
            campaigns.map((c) => {
              const applied = myAppliedIds.has(c.id);
              return (
                <div key={c.id} className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Megaphone size={16} className="text-primary" />
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
                      applied ? <span className="text-xs text-body dark:text-bodydark">{t('recruitment.applied')}</span> : <Button size="sm" onClick={() => openApply(c)}><Send size={14} /> {t('recruitment.apply')}</Button>
                    ) : null}
                  </div>
                  {c.message && <p className="mb-3 whitespace-pre-line text-sm text-body dark:text-bodydark">{c.message}</p>}

                  {canManage && (
                    <div className="border-t border-stroke pt-3 dark:border-strokedark">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark">{t('recruitment.candidates')}{c.applicationCount ? ` (${c.applicationCount})` : ''}</p>
                      {(c.applications || []).length === 0 ? (
                        <p className="text-sm text-bodydark2">{t('recruitment.noCandidates')}</p>
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

      {/* Matches tab */}
      {tab === 'matches' && (
        <div>
          {amCaptain && <div className="flex justify-end mb-4"><Button size="sm" onClick={() => setPlanOpen(true)}><Swords size={15} /> {t('teams.planMatch')}</Button></div>}
          {matches.length === 0 ? <EmptyState icon={<Swords size={28} />} title={t('teams.detail.noMatches')} /> : (
            <div className="space-y-2">{matches.map((m, i) => <MatchRow key={m.id ?? i} m={m} t={t} onResult={amCaptain && m.type !== 'official' ? () => openResult(m) : undefined} />)}</div>
          )}
        </div>
      )}

      {/* New recruitment modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} closeLabel={t('common.close')} title={t('recruitment.newTitle')} icon={<Megaphone size={20} />} headerVariant="gradient">
        <form onSubmit={createCampaign} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">{t('recruitment.pickRoles')}</label>
            <p className="mb-2 text-xs text-bodydark2">{t('recruitment.pickRolesHint')}</p>
            <div className="space-y-2">
              {LANES.map((l) => (
                <div key={l} className="flex items-center gap-2">
                  <RoleIcon role={l} size={16} />
                  <span className="flex-1 text-sm text-body dark:text-bodydark">{t('lane.' + l)}</span>
                  <input type="number" min={0} max={20} value={newSlots[l] || 0} onChange={(e) => setNewSlots({ ...newSlots, [l]: Math.max(0, parseInt(e.target.value, 10) || 0) })} className={numCls} />
                </div>
              ))}
            </div>
          </div>
          <Textarea label={t('recruitment.message')} value={newMsg} onChange={(e: any) => setNewMsg(e.target.value)} className="min-h-[70px]" />
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" loading={creating} disabled={creating}><Megaphone size={15} /> {t('recruitment.create')}</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setNewOpen(false)}>{t('admin.esport.cancel')}</Button>
          </div>
        </form>
      </Modal>

      {/* Apply modal */}
      <Modal open={!!applyCampaign} onClose={() => setApplyCampaign(null)} closeLabel={t('common.close')} title={t('recruitment.applyTitle')} icon={<Send size={20} />} headerVariant="gradient">
        <form onSubmit={submitApply} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-black dark:text-white">{t('recruitment.applyRole')}</label>
            <RoleSelect value={applyForm.role} onChange={(v) => setApplyForm({ ...applyForm, role: v })} options={(applyCampaign?.slots || []).map((s: any) => s.role)} noneLabel={t('admin.esport.noRole')} labelFor={(l) => t('lane.' + l)} />
          </div>
          <Textarea label={t('recruitment.applyMessage')} value={applyForm.message} onChange={(e: any) => setApplyForm({ ...applyForm, message: e.target.value })} className="min-h-[80px]" />
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" loading={applying} disabled={applying}><Send size={15} /> {t('recruitment.applySubmit')}</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setApplyCampaign(null)}>{t('admin.esport.cancel')}</Button>
          </div>
        </form>
      </Modal>

      {/* Schedule match modal */}
      <Modal open={planOpen} onClose={() => setPlanOpen(false)} closeLabel={t('common.close')} title={t('teams.planMatch')} icon={<Swords size={20} />} headerVariant="gradient">
        <form onSubmit={submitPlan} className="space-y-4">
          <Select label={t('teams.opponent')} value={planForm.opponentId} onChange={(e: any) => setPlanForm({ ...planForm, opponentId: e.target.value })} required>
            <option value="">{t('teams.selectOpponent')}</option>
            {otherTeams.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
          <Select label={t('admin.matches.type')} value={planForm.type} onChange={(e: any) => setPlanForm({ ...planForm, type: e.target.value })}>
            <option value="friendly">{t('matchType.friendly')}</option>
            <option value="training">{t('matchType.training')}</option>
          </Select>
          <Input label={t('admin.matches.date')} type="datetime-local" value={planForm.scheduledAt} onChange={(e: any) => setPlanForm({ ...planForm, scheduledAt: e.target.value })} />
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" loading={planning} disabled={planning || !planForm.opponentId}><Calendar size={15} /> {t('admin.matches.schedule')}</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setPlanOpen(false)}>{t('admin.esport.cancel')}</Button>
          </div>
        </form>
      </Modal>

      {/* Result modal */}
      <Modal open={!!resultMatch} onClose={() => setResultMatch(null)} closeLabel={t('common.close')} title={t('admin.matches.result')} icon={<Check size={20} />} headerVariant="gradient">
        {resultMatch && (
          <form onSubmit={submitResult} className="space-y-4">
            <p className="text-center text-sm text-black dark:text-white">{resultMatch.teamA?.name} <span className="text-bodydark2">vs</span> {resultMatch.teamB?.name}</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('admin.matches.scoreA')} type="number" min={0} value={resultForm.scoreA} onChange={(e: any) => setResultForm({ ...resultForm, scoreA: Number(e.target.value) })} />
              <Input label={t('admin.matches.scoreB')} type="number" min={0} value={resultForm.scoreB} onChange={(e: any) => setResultForm({ ...resultForm, scoreB: Number(e.target.value) })} />
            </div>
            <Select label={t('admin.matches.winner')} value={resultForm.winnerTeamId} onChange={(e: any) => setResultForm({ ...resultForm, winnerTeamId: e.target.value })}>
              <option value="">{t('admin.matches.autoWinner')}</option>
              <option value={resultMatch.teamA?.id}>{resultMatch.teamA?.name}</option>
              <option value={resultMatch.teamB?.id}>{resultMatch.teamB?.name}</option>
            </Select>
            <div className="flex gap-2 pt-1">
              <Button size="sm" type="submit" loading={savingResult} disabled={savingResult}><Check size={15} /> {t('admin.esport.save')}</Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => setResultMatch(null)}>{t('admin.esport.cancel')}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Contact modal */}
      <Modal open={!!contactUser} onClose={() => setContactUser(null)} closeLabel={t('common.close')} title={`${t('messages.newMessageTo')} ${contactUser?.displayName || contactUser?.username || ''}`} icon={<MessageSquare size={20} />} headerVariant="gradient">
        <form onSubmit={sendContact} className="space-y-4">
          <Textarea value={contactBody} onChange={(e: any) => setContactBody(e.target.value)} placeholder={t('messages.placeholder')} required className="min-h-[100px]" />
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" loading={contactSending} disabled={contactSending || !contactBody.trim()}><MessageSquare size={15} /> {t('messages.send')}</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setContactUser(null)}>{t('admin.esport.cancel')}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!pendingDel}
        onClose={() => setPendingDel(null)}
        onConfirm={doDeleteCampaign}
        variant="danger"
        title={t('admin.confirm.title')}
        message={t('recruitment.deleteConfirm')}
        confirmLabel={t('admin.esport.delete')}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}
