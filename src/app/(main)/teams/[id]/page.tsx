'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Crown, Users, Calendar, Check, X,
  Swords, MessageSquare, Plus, Trash2, Send, Megaphone,
  LayoutDashboard, UserCog, History, Trophy, CalendarDays,
  Star, CalendarClock,
} from 'lucide-react';
import {
  Badge, Button, Card, EmptyState, PageHeader, Skeleton, Tabs, Input, Textarea, Select,
} from '@/components/ui';
import { MatchScoreline, RankFrame, teamTag } from '@/components/game';
import AvatarFrame from '@/components/game/AvatarFrame';
import { cn } from '@/lib/helpers';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { api, avatarSrc } from '@/lib/api';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import RoleIcon from '@/components/game/RoleIcon';
import RoleSelect from '@/components/game/RoleSelect';
import { useAuthStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';
import TeamOverview from '@/components/teams/TeamOverview';
import TeamStaff from '@/components/teams/TeamStaff';
import TeamHistory from '@/components/teams/TeamHistory';
import TeamHonours from '@/components/teams/TeamHonours';
import TeamSchedule from '@/components/teams/TeamSchedule';
import { can } from '@/lib/permissions';
import ImageUpload from '@/components/ui/ImageUpload';

const LANES = ['roam', 'jungle', 'mid', 'exp', 'gold'];
// Application life cycle, mirrored from the API (GET /recruitment/meta).
const APP_STATUS_VARIANT: Record<string, string> = {
  pending: 'gold',
  shortlisted: 'blue',
  accepted: 'green',
  rejected: 'red',
  withdrawn: 'default',
};
// A terminal application is history: no button left to press on it.
const APP_TERMINAL = ['accepted', 'rejected', 'withdrawn'];
// Lowest in-game level of each tier (decodeRank on the API): a campaign that
// requires "Mythic" must accept every Mythic player, hence the lower bound.
const RANK_TIERS: { level: number; label: string }[] = [
  { level: 1, label: 'Warrior' },
  { level: 11, label: 'Elite' },
  { level: 26, label: 'Master' },
  { level: 46, label: 'Grandmaster' },
  { level: 76, label: 'Epic' },
  { level: 106, label: 'Legend' },
  { level: 136, label: 'Mythic' },
  { level: 161, label: 'Mythic Honor' },
  { level: 186, label: 'Mythic Glory' },
  { level: 236, label: 'Mythic Immortal' },
];
const AVAILABILITY = ['casual', 'regular', 'competitive'];
// Compact field (slot quantity): Input doesn't fit inline
const numCls =
  'w-20 rounded border border-line-strong bg-surface-1 px-2 py-1 text-sm num text-ink-1 outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60';

function MemberCard({ m, t, highlight = false }: any) {
  const u = m?.user || {};
  const name = u.displayName || u.username || '';
  return (
    <Link
      href={`/players/${m.userId}`}
      className={cn(
        'group flex items-center gap-3 rounded-lg border bg-surface-1 p-3 shadow-elev-1 transition-[transform,border-color,box-shadow] duration-base ease-out hover:-translate-y-0.5 hover:shadow-elev-2 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1',
        highlight ? 'border-accent-gold/50 hover:border-accent-gold' : 'border-line-subtle hover:border-primary/40'
      )}
    >
      <AvatarFrame frame={u.equippedFrame} name={name} src={u.avatar ? avatarSrc(u.avatar, 96) : null} rank={u.gameRank} avatarSize={52} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {m.isCaptain && <Crown size={14} className="shrink-0 text-accent-gold" />}
          <p className="truncate font-display text-sm font-bold text-ink-1">{name}</p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {m.role && (
            <span className="inline-flex items-center gap-1 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-ink-2">
              <RoleIcon role={m.role} size={12} /> {t('lane.' + m.role)}
            </span>
          )}
          {u.gameRank && <Badge variant="tier-gold" size="sm">{u.gameRank}</Badge>}
        </div>
      </div>
    </Link>
  );
}

function MatchRow({ m, t, onResult }: any) {
  const completed = m.status === 'completed';
  let dateLabel = '';
  if (m.scheduledAt) { const d = new Date(m.scheduledAt); if (!isNaN(d.getTime())) dateLabel = d.toLocaleDateString(); }
  return (
    <div className="space-y-2">
      <MatchScoreline
        match={{ ...m, teamA: m.teamA || { id: '', name: '?' }, teamB: m.teamB || { id: '', name: '?' } }}
        href={m.id ? `/matches/${m.id}` : null}
        compact
      />
      <div className="flex flex-wrap items-center justify-center gap-2 px-1">
        <Badge variant="purple" size="sm">{t('matchType.' + m.type)}</Badge>
        <Badge variant={completed ? 'green' : 'default'} size="sm">{t('matchStatus.' + m.status)}</Badge>
        {dateLabel && <span className="text-xs num text-ink-3">{dateLabel}</span>}
        {onResult && <Button variant="ghost" size="sm" onClick={onResult}>{t('admin.matches.setResult')}</Button>}
      </div>
    </div>
  );
}

function ApplicationRow({ a, t, onDecide, onContact, acting }: any) {
  const u = a.user || {};
  const name = u.displayName || u.username || '—';
  // The API serves the public profile of the candidate (rank, win rate...), so
  // the recruiter can judge an application without opening another page.
  const games = (u.wins ?? 0) + (u.losses ?? 0);
  const rank = u.gameRank || a.rankLabel;
  const done = APP_TERMINAL.includes(a.status);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line-subtle bg-surface-2/40 p-2.5">
      <RankFrame name={name} src={u.avatar ? avatarSrc(u.avatar, 64) : null} rank={rank} size={36} showBadge={false} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/players/${a.userId}`} className="truncate text-sm font-semibold text-ink-1 hover:text-primary">{name}</Link>
          {a.role && <Badge variant="purple" size="sm" className="gap-1"><RoleIcon role={a.role} size={13} /> {t('lane.' + a.role)}</Badge>}
          {a.availability && (
            <Badge variant="blue" size="sm" className="gap-1"><CalendarClock size={12} /> {t('recruitment.availability.' + a.availability)}</Badge>
          )}
          <Badge variant={APP_STATUS_VARIANT[a.status] ?? 'default'} size="sm">{t('recruitment.status.' + a.status)}</Badge>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs num text-ink-3">
          {rank && (
            <span className="inline-flex items-center gap-1">
              {hasRankBadge(rank) && <RankBadge rank={rank} size={13} />}
              {rank}
            </span>
          )}
          {games > 0 && <span>{t('recruitment.candidateStats', { winRate: u.winRate ?? 0, games })}</span>}
        </div>
        {a.message && <p className="truncate text-xs text-ink-2">{a.message}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {!done && a.status !== 'shortlisted' && (
          <Button size="sm" variant="secondary" title={t('recruitment.shortlist')} disabled={acting === a.id + 'shortlisted'} onClick={() => onDecide(a, 'shortlisted')}><Star size={14} /></Button>
        )}
        {!done && (
          <>
            <Button size="sm" variant="success" disabled={acting === a.id + 'accepted'} onClick={() => onDecide(a, 'accepted')}><Check size={14} /></Button>
            <Button size="sm" variant="danger" disabled={acting === a.id + 'rejected'} onClick={() => onDecide(a, 'rejected')}><X size={14} /></Button>
          </>
        )}
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
  // Staff override (same rule as the API): `admin.esport` permission.
  const isAdmin = useAuthStore((s: any) => can(s.user, 'admin.esport'));
  const [tab, setTab] = useState<'overview' | 'roster' | 'staff' | 'schedule' | 'history' | 'honours' | 'recruitment' | 'matches'>('overview');
  const [teamStats, setTeamStats] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);

  const loadExtras = () => {
    api.esport.teamStats(id).then(setTeamStats).catch(() => setTeamStats(null));
    api.esport.teamSchedule(id).then((r: any) => setSchedule(Array.isArray(r) ? r : [])).catch(() => setSchedule([]));
  };
  const refresh = () => {
    loadExtras();
    return api.esport.team(id).then(setTeam).catch(() => setTeam(null));
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.esport.team(id).then(setTeam).catch(() => setTeam(null)).finally(() => setLoading(false));
    api.esport.teamStats(id).then(setTeamStats).catch(() => setTeamStats(null));
    api.esport.teamSchedule(id).then((r: any) => setSchedule(Array.isArray(r) ? r : [])).catch(() => setSchedule([]));
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
  const [newReq, setNewReq] = useState({ minRankLevel: '', availability: '' });
  const [creating, setCreating] = useState(false);
  const [applyCampaign, setApplyCampaign] = useState<any | null>(null);
  const [applyForm, setApplyForm] = useState({ role: '', message: '' });
  const [applying, setApplying] = useState(false);
  const [pendingDel, setPendingDel] = useState<any | null>(null);
  // Recruiter inbox filter: the applications still waiting for an answer by default.
  const [appStatus, setAppStatus] = useState<'active' | 'all' | 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn'>('active');

  const loadCampaigns = (status = appStatus) =>
    api.recruitment.byTeam(id, { status }).then((r: any) => setCampaigns(Array.isArray(r) ? r : [])).catch(() => {});

  useEffect(() => {
    if (!id) return;
    loadCampaigns();
    if (myId) api.recruitment.mine({ status: 'active' }).then((m: any) => setMyAppliedIds(new Set((Array.isArray(m) ? m : []).map((a: any) => a.recruitmentId)))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, myId, canManage, appStatus]);

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const slots = LANES.filter((l) => (newSlots[l] || 0) > 0).map((l) => ({ role: l, quantity: newSlots[l] }));
    if (slots.length === 0) { toast.error(t('recruitment.needRole')); return; }
    setCreating(true);
    try {
      await api.recruitment.create({
        teamId: id,
        message: newMsg.trim() || undefined,
        slots,
        minRankLevel: newReq.minRankLevel ? Number(newReq.minRankLevel) : undefined,
        availability: newReq.availability || undefined,
      });
      toast.success(t('admin.esport.saved'));
      setNewOpen(false); setNewMsg(''); setNewSlots({}); setNewReq({ minRankLevel: '', availability: '' });
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

  const decideApp = async (a: any, status: 'accepted' | 'rejected' | 'shortlisted') => {
    setActingApp(a.id + status);
    try {
      await api.recruitment.decide(a.id, status);
      toast.success(
        status === 'accepted'
          ? t('teams.accepted')
          : status === 'shortlisted'
            ? t('recruitment.status.shortlisted')
            : t('teams.refused'),
      );
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

  const backLink = (
    <Link href="/teams" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink-1"><ArrowLeft size={16} /> {t('teams.back')}</Link>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6" aria-busy="true">
        {backLink}
        <Skeleton className="h-52 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (!team) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {backLink}
        <EmptyState icon={<Users size={28} />} title={t('teams.detail.notFound')} />
      </div>
    );
  }

  let foundedLabel = '';
  if (team.foundedAt) { const d = new Date(team.foundedAt); if (!isNaN(d.getTime())) foundedLabel = d.toLocaleDateString(); }

  const staffList: any[] = Array.isArray(team?.staff) ? team.staff : [];
  const honours: any[] = Array.isArray(team?.honours) ? team.honours : [];

  const TABS = [
    { id: 'overview', icon: LayoutDashboard, label: t('teams.tab.overview') },
    { id: 'roster', icon: Users, label: t('teams.tab.roster') },
    { id: 'staff', icon: UserCog, label: t('teams.tab.staff') },
    { id: 'schedule', icon: CalendarDays, label: t('teams.tab.schedule') },
    { id: 'history', icon: History, label: t('teams.tab.history') },
    { id: 'honours', icon: Trophy, label: t('teams.tab.honours') },
    {
      id: 'recruitment',
      icon: Megaphone,
      label: t('teams.tab.recruitment'),
      count: canManage && pendingCandidates > 0 ? pendingCandidates : undefined,
    },
    { id: 'matches', icon: Swords, label: t('teams.tab.matches') },
  ];

  const titles = honours.filter((h) => h.placement === 1).length;
  const crest = (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md cut-corners bg-surface-2 ring-1 ring-inset ring-line-subtle sm:h-20 sm:w-20">
      {team.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.image} alt={team.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        <span className="font-display text-xl font-bold text-ink-1">{teamTag(team)}</span>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {backLink}

      {/* Team header: banner art when the team has a crest. */}
      <PageHeader
        banner={team.image || undefined}
        variant={team.type === 'esport' ? 'gold' : 'cyan'}
        eyebrow={t('admin.esport.badge.' + (team.type || 'community'))}
        title={
          <span className="flex items-center gap-3">
            {crest}
            <span>{team.name}</span>
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 num">
            <span className="inline-flex items-center gap-1.5"><Users size={14} />{team.memberCount ?? members.length} {t('teams.members')}</span>
            {foundedLabel && <span className="inline-flex items-center gap-1.5"><Calendar size={14} />{t('teams.detail.founded')} {foundedLabel}</span>}
            {stats.played > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Swords size={14} />
                <span className="font-semibold text-accent-green">{stats.wins}</span>
                <span className="opacity-60">/</span>
                <span className="font-semibold text-accent-red">{stats.losses}</span>
                <span className="opacity-60">·</span>
                {stats.winRate}%
              </span>
            )}
            {titles > 0 && (
              <span className="inline-flex items-center gap-1.5 text-accent-gold"><Trophy size={14} />{titles}</span>
            )}
          </span>
        }
        breadcrumb={team.name}
      />

      {team.description && (
        <Card className="!p-4 sm:!p-5">
          <p className="whitespace-pre-line text-sm text-ink-2">{team.description}</p>
        </Card>
      )}

      {/* Captain: team logo (community teams: shown once an admin approves it). */}
      {amCaptain && (
        <Card className="!p-4 sm:!p-5">
          <ImageUpload
            purpose="team"
            targetId={id}
            label={t('teams.detail.logo')}
            hint={t('teams.detail.logoHint')}
            value={team.image || ''}
            onChange={() => api.esport.team(id).then(setTeam).catch(() => undefined)}
          />
        </Card>
      )}

      {/* Tabs */}
      <div className="overflow-x-auto overflow-y-hidden">
        <Tabs variant="underline" tabs={TABS} active={tab} onChange={(v: string) => setTab(v as typeof tab)} className="min-w-max whitespace-nowrap" />
      </div>

      {/* Overview tab */}
      {tab === 'overview' && <TeamOverview stats={teamStats} t={t} />}

      {/* Staff tab */}
      {tab === 'staff' && <TeamStaff staff={staffList} t={t} />}

      {/* Schedule tab */}
      {tab === 'schedule' && <TeamSchedule schedule={schedule} t={t} />}

      {/* History tab */}
      {tab === 'history' && <TeamHistory teamId={id} t={t} />}

      {/* Honours tab */}
      {tab === 'honours' && <TeamHonours honours={honours} t={t} />}

      {/* Roster tab */}
      {tab === 'roster' && (
        <div>
          {amCaptain ? (
            members.length === 0 ? <EmptyState icon={<Users size={28} />} title={t('teams.detail.noMembers')} /> : (
              <div className="space-y-2">
                {members.map((m) => {
                  const u = m.user || {}; const isCap = m.userId === captainId;
                  return (
                    <div key={m.id ?? m.userId} className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface-1 p-2.5 shadow-elev-1 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <AvatarFrame frame={u.equippedFrame} name={u.displayName || u.username} src={u.avatar ? avatarSrc(u.avatar, 64) : null} rank={u.gameRank} avatarSize={32} bleed showBadge={false} />
                        <span className="truncate text-sm font-medium text-ink-1">{u.displayName || u.username}</span>
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
                  <h3 className="eyebrow mb-2.5 flex items-center gap-1.5 !text-accent-gold"><Crown size={12} />{t('teams.detail.captain')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"><MemberCard m={captainMember} t={t} highlight /></div>
                </div>
              )}
              {starters.length > 0 && (
                <div>
                  <p className="eyebrow mb-2.5">{t('teams.detail.starters')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{starters.map((m, i) => <MemberCard key={m.id ?? m.userId ?? i} m={m} t={t} />)}</div>
                </div>
              )}
              {substitutes.length > 0 && (
                <div>
                  <p className="eyebrow mb-2.5">{t('teams.detail.substitutes')}</p>
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
            <div className="flex flex-wrap items-end justify-end gap-3">
              <div className="w-full sm:w-56">
                <Select
                  label={t('recruitment.filterStatus')}
                  value={appStatus}
                  onChange={(e: any) => setAppStatus(e.target.value)}
                  options={[
                    { value: 'active', label: t('recruitment.statusActive') },
                    { value: 'pending', label: t('recruitment.status.pending') },
                    { value: 'shortlisted', label: t('recruitment.status.shortlisted') },
                    { value: 'accepted', label: t('recruitment.status.accepted') },
                    { value: 'rejected', label: t('recruitment.status.rejected') },
                    { value: 'withdrawn', label: t('recruitment.status.withdrawn') },
                    { value: 'all', label: t('recruitment.statusAll') },
                  ]}
                />
              </div>
              <Button size="sm" onClick={() => setNewOpen(true)}><Plus size={15} /> {t('recruitment.new')}</Button>
            </div>
          )}

          {campaigns.length === 0 ? (
            <EmptyState icon={<Megaphone size={28} />} title={canManage ? t('recruitment.noCampaigns') : t('teams.notRecruitingMsg')} />
          ) : (
            campaigns.map((c) => {
              const applied = myAppliedIds.has(c.id);
              return (
                <Card key={c.id} className="!p-4" accent={c.status === 'open' ? 'green' : undefined}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Megaphone size={16} className="text-primary" />
                      {(c.slots || []).map((s: any) => (
                        <Badge key={s.role} variant="purple" size="sm" className="gap-1">
                          <RoleIcon role={s.role} size={13} /> {t('lane.' + s.role)}{s.quantity > 1 && <span className="ml-0.5 opacity-80">×{s.quantity}</span>}
                        </Badge>
                      ))}
                      <Badge variant={c.status === 'open' ? 'green' : 'default'} size="sm">{c.status === 'open' ? t('recruitment.statusOpen') : t('recruitment.statusClosed')}</Badge>
                      {c.minRankLabel && (
                        <Badge variant="gold" size="sm" className="gap-1">
                          {hasRankBadge(c.minRankLabel) && <RankBadge rank={c.minRankLabel} size={13} />}
                          {t('recruitment.minRank')} : {c.minRankLabel}
                        </Badge>
                      )}
                      {c.availability && (
                        <Badge variant="blue" size="sm" className="gap-1"><CalendarClock size={12} /> {t('recruitment.availability.' + c.availability)}</Badge>
                      )}
                    </div>
                    {canManage ? (
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => toggleCampaign(c)}>{c.status === 'open' ? t('recruitment.close') : t('recruitment.reopen')}</Button>
                        <Button size="sm" variant="danger" title={t('recruitment.close')} onClick={() => setPendingDel(c)}><Trash2 size={14} /></Button>
                      </div>
                    ) : c.status === 'open' && !isMember && myId ? (
                      applied ? <span className="text-xs text-ink-2">{t('recruitment.applied')}</span> : <Button size="sm" onClick={() => openApply(c)}><Send size={14} /> {t('recruitment.apply')}</Button>
                    ) : null}
                  </div>
                  {c.message && <p className="mb-3 whitespace-pre-line text-sm text-ink-2">{c.message}</p>}

                  {canManage && (
                    <div className="border-t border-line-subtle pt-3">
                      <p className="eyebrow mb-2">{t('recruitment.candidates')}{c.applicationCount ? ` (${c.applicationCount})` : ''}</p>
                      {(c.applications || []).length === 0 ? (
                        <p className="text-sm text-ink-3">{t('recruitment.noCandidates')}</p>
                      ) : (
                        <div className="space-y-2">
                          {c.applications.map((a: any) => (
                            <ApplicationRow key={a.id} a={a} t={t} acting={actingApp} onDecide={decideApp} onContact={(u: any) => { setContactUser(u); setContactBody(''); }} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
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
            <div className="space-y-4">{matches.map((m, i) => <MatchRow key={m.id ?? i} m={m} t={t} onResult={amCaptain && m.type !== 'official' ? () => openResult(m) : undefined} />)}</div>
          )}
        </div>
      )}

      {/* New recruitment modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} closeLabel={t('common.close')} title={t('recruitment.newTitle')} icon={<Megaphone size={20} />} headerVariant="gradient">
        <form onSubmit={createCampaign} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-1">{t('recruitment.pickRoles')}</label>
            <p className="mb-2 text-xs text-ink-3">{t('recruitment.pickRolesHint')}</p>
            <div className="space-y-2">
              {LANES.map((l) => (
                <div key={l} className="flex items-center gap-2">
                  <RoleIcon role={l} size={16} />
                  <span className="flex-1 text-sm text-ink-2">{t('lane.' + l)}</span>
                  <input type="number" min={0} max={20} value={newSlots[l] || 0} onChange={(e) => setNewSlots({ ...newSlots, [l]: Math.max(0, parseInt(e.target.value, 10) || 0) })} className={numCls} />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label={t('recruitment.minRank')}
              value={newReq.minRankLevel}
              onChange={(e: any) => setNewReq({ ...newReq, minRankLevel: e.target.value })}
              options={[
                { value: '', label: t('recruitment.minRankAny') },
                ...RANK_TIERS.map((r) => ({ value: String(r.level), label: r.label })),
              ]}
            />
            <Select
              label={t('recruitment.filterAvailability')}
              value={newReq.availability}
              onChange={(e: any) => setNewReq({ ...newReq, availability: e.target.value })}
              options={[
                { value: '', label: t('recruitment.availabilityNone') },
                ...AVAILABILITY.map((a) => ({ value: a, label: t('recruitment.availability.' + a) })),
              ]}
            />
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
            <label className="block text-sm font-medium text-ink-1">{t('recruitment.applyRole')}</label>
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
            <p className="text-center text-sm font-semibold text-ink-1">{resultMatch.teamA?.name} <span className="text-ink-3">vs</span> {resultMatch.teamB?.name}</p>
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
