'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  ExternalLink,
  Handshake,
  Package,
  Inbox,
  Mail,
  Phone,
  Star,
  EyeOff,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, Badge, Button, PageHeader, EmptyState, LoadingSpinner, Tabs } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';

type Tab = 'sponsors' | 'offers' | 'requests';
type Tier = 'title' | 'gold' | 'silver' | 'partner';

const TIERS: Tier[] = ['title', 'gold', 'silver', 'partner'];
const REQUEST_STATUSES = ['new', 'contacted', 'accepted', 'declined'] as const;

const tierVariant: Record<Tier, string> = { title: 'gold', gold: 'gold', silver: 'default', partner: 'blue' };
const statusVariant: Record<string, string> = { new: 'neon', contacted: 'gold', accepted: 'green', declined: 'red' };

type SponsorForm = {
  logo: string;
  name: string;
  url: string;
  description: string;
  tier: Tier | '';
  seasonIds: string[];
  isActive: boolean;
  sort: number;
};
const emptySponsor: SponsorForm = { logo: '', name: '', url: '', description: '', tier: '', seasonIds: [], isActive: true, sort: 0 };

type OfferForm = {
  name: string;
  tier: Tier | '';
  priceLabel: string;
  benefits: string;
  highlight: boolean;
  isActive: boolean;
  sort: number;
};
const emptyOffer: OfferForm = { name: '', tier: '', priceLabel: '', benefits: '', highlight: false, isActive: true, sort: 0 };

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';
const labelCls = 'block text-xs text-body dark:text-bodydark mb-1';

