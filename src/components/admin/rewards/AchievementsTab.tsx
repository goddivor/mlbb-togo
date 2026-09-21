'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, EyeOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Badge, Button, Card, EmptyState, Input, LoadingSpinner, Select, StatTile, Table, Td, Th } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { GamificationIcon } from '@/components/gamification/icons';
import FrameThumb from '@/components/gamification/rewards/FrameThumb';
import { fmtDate } from '@/components/gamification/rewards/shared';
import {
  ACHIEVEMENT_FAMILIES,
  ACHIEVEMENT_RARITIES,
  familyOrder,
  formatPercent,
  rarityStyle,
} from '@/components/gamification/achievements';

export interface AdminAchievement {
  id: string;
  family: string;
  rarity: string;
  reward: number;
  secret: boolean;
  icon: string;
  frameId: string | null;
  triggers: string[];
  unlocks: number;
  percent: number;
  firstUnlockedAt: string | null;
  lastUnlockedAt: string | null;
}

type SortKey = 'family' | 'unlocks' | 'reward';

/** Unlock counts per achievement (spot too easy / impossible ones) and the global recalculation. */
export default function AchievementsTab() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [items, setItems] = useState<AdminAchievement[]>([]);
  const [members, setMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState('');
  const [rarity, setRarity] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'family', dir: 'asc' });
  const [confirming, setConfirming] = useState(false);
  const [recalc, setRecalc] = useState<{ done: number; total: number } | null>(null);

  const load = () =>
    api.rewards.admin
      .achievements()
      .then((res: any) => {
        setItems(Array.isArray(res?.achievements) ? res.achievements : []);
        setMembers(Number(res?.members ?? 0));
      })
      .catch(() => setItems([]));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter(
      (a) =>
        (!family || a.family === family) &&
        (!rarity || a.rarity === rarity) &&
        (!q || a.id.includes(q) || t(`achievement.${a.id}`).toLowerCase().includes(q)),
    );
    const dir = sort.dir === 'asc' ? 1 : -1;
    const rank = (r: string) => ACHIEVEMENT_RARITIES.indexOf(r as any);
    return [...list].sort((a, b) => {
      if (sort.key === 'unlocks') return dir * (a.unlocks - b.unlocks) || a.id.localeCompare(b.id);
      if (sort.key === 'reward') return dir * (a.reward - b.reward) || a.id.localeCompare(b.id);
      return dir * (familyOrder(a.family) - familyOrder(b.family)) || rank(a.rarity) - rank(b.rarity) || a.reward - b.reward;
    });
  }, [items, family, rarity, query, sort, t]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'family' ? 'asc' : 'desc' }));
  const sortedOf = (key: SortKey) => (sort.key === key ? sort.dir : null);

  /** Recalculates every member page by page (the server never handles everyone in one request). */
  const recalculateAll = async () => {
    setConfirming(false);
    setRecalc({ done: 0, total: 0 });
    const sum = { users: 0, achievements: 0, frames: 0 };
    let cursor: string | null = null;
    try {
      for (let page = 0; page < 10_000; page++) {
        const res: any = await api.rewards.admin.recalculatePage(cursor);
        sum.users += Number(res?.users ?? 0);
        sum.achievements += Number(res?.achievementsUnlocked ?? 0);
        sum.frames += Number(res?.framesGranted ?? 0);
        setRecalc({ done: sum.users, total: Number(res?.total ?? sum.users) });
        cursor = res?.nextCursor ?? null;
        if (!cursor) break;
      }
      toast.success(t('rewards.admin.recalcAll.done', sum));
      await load();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setRecalc(null);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="py-16" />;

  const never = items.filter((a) => a.unlocks === 0).length;

  return (
    <div className="space-y-4">
      <Card className="!p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label={t('rewards.admin.ach.total')} value={items.length} />
          <StatTile label={t('rewards.admin.ach.members')} value={members} accent="cyan" />
          <StatTile label={t('rewards.admin.ach.unlocks')} value={items.reduce((n, a) => n + a.unlocks, 0)} accent="gold" />
          <StatTile label={t('rewards.admin.ach.never')} value={never} accent="red" />
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label={t('rewards.admin.ach.search')}
              value={query}
              onChange={(e: any) => setQuery(e.target.value)}
              placeholder={t('rewards.admin.ach.search')}
            />
            <Select label={t('rewards.admin.ach.family')} value={family} onChange={(e: any) => setFamily(e.target.value)}>
              <option value="">{t('rewards.admin.ach.all')}</option>
              {ACHIEVEMENT_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {t(`achievement.family.${f}`)}
                </option>
              ))}
            </Select>
            <Select label={t('rewards.admin.ach.rarity')} value={rarity} onChange={(e: any) => setRarity(e.target.value)}>
              <option value="">{t('rewards.admin.ach.all')}</option>
              {ACHIEVEMENT_RARITIES.map((r) => (
                <option key={r} value={r}>
                  {t(`achievement.rarity.${r}`)}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="secondary" onClick={() => setConfirming(true)} loading={!!recalc} disabled={!!recalc}>
            <RefreshCw size={15} />
            {recalc ? t('rewards.admin.recalcAll.progress', recalc) : t('rewards.admin.recalcAll')}
          </Button>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<Award size={26} />} title={t('rewards.admin.ach.empty')} className="!min-h-0 py-10" />
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <Table className="min-w-[860px]">
              <thead>
                <tr className="border-b border-line-subtle">
                  <Th sortable sorted={sortedOf('family')} onSort={() => toggleSort('family')}>
                    {t('rewards.admin.ach.name')}
                  </Th>
                  <Th>{t('rewards.admin.ach.rarity')}</Th>
                  <Th align="right" sortable sorted={sortedOf('reward')} onSort={() => toggleSort('reward')}>
                    {t('rewards.admin.ach.xp')}
                  </Th>
                  <Th align="center">{t('rewards.admin.ach.frame')}</Th>
                  <Th align="right" sortable sorted={sortedOf('unlocks')} onSort={() => toggleSort('unlocks')}>
                    {t('rewards.admin.ach.unlocks')}
                  </Th>
                  <Th align="right">{t('rewards.admin.ach.percent')}</Th>
                  <Th>{t('rewards.admin.ach.first')}</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const style = rarityStyle(a.rarity);
                  return (
                    <tr key={a.id} className="border-b border-line-subtle last:border-0">
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-3 text-ink-2">
                            <GamificationIcon name={a.icon} size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 font-semibold text-ink-1">
                              <span className="truncate">{t(`achievement.${a.id}`)}</span>
                              {a.secret && (
                                <span title={t('rewards.admin.ach.secret')} className="text-ink-3">
                                  <EyeOff size={13} aria-label={t('rewards.admin.ach.secret')} />
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-ink-3">
                              {t(`achievement.family.${a.family}`)} · <code>{a.id}</code>
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Badge variant={style.badge} size="sm">
                          {t(`achievement.rarity.${a.rarity}`)}
                        </Badge>
                      </Td>
                      <Td align="right" className="font-semibold text-accent-gold">
                        {a.reward}
                      </Td>
                      <Td align="center">{a.frameId ? <FrameThumb frame={a.frameId} size={32} label={a.frameId} /> : '—'}</Td>
                      <Td align="right" className={a.unlocks === 0 ? 'text-ink-3' : 'font-semibold'}>
                        {a.unlocks}
                      </Td>
                      <Td align="right">{formatPercent(a.percent, lang)}</Td>
                      <Td className="whitespace-nowrap text-ink-2">{a.firstUnlockedAt ? fmtDate(a.firstUnlockedAt, lang) : '—'}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={recalculateAll}
        title={t('rewards.admin.recalcAll.confirmTitle')}
        message={t('rewards.admin.recalcAll.confirm')}
        confirmLabel={t('rewards.admin.recalcAll')}
        cancelLabel={t('rewards.admin.ev.form.cancel')}
      />
    </div>
  );
}
