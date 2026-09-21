'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Medal, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Avatar, Badge, Button, Card, EmptyState, LoadingSpinner, SectionTitle, Select } from '@/components/ui';
import { Segmented, fmtDate } from '@/components/gamification/rewards/shared';
import UserPicker, { type PickedUser } from './UserPicker';

type Kind = 'winner' | 'finalist' | 'mvp';
const KINDS: Kind[] = ['winner', 'finalist', 'mvp'];
const KIND_VARIANT: Record<Kind, string> = { winner: 'gold', finalist: 'blue', mvp: 'purple' };

interface TournamentOption {
  id: string;
  name: string;
  draft: boolean;
}

interface ResultRow {
  tournamentId: string;
  kind: Kind;
  userId: string;
  user: PickedUser | null;
  xp: number;
  recordedAt: string;
}

/** Records tournament winners / finalists / MVP by hand (XP + tournament frames). */
export default function TournamentsTab() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [tournamentId, setTournamentId] = useState('');
  const [kind, setKind] = useState<Kind>('winner');
  const [users, setUsers] = useState<PickedUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);

  useEffect(() => {
    // Player draft list: `/draft/admin` needs `admin.draft`, not granted by `admin.rewards`.
    Promise.all([api.tournaments.list(), api.draft.list()]).then(([classic, drafts]: any[]) => {
      setTournaments([
        ...(Array.isArray(classic) ? classic : []).map((x: any) => ({ id: x.id, name: x.name, draft: false })),
        ...(Array.isArray(drafts) ? drafts : []).map((x: any) => ({ id: x.id, name: x.name, draft: true })),
      ]);
    });
  }, []);

  const loadResults = useCallback((id?: string) => {
    setLoadingResults(true);
    return api.rewards.admin
      .tournamentResults(id || undefined)
      .then((l: any) => setResults(Array.isArray(l) ? l : []))
      .catch(() => setResults([]))
      .finally(() => setLoadingResults(false));
  }, []);

  useEffect(() => {
    loadResults(tournamentId);
  }, [tournamentId, loadResults]);

  const names = useMemo(() => new Map(tournaments.map((x) => [x.id, x.name])), [tournaments]);

  const submit = async () => {
    if (!tournamentId || !users.length) return;
    setSaving(true);
    try {
      const res: any = await api.rewards.admin.recordTournamentResult({ tournamentId, kind, userIds: users.map((u) => u.id) });
      const list: any[] = Array.isArray(res?.results) ? res.results : [];
      const already = list.filter((r) => r.alreadyRecorded).length;
      toast.success(t('rewards.admin.tournament.done', { n: list.length - already, already }));
      setUsers([]);
      await loadResults(tournamentId);
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const classic = tournaments.filter((x) => !x.draft);
  const drafts = tournaments.filter((x) => x.draft);

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <Card className="xl:col-span-2">
        <SectionTitle
          eyebrow={t('rewards.admin.tab.tournaments')}
          title={t('rewards.admin.tournament.title')}
          description={t('rewards.admin.tournament.desc')}
          size="sm"
          className="mb-5"
        />
        <div className="space-y-4">
          <Select label={t('rewards.admin.tournament.pick')} value={tournamentId} onChange={(e: any) => setTournamentId(e.target.value)}>
            <option value="">{t('rewards.admin.tournament.all')}</option>
            {classic.length > 0 && (
              <optgroup label={t('rewards.admin.tournament.classic')}>
                {classic.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </optgroup>
            )}
            {drafts.length > 0 && (
              <optgroup label={t('rewards.admin.tournament.draft')}>
                {drafts.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
          <div>
            <p className="mb-2 text-sm font-medium text-ink-1">{t('rewards.admin.tournament.kind')}</p>
            <Segmented<Kind>
              label={t('rewards.admin.tournament.kind')}
              value={kind}
              onChange={setKind}
              options={KINDS.map((k) => ({ id: k, label: t(`rewards.admin.kind.${k}`) }))}
            />
          </div>
          <UserPicker
            id="tournament-users"
            label={t('rewards.admin.tournament.members')}
            value={users}
            onChange={setUsers}
            multiple
            max={10}
          />
          <Button className="w-full" onClick={submit} loading={saving} disabled={!tournamentId || !users.length}>
            <Trophy size={15} />
            {t('rewards.admin.tournament.submit')}
          </Button>
          {!tournamentId && <p className="text-[11px] text-ink-3">{t('rewards.admin.tournament.pickFirst')}</p>}
        </div>
      </Card>

      <Card className="xl:col-span-3">
        <SectionTitle title={t('rewards.admin.tournament.recorded', { n: results.length })} size="sm" className="mb-4" />
        {loadingResults ? (
          <LoadingSpinner size="md" className="py-10" />
        ) : results.length === 0 ? (
          <EmptyState icon={<Medal size={24} />} title={t('rewards.admin.tournament.none')} className="!min-h-0 py-10" />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {results.map((r, i) => {
              const name = r.user?.displayName || r.user?.username || r.userId;
              return (
                <li key={`${r.tournamentId}-${r.kind}-${r.userId}-${i}`} className="flex flex-wrap items-center gap-3 py-2.5">
                  <Avatar name={name} src={r.user?.avatar ? avatarSrc(r.user.avatar, 48) : undefined} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/players/${r.userId}`} className="block truncate text-sm font-semibold text-ink-1 hover:text-primary">
                      {name}
                    </Link>
                    <p className="truncate text-xs text-ink-3">{names.get(r.tournamentId) ?? r.tournamentId}</p>
                  </div>
                  <Badge variant={KIND_VARIANT[r.kind] ?? 'default'} size="sm">
                    {t(`rewards.admin.kind.${r.kind}`)}
                  </Badge>
                  <span className="w-16 text-right text-xs font-semibold text-accent-green num">+{r.xp} XP</span>
                  <span className="w-24 text-right text-[11px] text-ink-3 num">{fmtDate(r.recordedAt, lang)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
