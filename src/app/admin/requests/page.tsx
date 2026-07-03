'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, Eye, MessageSquare, Inbox, Plus, ExternalLink } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, Badge, Button } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-blue';

const STATUSES = ['pending', 'in_review', 'approved', 'rejected'] as const;

const statusVariant: Record<string, string> = {
  pending: 'default',
  in_review: 'neon',
  approved: 'green',
  rejected: 'red',
};

export default function AdminRequestsPage() {
  const t = useT();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [acting, setActing] = useState<string | null>(null);

  const [contact, setContact] = useState<any | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  // Modal de création d'équipe (depuis une demande)
  const [createReq, setCreateReq] = useState<any | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', image: '', description: '' });
  const [creating, setCreating] = useState(false);

  const errMsg = (e: any) => e?.message || t('admin.esport.errorGeneric');

  const load = async (status: string) => {
    try {
      const data = await api.teamRequests.list(status || undefined);
      setRequests(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load(filter);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const changeStatus = async (r: any, status: string) => {
    setActing(r.id + status);
    try {
      await api.teamRequests.setStatus(r.id, status);
      toast.success(t('admin.esport.saved'));
      await load(filter);
    } catch (e: any) {
      toast.error(errMsg(e));
    } finally {
      setActing(null);
    }
  };

  const openCreate = (r: any) => {
    setCreateReq(r);
    setCreateForm({ name: r.proposedName || '', image: '', description: '' });
  };

  // Accepter : on marque approuvée puis on ouvre le modal de création prérempli.
  const approveAndCreate = async (r: any) => {
    setActing(r.id + 'approved');
    try {
      await api.teamRequests.setStatus(r.id, 'approved');
      await load(filter);
    } catch (e: any) {
      toast.error(errMsg(e));
    } finally {
      setActing(null);
    }
    openCreate(r);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createReq || !createForm.name.trim()) return;
    setCreating(true);
    try {
      await api.esport.createTeam({
        name: createForm.name.trim(),
        image: createForm.image.trim() || undefined,
        description: createForm.description.trim() || undefined,
        type: 'community',
        requestId: createReq.id,
      });
      toast.success(t('admin.esport.saved'));
      setCreateReq(null);
      await load(filter);
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setCreating(false);
    }
  };

  const openContact = (r: any) => {
    setContact(r);
    setSubject(r?.proposedName || '');
    setBody('');
  };

  const closeContact = () => {
    setContact(null);
    setSubject('');
    setBody('');
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact?.requester?.id || !body.trim()) return;
    setSending(true);
    try {
      await api.messages.startThread({
        userId: contact.requester.id,
        requestId: contact.id,
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      toast.success(t('messages.sent'));
      closeContact();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Inbox size={22} className="text-neon-blue" />
        <h1 className="text-2xl font-bold text-white">{t('requests.title')}</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
            filter === ''
              ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/30'
              : 'bg-gaming-surface text-gray-400 border-gaming-border hover:text-gray-200'
          }`}
        >
          {t('requests.filterAll')}
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              filter === s
                ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/30'
                : 'bg-gaming-surface text-gray-400 border-gaming-border hover:text-gray-200'
            }`}
          >
            {t('requests.status.' + s)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-500">{t('requests.none')}</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r, i) => {
            const requester = r.requester;
            const name = requester?.displayName || requester?.username || '—';
            const initial = (name || '?').charAt(0).toUpperCase();
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Card hover={false} className="!p-4">
                  <div className="flex items-start gap-3">
                    {requester?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc(requester.avatar, 64)}
                        alt={name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover bg-gaming-surface border border-gaming-border shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gaming-surface border border-gaming-border shrink-0 flex items-center justify-center text-sm font-bold text-gray-300">
                        {initial}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-400 truncate">{name}</p>
                        <Badge variant={statusVariant[r.status] || 'default'} size="sm">
                          {t('requests.status.' + r.status)}
                        </Badge>
                      </div>

                      <p className="text-base font-semibold text-white mt-0.5">
                        {r.proposedName}
                      </p>

                      {r.message && (
                        <p className="text-sm text-gray-400 mt-1 whitespace-pre-line break-words">{r.message}</p>
                      )}

                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(r.createdAt).toLocaleString()}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {(r.status === 'pending' || r.status === 'in_review') && (
                          <>
                            {r.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={acting === r.id + 'in_review'}
                                onClick={() => changeStatus(r, 'in_review')}
                              >
                                <Eye size={14} /> {t('requests.markReview')}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              disabled={acting === r.id + 'approved'}
                              onClick={() => approveAndCreate(r)}
                            >
                              <Check size={14} /> {t('requests.approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={acting === r.id + 'rejected'}
                              onClick={() => changeStatus(r, 'rejected')}
                            >
                              <X size={14} /> {t('requests.reject')}
                            </Button>
                          </>
                        )}
                        {r.status === 'approved' &&
                          (r.createdTeamId ? (
                            <Link href={`/teams/${r.createdTeamId}`}>
                              <Button size="sm" variant="secondary">
                                <ExternalLink size={14} /> {t('requests.viewTeam')}
                              </Button>
                            </Link>
                          ) : (
                            <Button size="sm" onClick={() => openCreate(r)}>
                              <Plus size={14} /> {t('requests.createTeam')}
                            </Button>
                          ))}
                        {requester?.id && (
                          <Button size="sm" variant="ghost" onClick={() => openContact(r)}>
                            <MessageSquare size={14} /> {t('requests.contact')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!contact}
        onClose={closeContact}
        closeLabel={t('common.close')}
        title={`${t('messages.newMessageTo')} ${
          contact?.requester?.displayName || contact?.requester?.username || ''
        }`}
      >
        <form onSubmit={sendMessage} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('messages.subject')}</label>
            <input
              className={inputCls}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('messages.body')}</label>
            <textarea
              className={inputCls}
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" type="submit" disabled={sending || !body.trim()}>
              <MessageSquare size={16} /> {t('messages.send')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={closeContact}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!createReq}
        onClose={() => setCreateReq(null)}
        closeLabel={t('common.close')}
        title={t('admin.teams.createTitle')}
      >
        {createReq?.requester && (
          <p className="text-sm text-gray-400 mb-4">
            {t('admin.teams.fromRequest')}{' '}
            <span className="text-gray-200 font-medium">
              {createReq.requester.displayName || createReq.requester.username}
            </span>
          </p>
        )}
        <form onSubmit={submitCreate} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.teamName')}</label>
            <input
              className={inputCls}
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.teamImage')}</label>
            <input
              className={inputCls}
              value={createForm.image}
              onChange={(e) => setCreateForm({ ...createForm, image: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('admin.esport.teamDesc')}</label>
            <textarea
              className={`${inputCls} min-h-[80px] resize-y`}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" type="submit" disabled={creating || !createForm.name.trim()}>
              <Check size={16} /> {t('admin.esport.create')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setCreateReq(null)}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
