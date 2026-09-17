'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Gamepad2, Users, UserCheck, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, Button, PageHeader, Badge, EmptyState, LoadingSpinner, SectionCard } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import DraftBracket from '@/components/draft/DraftBracket';
import toast from 'react-hot-toast';

const statusVariant: Record<string, string> = {
  draft: 'default',
  registration: 'green',
  closed: 'default',
  drafted: 'blue',
  ongoing: 'purple',
  completed: 'gold',
};

const BRACKET_STATUSES = ['drafted', 'ongoing', 'completed'];

export default function DraftDetailPage() {
  const t = useT();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [bracket, setBracket] = useState<{ teams: any[]; matches: any[] }>({ teams: [], matches: [] });

  const [registerOpen, setRegisterOpen] = useState(false);
  const [chosenRole, setChosenRole] = useState('');
  const [saving, setSaving] = useState(false);

  // Show the game-role label; fall back to the raw key when no translation exists.
  const roleLabel = (r: string) => {
    const label = t('draft.role.' + r);
    return label === 'draft.role.' + r ? r : label;
  };

  const loadTournament = async () => {
    const data = await api.draft.get(id);
    setTournament(data || null);
    return data;
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await loadTournament();
        if (data && BRACKET_STATUSES.includes(data.status)) {
          const [team, br] = await Promise.all([api.draft.myTeam(id), api.draft.bracket(id)]);
          setMyTeam(team || null);
          setBracket(br || { teams: [], matches: [] });
        }
      } catch {
        setTournament(null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openRegister = () => {
    setChosenRole(tournament?.roles?.[0] || '');
    setRegisterOpen(true);
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenRole) return;
    setSaving(true);
    try {
      await api.draft.register(id, chosenRole);
      toast.success(t('draft.registered'));
      setRegisterOpen(false);
      await loadTournament();
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const unregister = async () => {
    setSaving(true);
    try {
      await api.draft.unregister(id);
      toast.success(t('draft.unregister'));
      await loadTournament();
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const roles: string[] = useMemo(() => tournament?.roles || [], [tournament]);

  if (loading) {
    return <LoadingSpinner size="lg" className="py-24" />;
  }

  if (!tournament) {
    return (
      <div className="space-y-6">
        <Button size="sm" variant="ghost" onClick={() => router.push('/draft')}>
          <ArrowLeft size={16} /> {t('draft.title')}
        </Button>
        <EmptyState icon={<Gamepad2 size={28} />} title={t('draft.empty')} />
      </div>
    );
  }

  const status = tournament.status as string;
  const showRegistration =
    status === 'registration' || (status === 'drafted' && tournament.secondPhaseOpen);
  const showTeamAndBracket = BRACKET_STATUSES.includes(status);

  return (
    <div className="space-y-6">
      <Button size="sm" variant="ghost" onClick={() => router.push('/draft')}>
        <ArrowLeft size={16} /> {t('draft.title')}
      </Button>

      <PageHeader
        icon={<Gamepad2 size={28} />}
        title={tournament.name}
        subtitle={tournament.description}
        variant="purple"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {tournament.category && (
              <Badge variant="blue" size="md">
                {tournament.category}
              </Badge>
            )}
            <Badge variant={statusVariant[status] || 'default'} size="md">
              {t('draft.status.' + status)}
            </Badge>
          </div>
        }
      />

      {/* Registration */}
      {showRegistration && (
        <SectionCard>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
            <UserCheck size={18} /> {t('draft.register')}
          </h3>

          {tournament.registered ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-body dark:text-bodydark">
                {t('draft.chooseRole')} :{' '}
                <span className="font-semibold text-black dark:text-white">
                  {tournament.myPreferredRole ? roleLabel(tournament.myPreferredRole) : '—'}
                </span>
              </p>
              {status === 'registration' && (
                <Button size="sm" variant="danger" onClick={unregister} disabled={saving}>
                  {t('draft.unregister')}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-body dark:text-bodydark">{t('draft.roleNote')}</p>
              <Button size="sm" onClick={openRegister}>
                {t('draft.register')}
              </Button>
            </div>
          )}
        </SectionCard>
      )}

      {/* My team */}
      {showTeamAndBracket && (
        <SectionCard>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
            <Users size={18} /> {t('draft.myTeam')}
          </h3>

          {myTeam?.team ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {myTeam.team.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={myTeam.team.icon}
                    alt={myTeam.team.name}
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-lg border border-stroke object-cover dark:border-strokedark"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-2 font-bold text-body dark:bg-meta-4 dark:text-bodydark">
                    {myTeam.team.name?.[0]?.toUpperCase() || 'T'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-black dark:text-white">{myTeam.team.name}</p>
                  {myTeam.assignedRole && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t('draft.assignedRole')} : {roleLabel(myTeam.assignedRole)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-bodydark2">
                  {t('draft.teammates')}
                </p>
                <ul className="divide-y divide-stroke rounded-lg border border-stroke dark:divide-strokedark dark:border-strokedark">
                  {(myTeam.members || []).map((m: any) => (
                    <li
                      key={m.userId}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="text-black dark:text-white">{m.name}</span>
                      {m.assignedRole && (
                        <Badge variant="default" size="sm">
                          {roleLabel(m.assignedRole)}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-body dark:text-bodydark">{t('draft.notInTeam')}</p>
          )}
        </SectionCard>
      )}

      {/* Bracket */}
      {showTeamAndBracket && (
        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
            <Trophy size={18} /> {t('draft.bracket')}
          </h3>
          <DraftBracket teams={bracket.teams} matches={bracket.matches} />
        </Card>
      )}

      {/* Register modal */}
      <Modal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        closeLabel={t('common.close')}
        icon={<UserCheck size={18} />}
        title={t('draft.register')}
        subtitle={tournament.name}
      >
        <form onSubmit={submitRegister} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              {t('draft.chooseRole')}
            </label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setChosenRole(r)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    chosenRole === r
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-stroke bg-gray-2 text-body hover:text-black dark:border-strokedark dark:bg-meta-4 dark:text-bodydark dark:hover:text-white'
                  }`}
                >
                  {roleLabel(r)}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400">{t('draft.roleNote')}</p>

          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" loading={saving} disabled={saving || !chosenRole}>
              {t('draft.registerCta')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setRegisterOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
