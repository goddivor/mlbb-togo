'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Shield, Users, Plus, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui';
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

function TeamCard({ tm, accent, t, i }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.03, 0.4) }}
    >
      <Link
        href={`/teams/${tm.id}`}
        className="group block rounded-xl border border-gaming-border bg-gaming-surface/40 overflow-hidden hover:border-neon-blue transition-colors"
      >
        <div className="relative aspect-video w-full bg-gaming-dark overflow-hidden">
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
    </motion.div>
  );
}

export default function TeamsPage() {
  const t = useT();
  const [org, setOrg] = useState<EsportOrg | null>(null);
  const [community, setCommunity] = useState<EsportTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

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

  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-blue';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('teams.title')}</h1>
          <p className="text-sm text-gray-400">
            {loading ? '…' : `${total} ${t('teams.count')}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('teams.search')}
              className="pl-9 pr-3 py-2 w-full sm:w-64 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-blue"
            />
          </div>
          <Button size="sm" onClick={() => setProposeOpen(true)} className="shrink-0">
            <Plus size={16} /> <span className="hidden sm:inline">{t('requests.propose')}</span>
          </Button>
          <Link
            href="/my-requests"
            className="shrink-0 inline-flex items-center px-3 py-2 text-sm rounded-lg border border-gaming-border text-gray-300 hover:text-white hover:border-neon-blue transition-colors"
          >
            {t('requests.mine')}
          </Link>
        </div>
      </div>

      {org && (
        <div className="flex items-center gap-4 rounded-xl border border-gaming-border bg-gaming-surface/40 p-4 mb-6">
          {org.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logo}
              alt={org.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-contain bg-gaming-dark p-1"
            />
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold" style={{ color: accent }}>
              {org.name}
            </h2>
            {org.description && (
              <p className="text-sm text-gray-400 mt-0.5">{t('teams.orgDesc')}</p>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
        </div>
      ) : total === 0 ? (
        <div className="text-center py-20 text-gray-500">{t('teams.empty')}</div>
      ) : filteredEsport.length === 0 && filteredCommunity.length === 0 ? (
        <div className="text-center py-20 text-gray-500">{t('teams.none')}</div>
      ) : (
        <div className="space-y-8">
          {filteredEsport.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-neon-gold mb-3">
                {t('teams.sectionEsport')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEsport.map((tm, i) => (
                  <TeamCard key={tm.id} tm={tm} accent={accent} t={t} i={i} />
                ))}
              </div>
            </section>
          )}

          {filteredCommunity.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-300 mb-3">
                {t('teams.sectionCommunity')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommunity.map((tm, i) => (
                  <TeamCard key={tm.id} tm={tm} accent="#5b6b8c" t={t} i={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Modal
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        closeLabel={t('common.close')}
        title={t('requests.propose')}
      >
        <p className="text-sm text-gray-400 mb-4">{t('requests.proposeHint')}</p>
        <form onSubmit={submitProposal} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('requests.form.name')}</label>
            <input
              className={inputCls}
              value={form.proposedName}
              onChange={(e) => setForm({ ...form, proposedName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('requests.form.message')}</label>
            <textarea
              className={`${inputCls} min-h-[90px] resize-y`}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" type="submit" disabled={submitting}>
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
