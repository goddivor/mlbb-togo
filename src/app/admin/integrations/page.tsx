'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Bot, Cloud, FlaskConical, Plug, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  api,
  type IntegrationName,
  type IntegrationTestResult,
  type IntegrationsStatus,
} from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { fadeUp, stagger, still } from '@/lib/motion';
import { Badge, Button, Card, Input, LoadingSpinner, PageHeader } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { invalidateMediaConfig } from '@/components/ui/ImageUpload';

type Meta = IntegrationsStatus['anthropic'] | IntegrationsStatus['cloudinary'];
type Form = Record<string, string>;

const EMPTY_ANTHROPIC: Form = { apiKey: '', model: '' };
const EMPTY_CLOUDINARY: Form = { cloudName: '', apiKey: '', apiSecret: '', folder: '' };

/** Fields never pre-filled nor sent unless typed (write-only secrets). */
const SECRETS: Record<IntegrationName, string[]> = {
  anthropic: ['apiKey'],
  cloudinary: ['apiKey', 'apiSecret'],
};

function formsFrom(s: IntegrationsStatus): Record<IntegrationName, Form> {
  return {
    anthropic: { ...EMPTY_ANTHROPIC, model: s.anthropic.storedModel ?? '' },
    cloudinary: {
      ...EMPTY_CLOUDINARY,
      // Only stored values: an env fallback shows as placeholder, so saving
      // the form never copies it into the database.
      cloudName: s.cloudinary.storedCloudName ?? '',
      folder: s.cloudinary.storedFolder ?? '',
    },
  };
}

