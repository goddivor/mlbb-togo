'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Gamepad2, Users, UserCheck, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, Button, PageHeader, Badge, EmptyState, Skeleton, Avatar } from '@/components/ui';
import RoleIcon from '@/components/game/RoleIcon';
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
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Card>
          <Skeleton lines={3} />
        </Card>
        <Card>
          <Skeleton lines={5} />
        </Card>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="space-y-6">
        <Button size="sm" variant="ghost" onClick={() => router.push('/dashboard/draft')}>
          <ArrowLeft size={16} /> {t('draft.title')}
        </Button>
        <EmptyState icon={<Gamepad2 size={28} />} title={t('draft.empty')} className="min-h-[40vh]" />
      </div>
    );
  }

  const status = tournament.status as string;
  const showRegistration =
    status === 'registration' || (status === 'drafted' && tournament.secondPhaseOpen);
  const showTeamAndBracket = BRACKET_STATUSES.includes(status);

  const sectionTitle = (icon: React.ReactNode, label: React.ReactNode) => (
    <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold tracking-tight2 text-ink-1">
      <span className="text-accent-violet">{icon}</span> {label}
    </h3>
  );

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push('/dashboard/draft')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-primary"
      >
        <ArrowLeft size={15} /> {t('draft.title')}
      </button>

      <PageHeader
        icon={<Gamepad2 size={20} />}
        eyebrow={t('draft.eyebrow')}
        title={tournament.name}
        breadcrumb={t('draft.title')}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant[status] || 'default'} size="sm" pulse={status === 'ongoing'}>
              {t('draft.status.' + status)}
            </Badge>
            {tournament.category && (
              <Badge variant="outline" size="sm">
                {tournament.category}
              </Badge>
            )}
            {tournament.description && <span className="text-ink-2">{tournament.description}</span>}
          </span>
        }
        variant="purple"
      />

      {/* Registration */}
      {showRegistration && (
        <Card accent={tournament.registered ? 'green' : 'violet'}>
          {sectionTitle(<UserCheck size={18} />, t('draft.register'))}

          {tournament.registered ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-2">
                {t('draft.chooseRole')} :{' '}
                <Badge variant="green" size="sm" className="ml-1">
                  {tournament.myPreferredRole ? roleLabel(tournament.myPreferredRole) : '—'}
                </Badge>
              </p>
              {status === 'registration' && (
                <Button size="sm" variant="danger" onClick={unregister} disabled={saving}>
                  {t('draft.unregister')}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-2">{t('draft.roleNote')}</p>
              <Button size="sm" onClick={openRegister}>
                {t('draft.register')}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* My team */}
      {showTeamAndBracket && (
        <Card>
          {sectionTitle(<Users size={18} />, t('draft.myTeam'))}

          {myTeam?.team ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                {myTeam.team.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={myTeam.team.icon}
                    alt={myTeam.team.name}
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 rounded cut-corners-sm bg-surface-2 object-cover ring-1 ring-inset ring-line-subtle"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded cut-corners-sm bg-surface-2 font-display text-lg font-bold text-ink-2 ring-1 ring-inset ring-line-subtle">
                    {myTeam.team.name?.[0]?.toUpperCase() || 'T'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold tracking-tight2 text-ink-1">{myTeam.team.name}</p>
                  {myTeam.assignedRole && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
                      <RoleIcon role={myTeam.assignedRole} size={13} />
                      {t('draft.assignedRole')} : <span className="font-semibold text-ink-1">{roleLabel(myTeam.assignedRole)}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="eyebrow mb-2 !text-ink-3">{t('draft.teammates')}</p>
                <ul className="divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface-2/40">
                  {(myTeam.members || []).map((m: any) => (
                    <li key={m.userId} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                      <span className="inline-flex items-center gap-2.5 font-medium text-ink-1">
                        <Avatar name={m.name} size="xs" />
                        {m.name}
                      </span>
                      {m.assignedRole && (
                        <Badge variant="default" size="sm">
                          <RoleIcon role={m.assignedRole} size={12} />
                          {roleLabel(m.assignedRole)}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-2">{t('draft.notInTeam')}</p>
          )}
        </Card>
      )}

      {/* Bracket */}
      {showTeamAndBracket && (
        <Card>
          {sectionTitle(<Trophy size={18} />, t('draft.bracket'))}
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
            <label className="mb-2 block text-sm font-medium text-ink-1">
              {t('draft.chooseRole')}
            </label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setChosenRole(r)}
                  className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors duration-fast ${
                    chosenRole === r
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-line-subtle bg-surface-2 text-ink-2 hover:border-line-strong hover:text-ink-1'
                  }`}
                >
                  <RoleIcon role={r} size={13} />
                  {roleLabel(r)}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-ink-3">{t('draft.roleNote')}</p>

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
