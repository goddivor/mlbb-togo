'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { api, type CommunityBuild } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Skeleton } from '@/components/ui';
import CommunityBuildCard from './CommunityBuildCard';
import { useBuildInteractions } from './useBuildInteractions';

const LIMIT = 4;

/** Most liked published community builds of a hero, for the hero modal. */
export default function HeroCommunityBuilds({ heroId, onNavigate }: { heroId: number; onNavigate?: () => void }) {
  const t = useT();
  const [builds, setBuilds] = useState<CommunityBuild[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const patch = useCallback((id: string, p: Partial<CommunityBuild>) => {
    setBuilds((list) => list.map((b) => (b.id === id ? { ...b, ...p } : b)));
  }, []);
  const { toggleLike, openReport, likeBusy, reportModal } = useBuildInteractions(patch);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.communityBuilds
      .list({ hero: heroId, sort: 'likes', limit: LIMIT })
      .then((res) => {
        if (!alive) return;
        setBuilds(res.items);
        setTotal(res.total);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [heroId]);

  const createHref = `/dashboard/my-builds?create=1&hero=${heroId}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={createHref}
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 rounded border border-primary/60 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          <Plus size={14} /> {t('communityBuilds.create')}
        </Link>
        {total > 0 && (
          <Link
            href={`/dashboard/builds?hero=${heroId}`}
            onClick={onNavigate}
            className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink-1"
          >
            {t('communityBuilds.seeAll', { n: total })} <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-lg border border-line-subtle p-4">
              <Skeleton lines={3} />
            </div>
          ))}
        </div>
      ) : builds.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-3">{t('communityBuilds.heroEmpty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {builds.map((b) => (
            <CommunityBuildCard
              key={b.id}
              build={b}
              showHero={false}
              onToggleLike={toggleLike}
              onReport={openReport}
              likeBusy={likeBusy === b.id}
            />
          ))}
        </div>
      )}
      {reportModal}
    </div>
  );
}
