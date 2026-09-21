'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Swords } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Badge, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { StandingRow, StandingsType, TeamAvatar, TFn } from './bits';

type H2HMatch = {
  id: string;
  date: string | null;
  type: string;
  scoreA: number;
  scoreB: number;
  winnerTeamId: string | null;
};

type H2HRecord = {
  teamA: StandingRow['team'];
  teamB: StandingRow['team'];
  played: number;
  winsA: number;
  winsB: number;
  draws: number;
  scoreA: number;
  scoreB: number;
  last: H2HMatch | null;
  matches: H2HMatch[];
};

type Payload = { team: StandingRow['team']; opponents: H2HRecord[] };

function fmtDate(v: string | null, lang: string) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
}

/** Head-to-head of one team against every opponent of the season (modal). */
export default function H2HModal({
  open,
  onClose,
  seasonId,
  type,
  team,
  t,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  seasonId: string;
  type: StandingsType;
  team: StandingRow['team'] | null;
  t: TFn;
  lang: string;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !team) return;
    let cancelled = false;
    setLoading(true);
    setExpanded(null);
    api.standings
      .h2h(seasonId, team.id, undefined, type)
      .then((res: Payload | null) => {
        if (!cancelled) setData(res && Array.isArray(res.opponents) ? res : null);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, team, seasonId, type]);

  const opponents = data?.opponents ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<Swords size={18} />}
      title={t('standings.h2h.title')}
      subtitle={team ? t('standings.h2h.subtitle', { team: team.name }) : undefined}
      closeLabel={t('common.close')}
    >
      {loading ? (
        <div className="space-y-2 py-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : !team || opponents.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-3">{t('standings.h2h.empty')}</p>
      ) : (
        <div className="space-y-2">
          {opponents.map((o) => {
            const isOpen = expanded === o.teamB.id;
            const lead = o.winsA > o.winsB ? 'text-accent-green' : o.winsA < o.winsB ? 'text-accent-red' : 'text-ink-2';
            return (
              <div
                key={o.teamB.id}
                className={cn('overflow-hidden rounded-lg border transition-colors', isOpen ? 'border-primary/40' : 'border-line-subtle')}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : o.teamB.id)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2/60"
                >
                  <TeamAvatar team={o.teamB} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink-1">{o.teamB.name}</span>
                    <span className="block text-xs num text-ink-3">
                      {t('standings.h2h.games', { n: o.played })} · {t('standings.h2h.rounds', { a: o.scoreA, b: o.scoreB })}
                      {o.draws > 0 ? ` · ${t('standings.h2h.draws', { n: o.draws })}` : ''}
                    </span>
                  </span>
                  <span className={cn('shrink-0 font-display text-base font-bold num', lead)}>
                    {t('standings.h2h.record', { w: o.winsA, l: o.winsB })}
                  </span>
                </button>
                {isOpen && (
                  <ul className="divide-y divide-line-subtle border-t border-line-subtle bg-surface-2/40">
                    {[...o.matches].reverse().map((m) => {
                      const won = m.winnerTeamId === team.id;
                      const drawn = !m.winnerTeamId;
                      return (
                        <li key={m.id} className="flex items-center gap-3 px-3 py-2 text-xs">
                          <span className="w-16 shrink-0 num text-ink-3">{fmtDate(m.date, lang)}</span>
                          <Badge size="sm" variant={drawn ? 'default' : won ? 'green' : 'red'}>
                            {t('standings.result.' + (drawn ? 'D' : won ? 'W' : 'L'))}
                          </Badge>
                          <span className="font-display font-bold num text-ink-1">
                            {m.scoreA} - {m.scoreB}
                          </span>
                          <span className="ml-auto text-ink-3">{t('matchType.' + m.type)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
          <div className="pt-2 text-right">
            <Link href={`/dashboard/teams/${team.id}`} className="text-sm font-semibold text-primary hover:underline">
              {t('standings.h2h.teamPage')}
            </Link>
          </div>
        </div>
      )}
    </Modal>
  );
}
