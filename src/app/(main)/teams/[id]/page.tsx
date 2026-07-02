'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Shield, Crown, Users, Calendar, MapPin, UserPlus, Check, X } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { api, avatarSrc } from '@/lib/api';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import RoleIcon from '@/components/game/RoleIcon';
import RoleSelect from '@/components/game/RoleSelect';
import { useAuthStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

const LANES = ['roam', 'jungle', 'mid', 'exp', 'gold'];

function MemberCard({ m, t, highlight = false }: any) {
  const u = m?.user || {};
  const name = u.displayName || u.username || '';

  return (
    <Link
      href={`/players/${m.userId}`}
      className={`flex items-center gap-3 rounded-xl border bg-gaming-surface/40 p-3 transition-colors ${
        highlight
          ? 'border-yellow-500/40 hover:border-yellow-400'
          : 'border-gaming-border hover:border-neon-blue'
      }`}
    >
      {u.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc(u.avatar, 96)}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-12 h-12 rounded-xl object-cover border border-gaming-border"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-lg font-bold text-white">
          {name?.[0]?.toUpperCase() || 'J'}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {m.isCaptain && <Crown size={14} className="text-yellow-400 shrink-0" />}
          <p className="text-sm font-semibold text-white truncate">{name}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {m.role && (
            <Badge variant="purple" size="sm" className="gap-1">
              <RoleIcon role={m.role} size={14} />
              {t('lane.' + m.role)}
            </Badge>
          )}
          {hasRankBadge(u.gameRank) && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-300">
              <RankBadge rank={u.gameRank} size={16} />
              {u.gameRank}
            </span>
          )}
        </div>

        {u.country && (
          <span className="inline-flex items-center gap-0.5 text-xs text-gray-500 mt-1">
            <MapPin size={11} /> {u.country}
          </span>
        )}
      </div>
    </Link>
  );
}

