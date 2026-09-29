'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Link2,
  Mail,
  Search,
  UserRoundSearch,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  api,
  avatarSrc,
  type ImportedProfile,
  type MergeAccount,
  type MergeCandidate,
  type MergePreview,
  type MergeReason,
} from '@/lib/api';
import { useT } from '@/lib/i18n';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  InfoTip,
  Input,
  LoadingSpinner,
  PageHeader,
  StatTile,
  type DataColumn,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';

/** Below this the API still offers the account, but the UI hedges. */
const WEAK_MATCH = 0.6;

/** Compact account line reused by the suggestion list and the summary. */
function AccountLine({ account, right }: { account: MergeAccount; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar
        name={account.gameNickname || account.username}
        src={account.avatar ? avatarSrc(account.avatar, 64) : undefined}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-1">
          {account.gameNickname || account.username}
        </p>
        <p className="truncate text-xs text-ink-2">
          {account.username} · {account.email}
        </p>
      </div>
      {right}
    </div>
  );
}

export default function AdminImportedProfiles() {
  const t = useT();

  const [profiles, setProfiles] = useState<ImportedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  // Expected-email editor.
  const [emailFor, setEmailFor] = useState<ImportedProfile | null>(null);
  const [emailValue, setEmailValue] = useState('');

  // Merge wizard.
  const [linkFor, setLinkFor] = useState<ImportedProfile | null>(null);
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<MergeCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [target, setTarget] = useState<MergeCandidate | null>(null);
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [merged, setMerged] = useState<MergeAccount | null>(null);

  /** Human name of a Prisma model, translated (never a backend string). */
  const modelLabel = useCallback(
    (model: string) => {
      const key = `admin.imported.model.${model}`;
      const label = t(key);
      return label === key ? model : label;
    },
    [t],
  );

  /** Refusal reason, translated from its code: short label and full detail. */
  const reasonText = useCallback(
    (reason: MergeReason, variant: 'short' | 'full') => {
      const key =
        variant === 'short'
          ? `admin.imported.reason.short.${reason.code}`
          : `admin.imported.reason.${reason.code}`;
      const text = t(key, {
        count: reason.count,
        model: 'model' in reason ? modelLabel(reason.model) : '',
      });
      if (text !== key) return text;
      return t(
        variant === 'short' ? 'admin.imported.reason.short.unknown' : 'admin.imported.reason.unknown',
      );
    },
    [t, modelLabel],
  );

  /** API error: prefer our own translated copy when the API sent a code. */
  const errorText = useCallback(
    (e: any) => {
      const code = e?.code;
      if (code) {
        const key = `admin.imported.error.${code}`;
        const text = t(key);
        if (text !== key) return text;
      }
      return e?.message || t('common.error');
    },
    [t],
  );

  const load = useCallback(
    () =>
      api.imported
        .list()
        .then((l) => setProfiles(Array.isArray(l) ? l : []))
        .catch(() => setProfiles([])),
    [],
  );

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        (p.gameNickname || '').toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const counts = useMemo(
    () => ({
      total: profiles.length,
      withEmail: profiles.filter((p) => p.emailSet).length,
      matches: profiles.reduce((n, p) => n + p.matchesPlayed, 0),
    }),
    [profiles],
  );

  // ----- Expected email -----

  const openEmail = (p: ImportedProfile) => {
    setEmailFor(p);
    setEmailValue(p.emailSet ? p.email : '');
  };

  const saveEmail = async () => {
    if (!emailFor) return;
    const value = emailValue.trim();
    setBusy('email');
    try {
      await api.imported.setEmail(emailFor.id, value || null);
      toast.success(value ? t('admin.imported.emailSaved') : t('admin.imported.emailCleared'));
      setEmailFor(null);
      await load();
    } catch (e: any) {
      toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  // ----- Merge wizard -----

  const openLink = (p: ImportedProfile) => {
    setLinkFor(p);
    setQuery('');
    setTarget(null);
    setPreview(null);
    setMerged(null);
    setCandidates([]);
  };

  // Suggestions on open, then a debounced search while the admin types.
  useEffect(() => {
    if (!linkFor) return;
    let alive = true;
    setSearching(true);
    const id = setTimeout(
      () => {
        api.imported
          .candidates(linkFor.id, query.trim())
          .then((l) => alive && setCandidates(Array.isArray(l) ? l : []))
          .catch(() => alive && setCandidates([]))
          .finally(() => alive && setSearching(false));
      },
      query.trim() ? 300 : 0,
    );
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [linkFor, query]);

  useEffect(() => {
    if (!linkFor || !target) return;
    let alive = true;
    setPreviewing(true);
    setPreview(null);
    api.imported
      .preview(linkFor.id, target.id)
      .then((p) => alive && setPreview(p))
      .catch((e: any) => {
        if (!alive) return;
        toast.error(errorText(e));
        setTarget(null);
      })
      .finally(() => alive && setPreviewing(false));
    return () => {
      alive = false;
    };
  }, [linkFor, target, errorText]);

  const runMerge = async () => {
    if (!linkFor || !target) return;
    setBusy('merge');
    try {
      const res = await api.imported.merge(linkFor.id, target.id);
      const name = res.target.gameNickname || res.target.username;
      setMerged(res.target);
      setConfirming(false);
      setPreview(null);
      toast.success(
        res.alreadyMerged
          ? t('admin.imported.replayed', { target: name })
          : t('admin.imported.merged', { target: name }),
      );
      await load();
    } catch (e: any) {
      toast.error(errorText(e));
      setConfirming(false);
    } finally {
      setBusy(null);
    }
  };

  /** Row actions, shared by the table and the mobile cards. */
  const rowActions = (p: ImportedProfile) => (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => openEmail(p)}
        title={t('admin.imported.editEmail')}
        aria-label={t('admin.imported.editEmail')}
      >
        <Mail size={15} className={p.emailSet ? 'text-accent-gold' : undefined} />
      </Button>
      <Button size="sm" variant="secondary" className="whitespace-nowrap" onClick={() => openLink(p)}>
        <Link2 size={15} className="mr-1.5 shrink-0" />
        {t('admin.imported.link')}
      </Button>
    </div>
  );

  const emailBadge = (p: ImportedProfile) =>
    p.hasGoogle ? (
      <Badge variant="green" size="sm">
        {t('admin.imported.claimed')}
      </Badge>
    ) : p.emailSet ? (
      <Badge variant="gold" size="sm">
        {t('admin.imported.emailSet')}
      </Badge>
    ) : (
      <Badge variant="outline" size="sm">
        {t('admin.imported.emailNotSet')}
      </Badge>
    );

  const columns: DataColumn<ImportedProfile>[] = [
    {
      key: 'profile',
      header: t('admin.imported.colProfile'),
      render: (p) => <AccountLine account={p} />,
    },
    {
      key: 'seasons',
      header: t('admin.imported.colSeasons'),
      hideBelow: 'md',
      width: '13rem',
      render: (p) => (
        <div className="flex flex-wrap items-center gap-1">
          {p.seasons.map((s) => (
            <Badge key={s.id} variant="outline" size="sm" className="max-w-full truncate">
              {s.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'teams',
      header: t('admin.imported.colTeams'),
      hideBelow: 'lg',
      width: '13rem',
      render: (p) => (
        <div className="flex flex-wrap items-center gap-1">
          {p.teams.map((tm) => (
            <Badge key={tm.id} variant="neon" size="sm" className="max-w-full truncate">
              {tm.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'matches',
      header: t('admin.imported.colMatches'),
      align: 'right',
      className: 'num text-sm text-ink-1',
      render: (p) => p.matchesPlayed,
    },
    {
      key: 'email',
      header: t('admin.imported.colEmail'),
      hideBelow: 'sm',
      render: emailBadge,
    },
    {
      key: 'actions',
      header: t('admin.imported.colActions'),
      align: 'right',
      render: (p) => <div className="flex justify-end">{rowActions(p)}</div>,
    },
  ];

  const moveRows = preview
    ? [
        { label: t('admin.imported.moveMemberships'), value: preview.moves.teamMemberships.length },
        { label: t('admin.imported.moveMatches'), value: preview.moves.matchPlayers },
        { label: t('admin.imported.moveAwards'), value: preview.moves.awards.length },
        { label: t('admin.imported.moveStaff'), value: preview.moves.staff.length },
        { label: t('admin.imported.movePicks'), value: preview.moves.gamePicks },
        { label: t('admin.imported.moveMvp'), value: preview.moves.matchMvp },
        { label: t('admin.imported.moveTournamentMvp'), value: preview.moves.tournamentMvp },
        { label: t('admin.imported.moveElections'), value: preview.moves.rewardElections },
        { label: t('admin.imported.moveArchives'), value: preview.moves.seasonArchives },
        { label: t('admin.imported.moveRegistry'), value: preview.moves.registryEntries.length },
        { label: t('admin.imported.movePruned'), value: preview.moves.registryPruned },
        {
          label: t('admin.imported.moveDropped'),
          value: preview.moves.droppedTeamMemberships.length,
        },
      ].filter((r) => r.value > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* The title carries a node (the info button): `breadcrumb` takes the
          plain label so that button is not rendered, and announced, twice. */}
      <PageHeader
        icon={<UserRoundSearch size={28} />}
        eyebrow={t('nav.section.community')}
        title={
          <span className="inline-flex items-center gap-2">
            {t('admin.imported.title')}
            <InfoTip
              label={t('admin.imported.infoLabel')}
              title={t('admin.imported.title')}
              content={t('admin.imported.intro')}
              size={15}
            />
          </span>
        }
        breadcrumb={t('admin.imported.title')}
        subtitle={t('admin.imported.subtitle')}
        variant="blue"
      />

      {!loading && (
        <Card className="!p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile label={t('admin.imported.count')} value={counts.total} />
            <StatTile label={t('admin.imported.withEmail')} value={counts.withEmail} accent="gold" />
            <StatTile label={t('admin.imported.matchesTotal')} value={counts.matches} accent="cyan" />
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.imported.search')}
            className="w-full rounded border border-line-strong bg-surface-1 py-2.5 pl-10 pr-4 text-sm text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
          />
        </div>

        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<UserRoundSearch size={28} />}
            title={t('admin.imported.none')}
            className="!min-h-0 py-12"
          />
        ) : (
          <>
            {/* Phones: a stacked card per profile. The table needs 600 px of
                width, which would push the actions off-screen inside its own
                horizontal scroller. */}
            <ul className="space-y-3 sm:hidden">
              {filtered.map((p) => (
                <li
                  key={p.id}
                  className="space-y-3 rounded border border-line-strong bg-surface-1 p-3 dark:bg-surface-0/60"
                >
                  <AccountLine account={p} />
                  <div className="flex flex-wrap items-center gap-1">
                    {emailBadge(p)}
                    {p.seasons.map((s) => (
                      <Badge key={s.id} variant="outline" size="sm">
                        {s.name}
                      </Badge>
                    ))}
                    {p.teams.map((tm) => (
                      <Badge key={tm.id} variant="neon" size="sm">
                        {tm.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-ink-2">
                      {t('admin.imported.colMatches')} :{' '}
                      <span className="num font-semibold text-ink-1">{p.matchesPlayed}</span>
                    </span>
                    {rowActions(p)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden sm:block">
              <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(p) => p.id}
                emptyMessage={t('admin.imported.none')}
              />
            </div>
          </>
        )}
      </div>

      {/* ----- Expected email ----- */}
      <Modal
        open={!!emailFor}
        onClose={() => setEmailFor(null)}
        title={t('admin.imported.editEmail')}
        subtitle={emailFor?.gameNickname || emailFor?.username}
        icon={<Mail size={18} />}
        size="sm"
      >
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-ink-2">
            {t('admin.imported.editEmailShort')}
            <InfoTip
              label={t('admin.imported.emailInfoLabel')}
              content={t('admin.imported.editEmailHelp')}
            />
          </p>
          <Input
            type="email"
            value={emailValue}
            onChange={(e: any) => setEmailValue(e.target.value)}
            placeholder={t('admin.imported.emailPlaceholder')}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setEmailFor(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={saveEmail} disabled={busy === 'email'}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ----- Merge wizard ----- */}
      <Modal
        open={!!linkFor}
        onClose={() => setLinkFor(null)}
        title={t('admin.imported.linkTitle', {
          name: linkFor?.gameNickname || linkFor?.username || '',
        })}
        icon={<Link2 size={18} />}
        size="lg"
      >
        <div className="space-y-5">
          {merged ? (
            <div className="space-y-4">
              <div className="rounded border border-success/40 bg-success/10 p-4">
                <p className="text-sm text-ink-1">
                  {t('admin.imported.merged', {
                    target: merged.gameNickname || merged.username,
                  })}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Link href={`/dashboard/players/${merged.id}`}>
                  <Button variant="secondary" className="whitespace-nowrap">
                    <ExternalLink size={15} className="mr-1.5 shrink-0" />
                    {t('admin.imported.openAccount')}
                  </Button>
                </Link>
                <Button onClick={() => setLinkFor(null)}>{t('common.close')}</Button>
              </div>
            </div>
          ) : (
            <>
              {linkFor && (
                <div className="rounded border border-line-strong bg-surface-1 p-3 dark:bg-surface-0/60">
                  <AccountLine account={linkFor} />
                </div>
              )}

              {target ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                    {t('admin.imported.selected')}
                  </p>
                  <div className="rounded border border-primary/40 bg-primary/5 p-3">
                    <AccountLine
                      account={target}
                      right={
                        <Button size="sm" variant="ghost" onClick={() => setTarget(null)}>
                          {t('admin.imported.change')}
                        </Button>
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('admin.imported.targetSearch')}
                      className="w-full rounded border border-line-strong bg-surface-1 py-2.5 pl-10 pr-4 text-sm text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
                    />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                    {query.trim() ? t('admin.imported.results') : t('admin.imported.suggestions')}
                  </p>
                  {searching ? (
                    <LoadingSpinner className="py-6" />
                  ) : candidates.length === 0 ? (
                    <p className="py-4 text-sm text-ink-2">{t('admin.imported.noCandidate')}</p>
                  ) : (
                    <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {candidates.map((c) => (
                        <li
                          key={c.id}
                          className="rounded border border-line-strong bg-surface-1 p-3 dark:bg-surface-0/60"
                        >
                          <AccountLine
                            account={c}
                            right={
                              <div className="flex shrink-0 items-center gap-2">
                                {c.score > 0 && (
                                  <Badge
                                    variant={c.score >= WEAK_MATCH ? 'green' : 'outline'}
                                    size="sm"
                                    className="whitespace-nowrap"
                                  >
                                    {t('admin.imported.similarity', {
                                      score: Math.round(c.score * 100),
                                    })}
                                    {c.score < WEAK_MATCH && ` · ${t('admin.imported.weakMatch')}`}
                                  </Badge>
                                )}
                                <Button size="sm" variant="secondary" onClick={() => setTarget(c)}>
                                  {t('admin.imported.select')}
                                </Button>
                              </div>
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {target && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                    {t('admin.imported.previewTitle')}
                  </p>
                  {previewing || !preview ? (
                    <LoadingSpinner className="py-6" />
                  ) : (
                    <>
                      {!preview.canMerge && (
                        <div className="space-y-2 rounded border border-danger/40 bg-danger/10 p-3">
                          <p className="flex items-center gap-2 text-sm font-semibold text-ink-1">
                            <AlertTriangle size={16} className="shrink-0 text-danger" />
                            {t('admin.imported.blockedShort', { count: preview.reasons.length })}
                          </p>
                          <ul className="space-y-1 text-sm text-ink-2">
                            {preview.reasons.map((r, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <span>{reasonText(r, 'short')}</span>
                                <InfoTip
                                  label={t('admin.imported.reasonInfoLabel')}
                                  content={reasonText(r, 'full')}
                                  side="top"
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <ul className="divide-y divide-line rounded border border-line-strong">
                        {moveRows.length === 0 ? (
                          <li className="p-3 text-sm text-ink-2">{t('admin.imported.none')}</li>
                        ) : (
                          moveRows.map((r) => (
                            <li
                              key={r.label}
                              className="flex items-center justify-between gap-3 p-3 text-sm"
                            >
                              <span className="text-ink-2">{r.label}</span>
                              <span className="num font-semibold text-ink-1">{r.value}</span>
                            </li>
                          ))
                        )}
                      </ul>
                      {preview.drops.length > 0 && (
                        <p className="text-xs text-ink-3">
                          {t('admin.imported.dropped')} :{' '}
                          {preview.drops
                            .map((d) => `${modelLabel(d.model)} (${d.count})`)
                            .join(', ')}
                        </p>
                      )}
                      <p className="flex items-center gap-2 text-xs text-warning">
                        <AlertTriangle size={14} className="shrink-0" />
                        {t('admin.imported.warning')}
                      </p>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="ghost" onClick={() => setLinkFor(null)}>
                          {t('common.cancel')}
                        </Button>
                        <Button
                          variant="danger"
                          className="whitespace-nowrap"
                          disabled={!preview.canMerge || busy === 'merge'}
                          onClick={() => setConfirming(true)}
                        >
                          {t('admin.imported.confirm')}
                          <ArrowRight size={15} className="ml-1.5 shrink-0" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={runMerge}
        loading={busy === 'merge'}
        variant="danger"
        title={t('admin.imported.confirmTitle')}
        message={t('admin.imported.confirmMessage', {
          source: linkFor?.gameNickname || linkFor?.username || '',
          target: target?.gameNickname || target?.username || '',
        })}
        confirmLabel={t('admin.imported.confirm')}
      />
    </div>
  );
}
