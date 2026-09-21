'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, X, Eye, MessageSquare, Inbox, Plus, ExternalLink } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { fadeUp, stagger, still } from '@/lib/motion';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Skeleton,
  StatCard,
  Tabs,
  Textarea,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const STATUSES = ['pending', 'in_review', 'approved', 'rejected'] as const;

const statusVariant: Record<string, string> = {
  pending: 'outline',
  in_review: 'neon',
  approved: 'green',
  rejected: 'red',
};

/** Card edge colour per status (mirrors the badge). */
const statusAccent: Record<string, 'cyan' | 'green' | 'red' | undefined> = {
  in_review: 'cyan',
  approved: 'green',
  rejected: 'red',
};

export default function AdminRequestsPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [acting, setActing] = useState<string | null>(null);

  const [contact, setContact] = useState<any | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  // Team creation modal (from a request)
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

  // Accept: mark as approved then open the prefilled creation modal.
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

  // Counts of the currently loaded list (the API already filters by status).
  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, in_review: 0, approved: 0, rejected: 0 };
    requests.forEach((r) => {
      if (r.status in c) c[r.status] += 1;
    });
    return c;
  }, [requests]);

  const tabs = [
    { id: '', label: t('requests.filterAll') },
    ...STATUSES.map((s) => ({ id: s, label: t('requests.status.' + s) })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Inbox size={28} />}
        eyebrow={t('nav.section.community')}
        title={t('requests.title')}
        variant="blue"
      />

      {!loading && filter === '' && requests.length > 0 && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label={t('requests.status.pending')} value={counts.pending} accent="gold" />
          <StatCard label={t('requests.status.in_review')} value={counts.in_review} accent="cyan" />
          <StatCard label={t('requests.status.approved')} value={counts.approved} accent="green" />
          <StatCard label={t('requests.status.rejected')} value={counts.rejected} accent="red" />
        </div>
      )}

      <div className="overflow-x-auto whitespace-nowrap">
        <Tabs variant="underline" tabs={tabs} active={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="!p-4">
              <div className="flex items-start gap-3">
                <Skeleton circle className="h-12 w-12 shrink-0" />
                <Skeleton lines={3} className="flex-1" />
              </div>
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState icon={<Inbox size={28} />} title={t('requests.none')} />
      ) : (
        <motion.div
          className="space-y-3"
          variants={reduce ? still : stagger()}
          initial="hidden"
          animate="visible"
        >
          {requests.map((r) => {
            const requester = r.requester;
            const name = requester?.displayName || requester?.username || '—';
            return (
              <motion.div key={r.id} variants={reduce ? still : fadeUp}>
                <Card hover={false} accent={statusAccent[r.status]} className="!p-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={name}
                      src={requester?.avatar ? avatarSrc(requester.avatar, 64) : undefined}
                      size="lg"
                      className="shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm text-ink-2">{name}</p>
                        <Badge variant={statusVariant[r.status] || 'default'} size="sm">
                          {t('requests.status.' + r.status)}
                        </Badge>
                      </div>

                      <p className="mt-0.5 font-display text-base font-bold tracking-tight2 text-ink-1">
                        {r.proposedName}
                      </p>

                      {r.message && (
                        <p className="mt-1 whitespace-pre-line break-words text-sm text-ink-2">{r.message}</p>
                      )}

                      <p className="mt-1 text-xs text-ink-3 num">{new Date(r.createdAt).toLocaleString()}</p>

                      <div className="mt-3 flex flex-wrap gap-2">
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
        </motion.div>
      )}

      <Modal
        open={!!contact}
        onClose={closeContact}
        closeLabel={t('common.close')}
        icon={<MessageSquare size={20} />}
        title={`${t('messages.newMessageTo')} ${
          contact?.requester?.displayName || contact?.requester?.username || ''
        }`}
      >
        <form onSubmit={sendMessage} className="space-y-3">
          <Input label={t('messages.subject')} value={subject} onChange={(e: any) => setSubject(e.target.value)} />
          <Textarea
            label={t('messages.body')}
            rows={5}
            value={body}
            onChange={(e: any) => setBody(e.target.value)}
            required
          />
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
        icon={<Plus size={20} />}
        headerVariant="gradient"
      >
        {createReq?.requester && (
          <p className="mb-4 text-sm text-ink-2">
            {t('admin.teams.fromRequest')}{' '}
            <span className="font-medium text-ink-1">
              {createReq.requester.displayName || createReq.requester.username}
            </span>
          </p>
        )}
        <form onSubmit={submitCreate} className="space-y-3">
          <Input
            label={t('admin.esport.teamName')}
            value={createForm.name}
            onChange={(e: any) => setCreateForm({ ...createForm, name: e.target.value })}
            required
          />
          <Input
            label={t('admin.esport.teamImage')}
            value={createForm.image}
            onChange={(e: any) => setCreateForm({ ...createForm, image: e.target.value })}
          />
          <Textarea
            label={t('admin.esport.teamDesc')}
            value={createForm.description}
            onChange={(e: any) => setCreateForm({ ...createForm, description: e.target.value })}
          />
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