export default function AdminSponsorsPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('sponsors');
  const [loading, setLoading] = useState(true);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [requestFilter, setRequestFilter] = useState('');

  // Sponsor modal
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [sponsorId, setSponsorId] = useState<string | null>(null);
  const [sponsorForm, setSponsorForm] = useState<SponsorForm>(emptySponsor);
  // Offer modal
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState<OfferForm>(emptyOffer);
  // Request detail modal
  const [request, setRequest] = useState<any | null>(null);
  const [note, setNote] = useState('');

  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<{ kind: 'sponsor' | 'offer' | 'request'; id: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const errMsg = (e: any) => e?.message || t('admin.esport.errorGeneric');

  const loadSponsors = async () => {
    try {
      const data = await api.sponsors.all();
      setSponsors(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };
  const loadOffers = async () => {
    try {
      const data = await api.sponsors.allOffers();
      setOffers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };
  const loadRequests = async (status = requestFilter) => {
    try {
      const data = await api.sponsors.requests(status || undefined);
      setRequests(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };

  useEffect(() => {
    // Deep link from the admin notification: /admin/sponsors?tab=requests
    const wanted = new URLSearchParams(window.location.search).get('tab');
    if (wanted === 'offers' || wanted === 'requests') setTab(wanted);
    (async () => {
      setLoading(true);
      await Promise.all([
        loadSponsors(),
        loadOffers(),
        loadRequests(''),
        api.esport
          .seasons()
          .then((s: any) => setSeasons(Array.isArray(s) ? s : []))
          .catch(() => {}),
      ]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Sponsors -----

  const openSponsor = (s?: any) => {
    setSponsorId(s?.id ?? null);
    setSponsorForm(
      s
        ? {
            logo: s.logo || '',
            name: s.name || '',
            url: s.url || '',
            description: s.description || '',
            tier: s.tier || '',
            seasonIds: Array.isArray(s.seasonIds) ? s.seasonIds : [],
            isActive: s.isActive !== false,
            sort: s.sort ?? 0,
          }
        : emptySponsor,
    );
    setSponsorOpen(true);
  };

  const submitSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorForm.logo.trim()) return;
    setSaving(true);
    try {
      const payload = {
        logo: sponsorForm.logo.trim(),
        name: sponsorForm.name.trim() || null,
        url: sponsorForm.url.trim() || null,
        description: sponsorForm.description.trim() || null,
        tier: sponsorForm.tier || null,
        seasonIds: sponsorForm.seasonIds,
        isActive: sponsorForm.isActive,
        sort: Number(sponsorForm.sort) || 0,
      };
      if (sponsorId) await api.esport.updateSponsor(sponsorId, payload);
      else await api.esport.createSponsor(payload);
      toast.success(t('admin.esport.saved'));
      setSponsorOpen(false);
      await loadSponsors();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleSeason = (id: string) =>
    setSponsorForm((f) => ({
      ...f,
      seasonIds: f.seasonIds.includes(id) ? f.seasonIds.filter((x) => x !== id) : [...f.seasonIds, id],
    }));

  // ----- Offers -----

  const openOffer = (o?: any) => {
    setOfferId(o?.id ?? null);
    setOfferForm(
      o
        ? {
            name: o.name || '',
            tier: o.tier || '',
            priceLabel: o.priceLabel || '',
            benefits: (o.benefits || []).join('\n'),
            highlight: !!o.highlight,
            isActive: o.isActive !== false,
            sort: o.sort ?? 0,
          }
        : emptyOffer,
    );
    setOfferOpen(true);
  };

  const submitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offerForm.name.trim().length < 2) return;
    setSaving(true);
    try {
      const payload = {
        name: offerForm.name.trim(),
        tier: offerForm.tier || undefined,
        priceLabel: offerForm.priceLabel.trim() || undefined,
        benefits: offerForm.benefits
          .split('\n')
          .map((b) => b.trim())
          .filter(Boolean),
        highlight: offerForm.highlight,
        isActive: offerForm.isActive,
        sort: Number(offerForm.sort) || 0,
      };
      if (offerId) await api.sponsors.updateOffer(offerId, { ...payload, tier: offerForm.tier || '' });
      else await api.sponsors.createOffer(payload);
      toast.success(t('admin.esport.saved'));
      setOfferOpen(false);
      await loadOffers();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  // ----- Requests -----

  const openRequest = (r: any) => {
    setRequest(r);
    setNote(r.adminNote || '');
  };

  const setStatus = async (r: any, status: string) => {
    try {
      await api.sponsors.updateRequest(r.id, { status });
      toast.success(t('admin.esport.saved'));
      await loadRequests();
      if (request?.id === r.id) setRequest({ ...r, status });
    } catch (err: any) {
      toast.error(errMsg(err));
    }
  };

  const saveNote = async () => {
    if (!request) return;
    setSaving(true);
    try {
      await api.sponsors.updateRequest(request.id, { adminNote: note });
      toast.success(t('admin.esport.saved'));
      await loadRequests();
      setRequest(null);
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const changeFilter = async (status: string) => {
    setRequestFilter(status);
    await loadRequests(status);
  };

  // ----- Delete -----

  const confirmDelete = async () => {
    if (!pending) return;
    setConfirming(true);
    try {
      if (pending.kind === 'sponsor') await api.esport.deleteSponsor(pending.id);
      else if (pending.kind === 'offer') await api.sponsors.deleteOffer(pending.id);
      else await api.sponsors.deleteRequest(pending.id);
      toast.success(t('admin.esport.deleted'));
      if (pending.kind === 'sponsor') await loadSponsors();
      else if (pending.kind === 'offer') await loadOffers();
      else {
        await loadRequests();
        setRequest(null);
      }
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setConfirming(false);
      setPending(null);
    }
  };

  const seasonName = (id: string) => {
    const s = seasons.find((x) => x.id === id);
    return s ? (s.number ? `S${s.number}` : s.name) : '?';
  };

  const newCount = requests.filter((r) => r.status === 'new').length;

  const tabs = [
    { id: 'sponsors', label: t('admin.sponsors.tab.sponsors'), icon: Handshake },
    { id: 'offers', label: t('admin.sponsors.tab.offers'), icon: Package },
    { id: 'requests', label: `${t('admin.sponsors.tab.requests')}${newCount ? ` (${newCount})` : ''}`, icon: Inbox },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Handshake size={28} />}
        title={t('admin.sponsors.title')}
        subtitle={t('admin.sponsors.subtitle')}
        variant="gold"
        action={
          tab === 'sponsors' ? (
            <Button size="sm" onClick={() => openSponsor()}>
              <Plus size={16} /> {t('admin.esport.newSponsor')}
            </Button>
          ) : tab === 'offers' ? (
            <Button size="sm" onClick={() => openOffer()}>
              <Plus size={16} /> {t('admin.sponsors.newOffer')}
            </Button>
          ) : null
        }
      />

      <Tabs tabs={tabs} active={tab} onChange={(id: Tab) => setTab(id)} />

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : tab === 'sponsors' ? (
        sponsors.length === 0 ? (
          <EmptyState icon={<Handshake size={28} />} title={t('admin.esport.noSponsors')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sponsors.map((s) => (
              <Card key={s.id} hover={false} className={`!p-3 flex items-start gap-3 ${s.isActive === false ? 'opacity-60' : ''}`}>
                {s.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.logo}
                    alt={s.name || 'sponsor'}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-lg object-contain bg-gray-2 border border-stroke shrink-0 dark:bg-meta-4 dark:border-strokedark"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-2 border border-stroke shrink-0 dark:bg-meta-4 dark:border-strokedark" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-black dark:text-white truncate">{s.name || '—'}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant={tierVariant[(s.tier as Tier) || 'partner']} size="sm">
                      {t(`sponsors.tier.${s.tier || 'partner'}`)}
                    </Badge>
                    {s.isActive === false && (
                      <Badge variant="red" size="sm">
                        <EyeOff size={11} /> {t('admin.sponsors.inactive')}
                      </Badge>
                    )}
                    {(s.seasonIds || []).map((id: string) => (
                      <Badge key={id} variant="default" size="sm">
                        {seasonName(id)}
                      </Badge>
                    ))}
                    {(!s.seasonIds || s.seasonIds.length === 0) && (
                      <Badge variant="default" size="sm">{t('admin.sponsors.allSeasons')}</Badge>
                    )}
                  </div>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary truncate hover:underline max-w-full"
                    >
                      <ExternalLink size={11} /> {s.url}
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openSponsor(s)}>
                    <Pencil size={14} />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setPending({ kind: 'sponsor', id: s.id })}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : tab === 'offers' ? (
        offers.length === 0 ? (
          <EmptyState icon={<Package size={28} />} title={t('admin.sponsors.noOffers')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {offers.map((o) => (
              <Card key={o.id} hover={false} className={`!p-4 flex flex-col gap-2 ${o.isActive === false ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black dark:text-white truncate">
                      {o.highlight && <Star size={13} className="inline mr-1 text-warning" />}
                      {o.name}
                    </p>
                    <p className="text-xs text-primary font-medium">{o.priceLabel || t('sponsors.offer.onQuote')}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openOffer(o)}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setPending({ kind: 'offer', id: o.id })}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {o.tier && (
                    <Badge variant={tierVariant[o.tier as Tier]} size="sm">{t(`sponsors.tier.${o.tier}`)}</Badge>
                  )}
                  {o.isActive === false && (
                    <Badge variant="red" size="sm">
                      <EyeOff size={11} /> {t('admin.sponsors.inactive')}
                    </Badge>
                  )}
                </div>
                <ul className="text-xs text-body dark:text-bodydark space-y-0.5">
                  {(o.benefits || []).map((b: string) => (
                    <li key={b} className="flex gap-1.5">
                      <Check size={12} className="mt-0.5 shrink-0 text-success" /> {b}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={requestFilter === '' ? 'primary' : 'ghost'} onClick={() => changeFilter('')}>
              {t('admin.sponsors.status.all')}
            </Button>
            {REQUEST_STATUSES.map((s) => (
              <Button key={s} size="sm" variant={requestFilter === s ? 'primary' : 'ghost'} onClick={() => changeFilter(s)}>
                {t(`admin.sponsors.status.${s}`)}
              </Button>
            ))}
          </div>
          {requests.length === 0 ? (
            <EmptyState icon={<Inbox size={28} />} title={t('admin.sponsors.noRequests')} />
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <Card key={r.id} hover={false} className="!p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-black dark:text-white">{r.company}</p>
                      <Badge variant={statusVariant[r.status] || 'default'} size="sm">
                        {t(`admin.sponsors.status.${r.status}`)}
                      </Badge>
                      {r.offer && <Badge variant="gold" size="sm">{r.offer.name}</Badge>}
                    </div>
                    <p className="text-xs text-body dark:text-bodydark mt-0.5">
                      {r.contactName} · {r.email}
                      {r.phone ? ` · ${r.phone}` : ''} · {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-body dark:text-bodydark mt-1 line-clamp-2">{r.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      className={`${inputCls} !w-auto`}
                      value={r.status}
                      onChange={(e) => setStatus(r, e.target.value)}
                    >
                      {REQUEST_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(`admin.sponsors.status.${s}`)}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" variant="ghost" onClick={() => openRequest(r)}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setPending({ kind: 'request', id: r.id })}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sponsor modal */}
      <Modal
        open={sponsorOpen}
        onClose={() => setSponsorOpen(false)}
        closeLabel={t('common.close')}
        title={sponsorId ? t('admin.esport.editSponsor') : t('admin.esport.newSponsor')}
        icon={<Handshake size={20} />}
        headerVariant={sponsorId ? 'plain' : 'gradient'}
      >
        <form onSubmit={submitSponsor} className="space-y-3">
          <div>
            <label className={labelCls}>{t('admin.esport.sponsorLogo')}</label>
            <input className={inputCls} value={sponsorForm.logo} onChange={(e) => setSponsorForm({ ...sponsorForm, logo: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('admin.esport.sponsorName')}</label>
              <input className={inputCls} value={sponsorForm.name} onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>{t('admin.esport.sponsorUrl')}</label>
              <input className={inputCls} value={sponsorForm.url} onChange={(e) => setSponsorForm({ ...sponsorForm, url: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('admin.sponsors.tier')}</label>
              <select className={inputCls} value={sponsorForm.tier} onChange={(e) => setSponsorForm({ ...sponsorForm, tier: e.target.value as Tier | '' })}>
                <option value="">{t('sponsors.tier.partner')}</option>
                {TIERS.filter((tier) => tier !== 'partner').map((tier) => (
                  <option key={tier} value={tier}>
                    {t(`sponsors.tier.${tier}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('admin.sponsors.sort')}</label>
              <input type="number" className={inputCls} value={sponsorForm.sort} onChange={(e) => setSponsorForm({ ...sponsorForm, sort: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t('admin.sponsors.description')}</label>
            <textarea rows={2} className={inputCls} value={sponsorForm.description} onChange={(e) => setSponsorForm({ ...sponsorForm, description: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>{t('admin.sponsors.seasons')}</label>
            {seasons.length === 0 ? (
              <p className="text-xs text-body dark:text-bodydark">{t('seasons.none')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {seasons.map((s) => {
                  const on = sponsorForm.seasonIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSeason(s.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        on
                          ? 'border-primary bg-primary text-white'
                          : 'border-stroke text-body hover:border-primary dark:border-strokedark dark:text-bodydark'
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-1 text-xs text-body dark:text-bodydark">{t('admin.sponsors.seasonsHint')}</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-black dark:text-white">
            <input type="checkbox" checked={sponsorForm.isActive} onChange={(e) => setSponsorForm({ ...sponsorForm, isActive: e.target.checked })} />
            {t('admin.sponsors.active')}
          </label>
          <div className="flex gap-2 pt-2">
            <Button size="sm" type="submit" disabled={saving}>
              <Check size={16} /> {sponsorId ? t('admin.esport.save') : t('admin.esport.create')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setSponsorOpen(false)}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Offer modal */}
      <Modal
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        closeLabel={t('common.close')}
        title={offerId ? t('admin.sponsors.editOffer') : t('admin.sponsors.newOffer')}
        icon={<Package size={20} />}
        headerVariant={offerId ? 'plain' : 'gradient'}
      >
        <form onSubmit={submitOffer} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('admin.sponsors.offerName')}</label>
              <input className={inputCls} value={offerForm.name} onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })} required minLength={2} />
            </div>
            <div>
              <label className={labelCls}>{t('admin.sponsors.priceLabel')}</label>
              <input className={inputCls} value={offerForm.priceLabel} onChange={(e) => setOfferForm({ ...offerForm, priceLabel: e.target.value })} placeholder={t('sponsors.offer.onQuote')} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('admin.sponsors.tier')}</label>
              <select className={inputCls} value={offerForm.tier} onChange={(e) => setOfferForm({ ...offerForm, tier: e.target.value as Tier | '' })}>
                <option value="">—</option>
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {t(`sponsors.tier.${tier}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('admin.sponsors.sort')}</label>
              <input type="number" className={inputCls} value={offerForm.sort} onChange={(e) => setOfferForm({ ...offerForm, sort: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t('admin.sponsors.benefits')}</label>
            <textarea rows={5} className={inputCls} value={offerForm.benefits} onChange={(e) => setOfferForm({ ...offerForm, benefits: e.target.value })} />
            <p className="mt-1 text-xs text-body dark:text-bodydark">{t('admin.sponsors.benefitsHint')}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-black dark:text-white">
              <input type="checkbox" checked={offerForm.highlight} onChange={(e) => setOfferForm({ ...offerForm, highlight: e.target.checked })} />
              {t('admin.sponsors.highlight')}
            </label>
            <label className="flex items-center gap-2 text-sm text-black dark:text-white">
              <input type="checkbox" checked={offerForm.isActive} onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.checked })} />
              {t('admin.sponsors.active')}
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" type="submit" disabled={saving}>
              <Check size={16} /> {offerId ? t('admin.esport.save') : t('admin.esport.create')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setOfferOpen(false)}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Request detail modal */}
      <Modal
        open={!!request}
        onClose={() => setRequest(null)}
        closeLabel={t('common.close')}
        title={request?.company || ''}
        icon={<Inbox size={20} />}
        headerVariant="plain"
      >
        {request && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant[request.status] || 'default'} size="sm">
                {t(`admin.sponsors.status.${request.status}`)}
              </Badge>
              {request.offer && <Badge variant="gold" size="sm">{request.offer.name}</Badge>}
              <span className="text-xs text-body dark:text-bodydark">{new Date(request.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-black dark:text-white font-medium">{request.contactName}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a href={`mailto:${request.email}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                <Mail size={14} /> {request.email}
              </a>
              {request.phone && (
                <a href={`tel:${request.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                  <Phone size={14} /> {request.phone}
                </a>
              )}
            </div>
            <p className="text-sm text-body dark:text-bodydark whitespace-pre-wrap rounded-lg bg-gray-2 p-3 dark:bg-meta-4">{request.message}</p>
            <div>
              <label className={labelCls}>{t('admin.sponsors.status.label')}</label>
              <select className={inputCls} value={request.status} onChange={(e) => setStatus(request, e.target.value)}>
                {REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`admin.sponsors.status.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('admin.sponsors.adminNote')}</label>
              <textarea rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={saveNote} disabled={saving}>
                <Check size={16} /> {t('admin.esport.save')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRequest(null)}>
                {t('admin.esport.cancel')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={confirmDelete}
        loading={confirming}
        danger
        title={t('admin.confirm.title')}
        message={
          pending?.kind === 'sponsor'
            ? t('admin.esport.deleteSponsorConfirm')
            : pending?.kind === 'offer'
              ? t('admin.sponsors.deleteOfferConfirm')
              : t('admin.sponsors.deleteRequestConfirm')
        }
        confirmLabel={t('admin.esport.delete')}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}
