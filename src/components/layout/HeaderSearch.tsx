'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Swords,
  Users,
  Shield,
  Megaphone,
  Radio,
  Users2,
  Trophy,
  Calendar,
  Bell,
  Bot,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useT } from '@/lib/i18n';
import api from '@/lib/api';

export type QuickLink = { href: string; key: string; icon: any };

const PLAYER_LINKS: QuickLink[] = [
  { href: '/dashboard', key: 'header.dashboard', icon: LayoutDashboard },
  { href: '/heroes', key: 'header.heroes', icon: Swords },
  { href: '/players', key: 'header.players', icon: Users },
  { href: '/leaderboard', key: 'header.leaderboard', icon: Trophy },
  { href: '/teams', key: 'header.teams', icon: Shield },
  { href: '/recruitment', key: 'header.recruitment', icon: Megaphone },
  { href: '/stream', key: 'header.stream', icon: Radio },
  { href: '/friends', key: 'header.friends', icon: Users2 },
  { href: '/notifications', key: 'notif.title', icon: Bell },
  { href: '/ai', key: 'header.ai', icon: Bot },
];

type SearchResult = {
  users: any[];
  heroes: any[];
  teams: any[];
  tournaments: any[];
  events: any[];
};

interface ResultItem {
  type: 'player' | 'hero' | 'team' | 'tournament' | 'event';
  id: string;
  label: string;
  icon: any;
  href: string;
  group: string;
}

/** Global search: quick navigation + API search across all entities. */
export default function HeaderSearch({
  links = PLAYER_LINKS,
  variant = 'icon',
  shortcut = true,
}: {
  links?: QuickLink[];
  /** `icon`: round button (mobile); `bar`: search-bar lookalike (desktop). */
  variant?: 'icon' | 'bar';
  /** Only one instance per page should own the Ctrl+K shortcut. */
  shortcut?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult>({
    users: [],
    heroes: [],
    teams: [],
    tournaments: [],
    events: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Setup Ctrl+K / Cmd+K shortcut to open search
  useEffect(() => {
    if (!shortcut) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
    setQ('');
    setResults({ users: [], heroes: [], teams: [], tournaments: [], events: [] });
  }, [open]);

  // Debounced search API call
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!q || q.length < 2) {
      setResults({ users: [], heroes: [], teams: [], tournaments: [], events: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const data = await api.search.all(q, 5);
        setResults(data);
      } catch {
        setResults({ users: [], heroes: [], teams: [], tournaments: [], events: [] });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [q]);

  // Combine navigation links and search results into a flat list
  const allResults = useMemo(() => {
    const items: ResultItem[] = [];

    // Navigation section (always first), filtered by the query like before.
    const s = q.trim().toLowerCase();
    links.forEach((l) => {
      const label = t(l.key);
      if (s && !label.toLowerCase().includes(s)) return;
      items.push({
        type: 'player',
        id: l.href,
        label,
        icon: l.icon,
        href: l.href,
        group: t('search.group.navigation'),
      });
    });

    // Search results sections
    results.users.forEach((user) => {
      items.push({
        type: 'player',
        id: user.id,
        label: user.displayName || user.username,
        icon: Users,
        href: `/players/${user.id}`,
        group: t('search.group.players'),
      });
    });

    results.heroes.forEach((hero) => {
      items.push({
        type: 'hero',
        id: hero.id,
        label: hero.name,
        icon: Swords,
        href: `/heroes#${hero.id}`,
        group: t('search.group.heroes'),
      });
    });

    results.teams.forEach((team) => {
      items.push({
        type: 'team',
        id: team.id,
        label: team.name,
        icon: Shield,
        href: `/teams/${team.id}`,
        group: t('search.group.teams'),
      });
    });

    results.tournaments.forEach((tournament) => {
      items.push({
        type: 'tournament',
        id: tournament.id,
        label: tournament.name,
        icon: Trophy,
        href: `/tournaments/${tournament.id}`,
        group: t('search.group.tournaments'),
      });
    });

    results.events.forEach((event) => {
      items.push({
        type: 'event',
        id: event.id,
        label: event.title,
        icon: Calendar,
        href: '/events',
        group: t('search.group.events'),
      });
    });

    return items;
  }, [q, results, t, links]);

  // Group results by category for display
  const groupedResults = useMemo(() => {
    const groups = new Map<string, ResultItem[]>();
    allResults.forEach((item) => {
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group)!.push(item);
    });
    return Array.from(groups.entries());
  }, [allResults]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && allResults[0]) {
      go(allResults[0].href);
    }
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          aria-label={t('search.title')}
          onClick={() => setOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray text-black hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
          title={t('search.shortcut')}
        >
          <Search size={18} />
        </button>
      ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 text-left text-body hover:text-primary dark:text-bodydark xl:w-125"
        title={t('search.shortcut')}
      >
        <Search size={20} />
        <span className="flex-1 truncate">{t('search.placeholder')}</span>
        <kbd className="hidden rounded border border-stroke px-1.5 py-0.5 text-xs dark:border-strokedark xl:inline">
          Ctrl K
        </kbd>
      </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('search.title')} size="md">
        <div className="p-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bodydark2">
              <Search size={18} />
            </span>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('search.placeholder')}
              className="w-full rounded-lg border border-stroke bg-transparent py-3 pl-10 pr-4 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
              autoComplete="off"
            />
          </div>

          <div className="mt-3 space-y-3">
            {isLoading && (
              <p className="py-3 text-center text-sm text-bodydark2">
                {t('search.loading')}
              </p>
            )}

            {!isLoading && allResults.length === 0 && q.length >= 2 && (
              <p className="py-6 text-center text-sm text-bodydark2">{t('search.empty')}</p>
            )}

            {!isLoading && groupedResults.length > 0 && (
              groupedResults.map(([group, items]) => (
                <div key={group}>
                  <p className="mb-2 text-xs font-semibold uppercase text-bodydark2">
                    {group}
                  </p>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={`${item.id}-${item.type}`}
                          type="button"
                          onClick={() => go(item.href)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-2 dark:hover:bg-meta-4"
                        >
                          <Icon size={18} className="text-primary flex-shrink-0" />
                          <span className="truncate text-black dark:text-white">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