function StatBox({ label, value, color = 'text-white' }: any) {
  return (
    <div className="rounded-xl border border-gaming-border bg-gaming-surface/40 p-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function MatchRow({ m, t, onResult }: any) {
  const completed = m.status === 'completed';
  const aWin = m.winnerTeamId && m.winnerTeamId === m.teamA?.id;
  const bWin = m.winnerTeamId && m.winnerTeamId === m.teamB?.id;
  let dateLabel = '';
  if (m.scheduledAt) {
    const d = new Date(m.scheduledAt);
    if (!isNaN(d.getTime())) dateLabel = d.toLocaleDateString();
  }
  return (
    <div className="rounded-lg border border-gaming-border bg-gaming-surface/40 p-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
        <span className={`text-right truncate ${aWin ? 'text-neon-gold font-bold' : 'text-white'}`}>
          {m.teamA?.name}
        </span>
        <span className="px-2 text-gray-400 font-semibold shrink-0">
          {completed ? `${m.scoreA} - ${m.scoreB}` : 'vs'}
        </span>
        <span className={`text-left truncate ${bWin ? 'text-neon-gold font-bold' : 'text-white'}`}>
          {m.teamB?.name}
        </span>
      </div>
      <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
        <Badge variant="purple" size="sm">{t('matchType.' + m.type)}</Badge>
        <Badge variant={completed ? 'green' : 'default'} size="sm">{t('matchStatus.' + m.status)}</Badge>
        {dateLabel && <span className="text-xs text-gray-500">{dateLabel}</span>}
        {onResult && (
          <button
            type="button"
            onClick={onResult}
            className="text-xs text-neon-blue hover:underline"
          >
            {t('admin.matches.setResult')}
          </button>
        )}
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

  const [joinReqs, setJoinReqs] = useState<any[]>([]);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinForm, setJoinForm] = useState<{ message: string; role: string }>({ message: '', role: '' });
  const [joining, setJoining] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [myPending, setMyPending] = useState(false);

  const refresh = () =>
    api.esport
      .team(id)
      .then(setTeam)
      .catch(() => setTeam(null));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.esport
      .team(id)
      .then(setTeam)
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [id]);

  const members: any[] = Array.isArray(team?.members) ? team.members : [];
  const isMember = !!myId && members.some((m) => m.userId === myId);
  const captainId = team?.captain?.userId ?? team?.captain?.id;
  const amCaptain = !!myId && captainId === myId;
  const canManage = amCaptain || isAdmin;

  useEffect(() => {
    if (!id || !canManage) return;
    api.esport.joinRequests(id).then((r: any) => setJoinReqs(Array.isArray(r) ? r : [])).catch(() => {});
  }, [id, canManage]);

  useEffect(() => {
    if (!myId || !id) return;
    api.esport
      .myJoinRequests()
      .then((r: any) =>
        setMyPending(Array.isArray(r) && r.some((x: any) => x.teamId === id && x.status === 'pending')),
      )
      .catch(() => {});
  }, [myId, id]);

  const submitJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    try {
      await api.esport.requestJoin(id, {
        message: joinForm.message.trim() || undefined,
        role: joinForm.role || undefined,
      });
      toast.success(t('teams.joinSent'));
      setJoinOpen(false);
      setJoinForm({ message: '', role: '' });
      setMyPending(true);
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setJoining(false);
    }
  };

  const decide = async (r: any, status: 'accepted' | 'rejected') => {
    setActingId(r.id + status);
    try {
      await api.esport.decideJoin(r.id, status);
      toast.success(status === 'accepted' ? t('teams.accepted') : t('teams.refused'));
      setJoinReqs((prev) => prev.filter((x) => x.id !== r.id));
      if (status === 'accepted') await refresh();
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setActingId(null);
    }
  };

  // --- Gestion capitaine ---
  const [manageOpen, setManageOpen] = useState(false);
  const [busyMember, setBusyMember] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [otherTeams, setOtherTeams] = useState<any[]>([]);
  const [planForm, setPlanForm] = useState({ opponentId: '', type: 'friendly', scheduledAt: '' });
  const [planning, setPlanning] = useState(false);
  const [resultMatch, setResultMatch] = useState<any | null>(null);
  const [resultForm, setResultForm] = useState({ scoreA: 0, scoreB: 0, winnerTeamId: '' });
  const [savingResult, setSavingResult] = useState(false);

  useEffect(() => {
    if (!amCaptain) return;
    api.esport
      .teams()
      .then((all: any) => setOtherTeams(Array.isArray(all) ? all.filter((x: any) => x.id !== id) : []))
      .catch(() => {});
  }, [amCaptain, id]);

  const runMember = async (fn: () => Promise<any>) => {
    setBusyMember(true);
    try {
      await fn();
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setBusyMember(false);
    }
  };

  const submitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.opponentId) return;
    setPlanning(true);
    try {
      await api.esport.createMatch({
        teamAId: id,
        teamBId: planForm.opponentId,
        type: planForm.type,
        scheduledAt: planForm.scheduledAt || undefined,
      });
      toast.success(t('admin.esport.saved'));
      setPlanOpen(false);
      setPlanForm({ opponentId: '', type: 'friendly', scheduledAt: '' });
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setPlanning(false);
    }
  };

  const openResult = (m: any) => {
    setResultMatch(m);
    setResultForm({ scoreA: m.scoreA ?? 0, scoreB: m.scoreB ?? 0, winnerTeamId: m.winnerTeamId || '' });
  };

  const submitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultMatch) return;
    setSavingResult(true);
    try {
      await api.esport.setMatchResult(resultMatch.id, {
        scoreA: Number(resultForm.scoreA),
        scoreB: Number(resultForm.scoreB),
        winnerTeamId: resultForm.winnerTeamId || undefined,
      });
      toast.success(t('admin.esport.saved'));
      setResultMatch(null);
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setSavingResult(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <Link
          href="/teams"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft size={16} /> {t('teams.back')}
        </Link>
        <p className="text-center text-gray-500 py-20">{t('teams.detail.notFound')}</p>
      </div>
    );
  }

  const matches: any[] = Array.isArray(team.matches) ? team.matches : [];
  const stats = team.stats || {};
  const captainUserId = captainId;

  // Le capitaine est listé une seule fois, en tête ; on l'exclut des sections.
  const others = members.filter(
    (m) => m.userId !== captainUserId && !m.isCaptain,
  );
  const starters = others.filter((m) => !m.isSubstitute);
  const substitutes = others.filter((m) => m.isSubstitute);

  // Carte du capitaine (depuis members si présent, sinon depuis team.captain).
  const captainMember =
    members.find((m) => m.isCaptain || m.userId === captainUserId) ||
    (team.captain
      ? { userId: captainUserId, isCaptain: true, role: null, user: team.captain }
      : null);

  let foundedLabel = '';
  if (team.foundedAt) {
    const d = new Date(team.foundedAt);
    if (!isNaN(d.getTime())) foundedLabel = d.toLocaleDateString();
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-5"
      >
        <ArrowLeft size={16} /> {t('teams.back')}
      </Link>

      {/* En-tête profil : avatar rond + infos */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-8">
        <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full overflow-hidden border-2 border-gaming-border bg-gaming-surface">
          {team.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.image}
              alt={team.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-blue to-neon-purple text-3xl font-bold text-white">
              {team.name?.[0]?.toUpperCase() || 'T'}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{team.name}</h1>
            <Badge variant={team.type === 'esport' ? 'gold' : 'default'} size="sm">
              {t('admin.esport.badge.' + (team.type || 'community'))}
            </Badge>
            {team.isRecruiting && (
              <Badge variant="green" size="sm">
                {t('teams.detail.recruiting')}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} className="text-neon-blue" />
              {team.memberCount ?? members.length} {t('teams.members')}
            </span>
            {foundedLabel && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} className="text-neon-blue" />
                {t('teams.detail.founded')} {foundedLabel}
              </span>
            )}
          </div>

          {team.description && (
            <p className="text-sm text-gray-400 mt-2 whitespace-pre-line">{team.description}</p>
          )}
        </div>

        {myId && !isMember && (
          <div className="sm:ml-auto shrink-0">
            {myPending ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 border border-gaming-border rounded-lg px-3 py-2">
                {t('teams.joinPending')}
              </span>
            ) : (
              <Button size="sm" onClick={() => setJoinOpen(true)}>
                <UserPlus size={15} /> {t('teams.join')}
              </Button>
            )}
          </div>
        )}

        {amCaptain && (
          <div className="sm:ml-auto shrink-0 flex flex-col sm:items-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setManageOpen(true)}>
              <Users size={15} /> {t('teams.manageRoster')}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPlanOpen(true)}>
              <Calendar size={15} /> {t('teams.planMatch')}
            </Button>
          </div>
        )}
      </div>

      {/* Demandes de recrutement (capitaine / admin) */}
      {canManage && joinReqs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-3">
            {t('teams.joinRequests')}{' '}
            <span className="text-sm font-normal text-gray-500">({joinReqs.length})</span>
          </h2>
          <div className="space-y-2">
            {joinReqs.map((r) => {
              const u = r.user || {};
              const name = u.displayName || u.username || '—';
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border border-gaming-border bg-gaming-surface/40 p-3"
                >
                  {u.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc(u.avatar, 64)}
                      alt={name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {name[0]?.toUpperCase() || 'J'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{name}</span>
                      {r.role && (
                        <Badge variant="purple" size="sm" className="gap-1">
                          <RoleIcon role={r.role} size={13} /> {t('lane.' + r.role)}
                        </Badge>
                      )}
                    </div>
                    {r.message && <p className="text-xs text-gray-400 truncate">{r.message}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" disabled={actingId === r.id + 'accepted'} onClick={() => decide(r, 'accepted')}>
                      <Check size={14} /> {t('teams.accept')}
                    </Button>
                    <Button size="sm" variant="danger" disabled={actingId === r.id + 'rejected'} onClick={() => decide(r, 'rejected')}>
                      <X size={14} /> {t('teams.refuse')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Bilan */}
      {stats.played > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-8">
          <StatBox label={t('teams.detail.played')} value={stats.played} />
          <StatBox label={t('teams.detail.wins')} value={stats.wins} color="text-green-400" />
          <StatBox label={t('teams.detail.losses')} value={stats.losses} color="text-red-400" />
          <StatBox label={t('teams.detail.winRate')} value={`${stats.winRate ?? 0}%`} color="text-neon-blue" />
        </div>
      )}

      {/* Effectif */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">{t('teams.detail.roster')}</h2>

        {!captainMember && members.length === 0 ? (
          <p className="text-sm text-gray-500">{t('teams.detail.noMembers')}</p>
        ) : (
          <div className="space-y-5">
            {captainMember && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Crown size={15} className="text-yellow-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
                    {t('teams.detail.captain')}
                  </span>
                </div>
                <MemberCard m={captainMember} t={t} highlight />
              </div>
            )}

            {starters.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2.5">
                  {t('teams.detail.starters')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {starters.map((m, i) => (
                    <MemberCard key={m.id ?? m.userId ?? i} m={m} t={t} />
                  ))}
                </div>
              </div>
            )}

            {substitutes.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2.5">
                  {t('teams.detail.substitutes')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {substitutes.map((m, i) => (
                    <MemberCard key={m.id ?? m.userId ?? i} m={m} t={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Matchs récents */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">{t('teams.detail.matches')}</h2>
        {matches.length === 0 ? (
          <p className="text-sm text-gray-500">{t('teams.detail.noMatches')}</p>
        ) : (
          <div className="space-y-2">
            {matches.map((m, i) => (
              <MatchRow
                key={m.id ?? i}
                m={m}
                t={t}
                onResult={
                  amCaptain && m.type !== 'official' ? () => openResult(m) : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      <Modal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        closeLabel={t('common.close')}
        title={t('teams.joinTitle')}
      >
        <p className="text-sm text-gray-400 mb-4">{t('teams.joinHint')}</p>
        <form onSubmit={submitJoin} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('teams.joinRole')}</label>
            <RoleSelect
              value={joinForm.role}
              onChange={(v) => setJoinForm({ ...joinForm, role: v })}
              options={LANES}
              noneLabel={t('admin.esport.noRole')}
              labelFor={(l) => t('lane.' + l)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('teams.joinMessage')}</label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-blue min-h-[80px] resize-y"
              value={joinForm.message}
              onChange={(e) => setJoinForm({ ...joinForm, message: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" disabled={joining}>
              <UserPlus size={15} /> {t('teams.joinSubmit')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setJoinOpen(false)}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Capitaine : gérer l'effectif */}
      <Modal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        maxWidth="max-w-2xl"
        closeLabel={t('common.close')}
        title={t('teams.rosterTitle')}
      >
        {members.length === 0 ? (
          <p className="text-sm text-gray-500">{t('teams.detail.noMembers')}</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const u = m.user || {};
              const isCap = m.userId === captainId;
              return (
                <div
                  key={m.id ?? m.userId}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-gaming-border bg-gaming-surface/40 p-2.5"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <span className="text-sm text-white truncate">{u.displayName || u.username}</span>
                    {isCap && (
                      <Badge variant="gold" size="sm">
                        <Crown size={11} className="mr-1" /> {t('teams.detail.captain')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <RoleSelect
                      value={m.role || ''}
                      onChange={(v) => runMember(() => api.esport.updateMember(id, m.userId, { role: v || null }))}
                      options={LANES}
                      noneLabel={t('admin.esport.noRole')}
                      labelFor={(l) => t('lane.' + l)}
                      disabled={busyMember}
                    />
                    <button
                      onClick={() => runMember(() => api.esport.updateMember(id, m.userId, { isSubstitute: !m.isSubstitute }))}
                      disabled={busyMember}
                      className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                        m.isSubstitute
                          ? 'bg-gaming-surface border-gaming-border text-gray-400'
                          : 'bg-neon-blue/15 border-neon-blue text-neon-blue'
                      }`}
                    >
                      {m.isSubstitute ? t('admin.esport.substitute') : t('admin.esport.starter')}
                    </button>
                    {!isCap && (
                      <button
                        onClick={() => runMember(() => api.esport.removeMember(id, m.userId))}
                        disabled={busyMember}
                        title={t('admin.esport.remove')}
                        className="inline-flex items-center px-2 py-1 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Capitaine : planifier un match amical/entraînement */}
      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        closeLabel={t('common.close')}
        title={t('teams.planMatch')}
      >
        <form onSubmit={submitPlan} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('teams.opponent')}</label>
            <select
              value={planForm.opponentId}
              onChange={(e) => setPlanForm({ ...planForm, opponentId: e.target.value })}
              required
              className="w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 focus:outline-none focus:border-neon-blue"
            >
              <option value="">{t('teams.selectOpponent')}</option>
              {otherTeams.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('admin.matches.type')}</label>
            <select
              value={planForm.type}
              onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 focus:outline-none focus:border-neon-blue"
            >
              <option value="friendly">{t('matchType.friendly')}</option>
              <option value="training">{t('matchType.training')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('admin.matches.date')}</label>
            <input
              type="datetime-local"
              value={planForm.scheduledAt}
              onChange={(e) => setPlanForm({ ...planForm, scheduledAt: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 focus:outline-none focus:border-neon-blue"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" disabled={planning || !planForm.opponentId}>
              <Calendar size={15} /> {t('admin.matches.schedule')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setPlanOpen(false)}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Capitaine : saisir le résultat d'un match */}
      <Modal
        open={!!resultMatch}
        onClose={() => setResultMatch(null)}
        closeLabel={t('common.close')}
        title={t('admin.matches.result')}
      >
        {resultMatch && (
          <form onSubmit={submitResult} className="space-y-3">
            <p className="text-sm text-white text-center">
              {resultMatch.teamA?.name} <span className="text-gray-500">vs</span> {resultMatch.teamB?.name}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t('admin.matches.scoreA')}</label>
                <input
                  type="number"
                  min={0}
                  value={resultForm.scoreA}
                  onChange={(e) => setResultForm({ ...resultForm, scoreA: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 focus:outline-none focus:border-neon-blue"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t('admin.matches.scoreB')}</label>
                <input
                  type="number"
                  min={0}
                  value={resultForm.scoreB}
                  onChange={(e) => setResultForm({ ...resultForm, scoreB: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 focus:outline-none focus:border-neon-blue"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('admin.matches.winner')}</label>
              <select
                value={resultForm.winnerTeamId}
                onChange={(e) => setResultForm({ ...resultForm, winnerTeamId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 focus:outline-none focus:border-neon-blue"
              >
                <option value="">{t('admin.matches.autoWinner')}</option>
                <option value={resultMatch.teamA?.id}>{resultMatch.teamA?.name}</option>
                <option value={resultMatch.teamB?.id}>{resultMatch.teamB?.name}</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" type="submit" disabled={savingResult}>
                <Check size={15} /> {t('admin.esport.save')}
              </Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => setResultMatch(null)}>
                {t('admin.esport.cancel')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