/** Admin page: third-party credentials (AI, Cloudinary) set without redeploying. */
export default function AdminIntegrationsPage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<IntegrationsStatus | null>(null);
  const [forms, setForms] = useState<Record<IntegrationName, Form>>({
    anthropic: EMPTY_ANTHROPIC,
    cloudinary: EMPTY_CLOUDINARY,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<{ name: IntegrationName; action: 'save' | 'test' | 'remove' } | null>(null);
  const [toRemove, setToRemove] = useState<IntegrationName | null>(null);

  const apply = useCallback((s: IntegrationsStatus) => {
    setStatus(s);
    setForms(formsFrom(s));
  }, []);

  useEffect(() => {
    api.admin.integrations
      .status()
      .then(apply)
      .catch((e: any) => toast.error(e?.message || t('common.error')))
      .finally(() => setLoading(false));
  }, [apply, t]);

  const setField = (name: IntegrationName, field: string, value: string) =>
    setForms((f) => ({ ...f, [name]: { ...f[name], [field]: value } }));

  const save = async (name: IntegrationName) => {
    const body: Record<string, string> = {};
    for (const [field, value] of Object.entries(forms[name])) {
      // Untouched secret inputs are left out: the stored secret is kept.
      if (SECRETS[name].includes(field) && !value.trim()) continue;
      body[field] = value.trim();
    }
    setBusy({ name, action: 'save' });
    try {
      apply(await api.admin.integrations.update(name, body));
      if (name === 'cloudinary') invalidateMediaConfig();
      toast.success(t('admin.integrations.saved'));
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  const testMessage = (r: IntegrationTestResult) => {
    const key = `admin.integrations.test.${r.code}`;
    const text = t(key);
    return text === key ? r.message : text;
  };

  const runTest = async (name: IntegrationName) => {
    setBusy({ name, action: 'test' });
    try {
      const r = await api.admin.integrations.test(name);
      if (r.ok) toast.success(r.detail ? `${testMessage(r)} (${r.detail})` : testMessage(r));
      else toast.error(testMessage(r));
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  const runRemove = async () => {
    if (!toRemove) return;
    const name = toRemove;
    setBusy({ name, action: 'remove' });
    try {
      apply(await api.admin.integrations.remove(name));
      if (name === 'cloudinary') invalidateMediaConfig();
      toast.success(t('admin.integrations.removed'));
      setToRemove(null);
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

  const isBusy = (name: IntegrationName, action: 'save' | 'test' | 'remove') =>
    busy?.name === name && busy.action === action;

  const renderCard = (
    name: IntegrationName,
    icon: React.ReactNode,
    meta: Meta,
    fields: React.ReactNode,
  ) => (
    <motion.div variants={reduce ? still : fadeUp}>
      <Card className="flex h-full flex-col gap-5">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary cut-corners-sm">
              {icon}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-ink-1">{t(`admin.integrations.${name}.title`)}</h2>
              <p className="text-sm text-ink-3">{t(`admin.integrations.${name}.desc`)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.configured ? 'green' : 'default'} size="sm" dot>
              {t(meta.configured ? 'admin.integrations.configured' : 'admin.integrations.notConfigured')}
            </Badge>
            {meta.source && (
              <Badge variant="outline" size="sm">
                {t(meta.source === 'db' ? 'admin.integrations.source.db' : 'admin.integrations.source.env')}
              </Badge>
            )}
          </div>
        </div>

        {meta.unreadable && (
          <p className="flex items-start gap-2 rounded border border-accent-gold/30 bg-accent-gold/10 p-3 text-sm text-accent-gold">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {t('admin.integrations.unreadable')}
          </p>
        )}

        <div className="space-y-4">{fields}</div>

        <div className="mt-auto space-y-3 border-t border-line-subtle pt-4">
          {meta.updatedAt && (
            <p className="text-xs text-ink-3">
              {t('admin.integrations.updated', {
                date: formatDate(meta.updatedAt),
                user: meta.updatedBy ?? '?',
              })}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => save(name)}
              loading={isBusy(name, 'save')}
              disabled={!!busy || !status?.encryptionReady}
            >
              <Save size={14} />
              {t('admin.integrations.save')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => runTest(name)}
              loading={isBusy(name, 'test')}
              disabled={!!busy || !meta.configured}
              title={t('admin.integrations.testHint')}
            >
              <FlaskConical size={14} />
              {t('admin.integrations.test')}
            </Button>
            {meta.stored && (
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={() => setToRemove(name)}
                disabled={!!busy}
              >
                <Trash2 size={14} className="text-accent-red" />
                <span className="text-accent-red">{t('admin.integrations.remove')}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const secretPlaceholder = (hint: string | null, fallback: string) => hint ?? fallback;

  const keepHint = (show: boolean) =>
    show ? <p className="-mt-2 text-xs text-ink-3">{t('admin.integrations.keepSecret')}</p> : null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Plug size={28} />}
        eyebrow={t('nav.section.system')}
        title={t('admin.integrations.title')}
        subtitle={t('admin.integrations.subtitle')}
        variant="purple"
      />

      {status && !status.encryptionReady && (
        <Card className="flex items-start gap-3 border-accent-red/40 !p-4">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-accent-red" />
          <p className="text-sm text-ink-2">{t('admin.integrations.noEncryption')}</p>
        </Card>
      )}

      {loading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : !status ? null : (
        <motion.div
          variants={reduce ? still : stagger()}
          initial="hidden"
          animate="visible"
          className="grid gap-6 lg:grid-cols-2"
        >
          {renderCard(
            'anthropic',
            <Bot size={22} />,
            status.anthropic,
            <>
              <Input
                label={t('admin.integrations.apiKey')}
                type="password"
                autoComplete="new-password"
                value={forms.anthropic.apiKey}
                onChange={(e: any) => setField('anthropic', 'apiKey', e.target.value)}
                placeholder={secretPlaceholder(status.anthropic.apiKeyHint, 'sk-ant-…')}
              />
              {keepHint(!!status.anthropic.apiKeyHint)}
              <div>
                <Input
                  label={t('admin.integrations.model')}
                  value={forms.anthropic.model}
                  onChange={(e: any) => setField('anthropic', 'model', e.target.value)}
                  placeholder={status.anthropic.defaultModel}
                />
                <p className="mt-1.5 text-xs text-ink-3">
                  {t('admin.integrations.modelHint', {
                    model: status.anthropic.model,
                    default: status.anthropic.defaultModel,
                  })}
                </p>
              </div>
            </>,
          )}

          {renderCard(
            'cloudinary',
            <Cloud size={22} />,
            status.cloudinary,
            <>
              <Input
                label={t('admin.integrations.cloudName')}
                value={forms.cloudinary.cloudName}
                onChange={(e: any) => setField('cloudinary', 'cloudName', e.target.value)}
                placeholder={status.cloudinary.cloudName ?? 'my-cloud'}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={t('admin.integrations.apiKey')}
                  type="password"
                  autoComplete="new-password"
                  value={forms.cloudinary.apiKey}
                  onChange={(e: any) => setField('cloudinary', 'apiKey', e.target.value)}
                  placeholder={secretPlaceholder(status.cloudinary.apiKeyHint, 'api-key')}
                />
                <Input
                  label={t('admin.integrations.apiSecret')}
                  type="password"
                  autoComplete="new-password"
                  value={forms.cloudinary.apiSecret}
                  onChange={(e: any) => setField('cloudinary', 'apiSecret', e.target.value)}
                  placeholder={secretPlaceholder(status.cloudinary.apiSecretHint, '••••••••')}
                />
              </div>
              {keepHint(!!(status.cloudinary.apiKeyHint || status.cloudinary.apiSecretHint))}
              <Input
                label={t('admin.integrations.folder')}
                value={forms.cloudinary.folder}
                onChange={(e: any) => setField('cloudinary', 'folder', e.target.value)}
                placeholder={status.cloudinary.folder ?? 'mlbb-togo'}
              />
            </>,
          )}
        </motion.div>
      )}

      {status && (
        <p className="text-xs text-ink-3">{t('admin.integrations.footnote')}</p>
      )}

      <ConfirmModal
        open={!!toRemove}
        onClose={() => setToRemove(null)}
        onConfirm={runRemove}
        loading={!!toRemove && isBusy(toRemove, 'remove')}
        variant="danger"
        title={t('admin.integrations.removeTitle')}
        message={toRemove ? t('admin.integrations.removeWarn', { name: t(`admin.integrations.${toRemove}.title`) }) : ''}
        confirmLabel={t('admin.integrations.remove')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
