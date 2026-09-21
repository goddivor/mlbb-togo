'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, Shield, Users, Plus, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { fadeUp, stagger, still } from '@/lib/motion';
import {
  Button,
  Input,
  Textarea,
  Card,
  PageHeader,
  EmptyState,
  Skeleton,
  StatTile,
  Tabs,
} from '@/components/ui';
import { TeamCard } from '@/components/game';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface EsportTeam {
  id: string;
  name: string;
  image?: string | null;
  memberCount?: number;
}

interface EsportOrg {
  name: string;
  logo?: string | null;
  color?: string | null;
  description?: string | null;
  teams?: EsportTeam[];
}

export default function TeamsPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const [org, setOrg] = useState<EsportOrg | null>(null);
  const [community, setCommunity] = useState<EsportTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'esport' | 'community'>('esport');

  useEffect(() => {
    Promise.all([api.esport.org(), api.esport.teams('community')])
      .then(([o, c]: any) => {
        setOrg(o);
        setCommunity(Array.isArray(c) ? c : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const esportTeams = org?.teams ?? [];
  const accent = org?.color || '#E9B84B';
  const total = esportTeams.length + community.length;

  const byQuery = (list: EsportTeam[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((tm) => (tm.name || '').toLowerCase().includes(q));
  };
  const filteredEsport = useMemo(() => byQuery(esportTeams), [esportTeams, query]);
  const filteredCommunity = useMemo(() => byQuery(community), [community, query]);

  const activeList = tab === 'esport' ? filteredEsport : filteredCommunity;
  const activeAccent = tab === 'esport' ? accent : 'rgb(var(--accent-cyan))';

  const [proposeOpen, setProposeOpen] = useState(false);
  const [form, setForm] = useState({ proposedName: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const submitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.proposedName.trim()) return;
    setSubmitting(true);
    try {
      await api.teamRequests.create({
        proposedName: form.proposedName.trim(),
        message: form.message.trim() || undefined,
      });
      toast.success(t('requests.sent'));
      setProposeOpen(false);
      setForm({ proposedName: '', message: '' });
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.section.esport')}
        icon={<Shield size={20} />}
        title={t('teams.title')}
        subtitle={loading ? '…' : `${total} ${t('teams.count')}`}
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setProposeOpen(true)}>
              <Plus size={16} /> <span className="hidden sm:inline">{t('requests.propose')}</span>
            </Button>
            <Link href="/my-requests">
              <Button size="sm" variant="outline">{t('requests.mine')}</Button>
            </Link>
          </div>
        }
      />

      {/* Esport organisation */}
      {org && (
        <Card className="relative overflow-hidden !p-5">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 -skew-x-12" style={{ background: accent }} />
          <div className="flex flex-col gap-4 pl-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {org.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={org.logo}
                  alt={org.name}
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded cut-corners-sm bg-surface-2 object-contain p-1 ring-1 ring-inset ring-line-subtle"
                />
              )}
              <div className="min-w-0">
                <p className="eyebrow mb-1" style={{ color: accent }}>{t('teams.sectionEsport')}</p>
                <h2 className="font-display text-xl font-bold tracking-tight2 text-ink-1">{org.name}</h2>
                {org.description && <p className="mt-0.5 text-sm text-ink-2">{t('teams.orgDesc')}</p>}
              </div>
            </div>
            <div className="flex items-center gap-6 sm:pr-2">
              <StatTile label={t('teams.sectionEsport')} value={esportTeams.length} accent="gold" />
              <StatTile label={t('teams.sectionCommunity')} value={community.length} />
            </div>
          </div>
        </Card>
      )}

      {/* Tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="overflow-x-auto overflow-y-hidden">
          <Tabs
            variant="underline"
            active={tab}
            onChange={(id: 'esport' | 'community') => setTab(id)}
            className="min-w-max whitespace-nowrap"
            tabs={[
              { id: 'esport', label: t('teams.sectionEsport'), icon: Shield, count: esportTeams.length },
              { id: 'community', label: t('teams.sectionCommunity'), icon: Users, count: community.length },
            ]}
          />
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-3" />
          <Input
            value={query}
            onChange={(e: any) => setQuery(e.target.value)}
            placeholder={t('teams.search')}
            className="!py-2.5 pl-9"
          />
        </div>
      </div>

      {/* Active tab content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : activeList.length === 0 ? (
        <EmptyState
          icon={tab === 'esport' ? <Shield size={28} /> : <Users size={28} />}
          title={query.trim() ? t('teams.none') : t('teams.empty')}
        />
      ) : (
        <motion.div
          key={tab}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={reduce ? still : stagger(0.04)}
          initial="hidden"
          animate="visible"
        >
          {activeList.map((tm) => (
            <motion.div key={tm.id} variants={reduce ? still : fadeUp}>
              <TeamCard team={{ ...tm, color: activeAccent }} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        closeLabel={t('common.close')}
        title={t('requests.propose')}
        subtitle={t('requests.proposeHint')}
        icon={<Plus size={20} />}
        headerVariant="gradient"
      >
        <form onSubmit={submitProposal} className="space-y-4">
          <Input
            label={t('requests.form.name')}
            value={form.proposedName}
            onChange={(e: any) => setForm({ ...form, proposedName: e.target.value })}
            required
          />
          <Textarea
            label={t('requests.form.message')}
            value={form.message}
            onChange={(e: any) => setForm({ ...form, message: e.target.value })}
          />
          <div className="flex gap-2 pt-2">
            <Button size="sm" type="submit" loading={submitting} disabled={submitting}>
              <Check size={16} /> {t('requests.submit')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setProposeOpen(false)}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
