'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Megaphone, Send } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, Button } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import RoleIcon from '@/components/game/RoleIcon';
import RoleSelect from '@/components/game/RoleSelect';
import toast from 'react-hot-toast';

const LANES = ['roam', 'jungle', 'mid', 'exp', 'gold'];
const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-blue';

export default function RecruitmentPage() {
  const t = useT();
  const [role, setRole] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [apply, setApply] = useState<any | null>(null);
  const [applyForm, setApplyForm] = useState({ role: '', message: '' });
  const [sending, setSending] = useState(false);

  const load = async (r: string) => {
    try {
      const [list, mine] = await Promise.all([api.recruitment.listOpen(r || undefined), api.recruitment.mine()]);
      setCampaigns(Array.isArray(list) ? list : []);
      setAppliedIds(
        new Set(
          (Array.isArray(mine) ? mine : [])
            .filter((a: any) => a.status === 'pending')
            .map((a: any) => a.recruitmentId),
        ),
      );
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load(role);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const openApply = (c: any) => {
    setApply(c);
    setApplyForm({ role: c.slots?.[0]?.role || '', message: '' });
  };

  const submitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apply) return;
    setSending(true);
    try {
      await api.recruitment.apply(apply.id, { role: applyForm.role || undefined, message: applyForm.message.trim() || undefined });
      toast.success(t('recruitment.applySent'));
      setAppliedIds((prev) => new Set(prev).add(apply.id));
      setApply(null);
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const slotRoles = useMemo(() => (apply?.slots || []).map((s: any) => s.role), [apply]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Megaphone size={22} className="text-neon-blue" />
        <h1 className="text-2xl font-bold text-white">{t('recruitment.title')}</h1>
      </div>
      <p className="text-sm text-gray-400 mb-6">{t('recruitment.subtitle')}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setRole('')}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${role === '' ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/30' : 'bg-gaming-surface text-gray-400 border-gaming-border hover:text-gray-200'}`}
        >
          {t('recruitment.filterAll')}
        </button>
        {LANES.map((l) => (
          <button
            key={l}
            onClick={() => setRole(l)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${role === l ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/30' : 'bg-gaming-surface text-gray-400 border-gaming-border hover:text-gray-200'}`}
          >
            <RoleIcon role={l} size={14} /> {t('lane.' + l)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-500">{t('recruitment.none')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c, i) => {
            const team = c.team || {};
            const applied = appliedIds.has(c.id);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="rounded-xl border border-gaming-border bg-gaming-surface/40 p-4 flex flex-col"
              >
                <Link href={`/teams/${c.teamId}`} className="flex items-center gap-3 mb-3">
                  {team.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={team.image} alt={team.name} referrerPolicy="no-referrer" className="w-11 h-11 rounded-full object-cover border border-gaming-border" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center font-bold text-white">
                      {team.name?.[0]?.toUpperCase() || 'T'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                    <p className="text-xs text-gray-500">{t('recruitment.recruits')}</p>
                  </div>
                </Link>

                <div className="flex flex-wrap gap-2 mb-3">
                  {(c.slots || []).map((s: any) => (
                    <Badge key={s.role} variant="purple" size="md" className="gap-1">
                      <RoleIcon role={s.role} size={14} /> {t('lane.' + s.role)}
                      {s.quantity > 1 && <span className="ml-0.5 opacity-80">×{s.quantity}</span>}
                    </Badge>
                  ))}
                </div>

                {c.message && <p className="text-sm text-gray-400 mb-3 whitespace-pre-line">{c.message}</p>}

                <div className="mt-auto">
                  {applied ? (
                    <span className="text-xs text-gray-400">{t('recruitment.applied')}</span>
                  ) : (
                    <Button size="sm" onClick={() => openApply(c)}>
                      <Send size={14} /> {t('recruitment.apply')}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={!!apply} onClose={() => setApply(null)} closeLabel={t('common.close')} title={`${t('recruitment.applyTitle')} · ${apply?.team?.name || ''}`}>
        <form onSubmit={submitApply} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('recruitment.applyRole')}</label>
            <RoleSelect
              value={applyForm.role}
              onChange={(v) => setApplyForm({ ...applyForm, role: v })}
              options={slotRoles.length ? slotRoles : LANES}
              noneLabel={t('admin.esport.noRole')}
              labelFor={(l) => t('lane.' + l)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('recruitment.applyMessage')}</label>
            <textarea className={`${inputCls} min-h-[80px] resize-y`} value={applyForm.message} onChange={(e) => setApplyForm({ ...applyForm, message: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" disabled={sending}>
              <Send size={15} /> {t('recruitment.applySubmit')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setApply(null)}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
