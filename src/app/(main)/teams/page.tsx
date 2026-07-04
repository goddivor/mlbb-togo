'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Shield, Users, Plus, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import {
  Button,
  Input,
  Textarea,
  SectionCard,
  PageHeader,
  EmptyState,
  LoadingSpinner,
  Tabs,
} from '@/components/ui';
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

function TeamCard({ tm, accent }: { tm: EsportTeam; accent: string }) {
  return (
    <Link
      href={`/teams/${tm.id}`}
      className="group block rounded-xl border border-gaming-border bg-gaming-card overflow-hidden hover:border-neon-blue transition-colors"
    >
      <div className="relative aspect-video w-full bg-gaming-surface overflow-hidden">
        {tm.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tm.image}
            alt={tm.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Shield size={40} className="text-gray-600" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: accent }} />
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2 min-w-0">
          <Shield size={16} style={{ color: accent }} className="shrink-0" />
          <p className="text-sm font-semibold text-white truncate">{tm.name}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-gray-400 shrink-0">
          <Users size={13} /> {tm.memberCount ?? 0}
        </span>
      </div>
    </Link>
  );
}

export default function TeamsPage() {
  const t = useT();
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
  const activeAccent = tab === 'esport' ? accent : '#5b6b8c';

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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={<Shield size={28} />}
        title={t('teams.title')}
        subtitle={loading ? '…' : `${total} ${t('teams.count')}`}
        variant="default"
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setProposeOpen(true)}>
              <Plus size={16} /> <span className="hidden sm:inline">{t('requests.propose')}</span>
            </Button>
            <Link
              href="/my-requests"
              className="shrink-0 inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors"
            >
              {t('requests.mine')}
            </Link>
          </div>
        }
      />

      {/* Esport organisation */}
      {org && (
        <SectionCard className="flex items-center gap-4">
          {org.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logo}
              alt={org.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-contain bg-gaming-surface p-1"
            />
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold" style={{ color: accent }}>
              {org.name}
            </h2>
            {org.description && <p className="text-sm text-gray-400 mt-0.5">{t('teams.orgDesc')}</p>}
          </div>
        </SectionCard>
      )}

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          active={tab}
          onChange={(id: 'esport' | 'community') => setTab(id)}
          tabs={[
            { id: 'esport', label: `${t('teams.sectionEsport')} (${esportTeams.length})`, icon: Shield },
            { id: 'community', label: `${t('teams.sectionCommunity')} (${community.length})`, icon: Users },
          ]}
        />
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
          />
          <Input
            value={query}
            onChange={(e: any) => setQuery(e.target.value)}
            placeholder={t('teams.search')}
            className="pl-9"
          />
        </div>
      </div>

      {/* Active tab content */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : activeList.length === 0 ? (
        <EmptyState
          icon={tab === 'esport' ? <Shield size={28} /> : <Users size={28} />}
          title={query.trim() ? t('teams.none') : t('teams.empty')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeList.map((tm) => (
            <TeamCard key={tm.id} tm={tm} accent={activeAccent} />
          ))}
        </div>
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
