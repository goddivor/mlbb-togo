'use client';

import { useEffect, useMemo, useState } from 'react';
import { Info, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Button, Input, Select, Textarea } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { FRAMES } from '@/components/game/frames';
import FrameThumb from '@/components/gamification/rewards/FrameThumb';
import { Segmented, localName } from '@/components/gamification/rewards/shared';
import { fromUtcInput, toUtcInput } from '@/lib/periods';
import {
  CONDITION_TYPES,
  SLUG,
  conditionDef,
  type AdminRewardEvent,
  type ConditionMode,
  type EventCondition,
} from './events';
import type { AdminAchievement } from './AchievementsTab';

interface Option {
  id: string;
  name: string;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  startsAt: string;
  endsAt: string;
  recurrence: 'none' | 'yearly';
  publish: boolean;
  conditionMode: ConditionMode;
  conditions: { type: string; count: string; scope: string }[];
  achievementId: string;
  frameId: string;
  frameDays: string;
  xp: string;
}

const EMPTY: FormState = {
  name: '',
  slug: '',
  description: '',
  startsAt: '',
  endsAt: '',
  recurrence: 'none',
  publish: false,
  conditionMode: 'all',
  conditions: [{ type: 'daily_login', count: '1', scope: '' }],
  achievementId: '',
  frameId: '',
  frameDays: '',
  xp: '',
};

function slugify(name: string) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function fromEvent(e: AdminRewardEvent): FormState {
  return {
    name: e.name,
    slug: e.slug,
    description: e.description ?? '',
    startsAt: toUtcInput(e.startsAt),
    endsAt: toUtcInput(e.endsAt),
    recurrence: e.recurrence === 'yearly' ? 'yearly' : 'none',
    publish: e.status !== 'draft',
    conditionMode: e.conditionMode === 'any' ? 'any' : 'all',
    conditions: (e.conditions ?? []).map((c) => ({ type: c.type, count: String(c.count ?? 1), scope: c.scope ?? '' })),
    achievementId: e.rewards?.achievementId ?? '',
    frameId: e.rewards?.frameId ?? '',
    frameDays: e.rewards?.frameDays ? String(e.rewards.frameDays) : '',
    xp: e.rewards?.xp ? String(e.rewards.xp) : '',
  };
}

/** Create / edit a reward event: window, conditions builder, rewards with frame preview. */
export default function EventFormModal({
  open,
  event,
  achievements,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** null = creation. */
  event: AdminRewardEvent | null;
  achievements: AdminAchievement[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tournaments, setTournaments] = useState<Option[]>([]);
  const [events, setEvents] = useState<Option[]>([]);

  useEffect(() => {
    if (!open) return;
    setForm(event ? fromEvent(event) : EMPTY);
    setSlugTouched(!!event);
  }, [open, event]);

  useEffect(() => {
    if (!open) return;
    Promise.all([api.tournaments.list(), api.draft.list(), api.events.list()]).then(([classic, drafts, evs]: any[]) => {
      setTournaments([
        ...(Array.isArray(classic) ? classic : []).map((x: any) => ({ id: x.id, name: x.name })),
        ...(Array.isArray(drafts) ? drafts : []).map((x: any) => ({ id: x.id, name: `${x.name} (draft)` })),
      ]);
      setEvents((Array.isArray(evs) ? evs : []).map((x: any) => ({ id: x.id, name: x.title ?? x.id })));
    });
  }, [open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setCond = (i: number, patch: Partial<FormState['conditions'][number]>) =>
    setForm((f) => ({ ...f, conditions: f.conditions.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  const locked = event?.status === 'closed';
  const widening = !!event?.open && !locked;

  // Suggested rewards first: event achievements and the pioneer one.
  const [suggested, others] = useMemo(() => {
    const sorted = [...achievements].sort((a, b) => t(`achievement.${a.id}`).localeCompare(t(`achievement.${b.id}`)));
    const isSuggested = (a: AdminAchievement) => a.family === 'events' || a.id === 'pioneer';
    return [sorted.filter(isSuggested), sorted.filter((a) => !isSuggested(a))];
  }, [achievements, t]);

  const frameOptions = useMemo(
    () => [...FRAMES].sort((a, b) => localName(a.name, lang).localeCompare(localName(b.name, lang))),
    [lang],
  );

  const startsIso = fromUtcInput(form.startsAt);
  const endsIso = fromUtcInput(form.endsAt);

  const submit = async () => {
    const name = form.name.trim();
    const slug = form.slug.trim();
    if (!name || !startsIso || !endsIso) return toast.error(t('rewards.admin.ev.form.required'));
    if (new Date(endsIso) <= new Date(startsIso)) return toast.error(t('rewards.admin.ev.form.invalidDates'));
    if (!SLUG.test(slug)) return toast.error(t('rewards.admin.ev.form.invalidSlug'));
    if (!form.conditions.length) return toast.error(t('rewards.admin.ev.form.noCondition'));
    const conditions: EventCondition[] = [];
    for (const c of form.conditions) {
      const def = conditionDef(c.type);
      if (def.scopeRequired && !c.scope) return toast.error(t('rewards.admin.ev.form.scopeRequired'));
      conditions.push({
        type: c.type,
        count: def.single ? 1 : Math.max(1, Math.floor(Number(c.count) || 1)),
        scope: def.scope === 'none' ? null : c.scope || null,
      });
    }
    const frameDays = form.frameDays.trim() ? Math.max(1, Math.floor(Number(form.frameDays) || 0)) : null;
    const body = {
      slug,
      name,
      description: form.description.trim() || null,
      startsAt: startsIso,
      endsAt: endsIso,
      recurrence: form.recurrence,
      // Status is only chosen before the window opens (draft or published).
      ...(!widening ? { status: form.publish ? 'scheduled' : 'draft' } : {}),
      conditionMode: form.conditionMode,
      conditions,
      rewards: {
        achievementId: form.achievementId || null,
        frameId: form.frameId || null,
        frameDays: form.frameId ? frameDays : null,
        xp: Math.max(0, Math.floor(Number(form.xp) || 0)),
      },
    };
    setSaving(true);
    try {
      if (event) await api.rewards.admin.updateEvent(event.id, body);
      else await api.rewards.admin.createEvent(body);
      toast.success(t('rewards.admin.ev.saved'));
      onSaved();
      onClose();
    } catch (e: any) {
      const msg = Array.isArray(e?.message) ? e.message.join(' ') : e?.message;
      toast.error(msg || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={event ? t('rewards.admin.ev.form.editTitle') : t('rewards.admin.ev.form.createTitle')}
      subtitle={event?.name}
      closeLabel={t('rewards.admin.ev.form.cancel')}
    >
      <div className="space-y-5">
        {(widening || locked) && (
          <p
            className={cn(
              'flex items-start gap-2 rounded-md border p-3 text-xs',
              locked ? 'border-accent-red/30 bg-accent-red/5 text-accent-red' : 'border-accent-gold/30 bg-accent-gold/5 text-ink-2',
            )}
          >
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {locked ? t('rewards.admin.ev.form.closedHint') : t('rewards.admin.ev.form.openHint')}
          </p>
        )}

        <fieldset disabled={locked} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('rewards.admin.ev.form.name')}
              value={form.name}
              maxLength={120}
              onChange={(e: any) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, ...(slugTouched ? {} : { slug: slugify(name) }) }));
              }}
            />
            <div>
              <Input
                label={t('rewards.admin.ev.form.slug')}
                value={form.slug}
                maxLength={64}
                disabled={!!event}
                onChange={(e: any) => {
                  setSlugTouched(true);
                  set('slug', e.target.value.toLowerCase());
                }}
              />
              <p className="mt-1 text-[11px] text-ink-3">{t('rewards.admin.ev.form.slugHint')}</p>
            </div>
          </div>
          <Textarea
            label={t('rewards.admin.ev.form.description')}
            rows={2}
            maxLength={500}
            value={form.description}
            onChange={(e: any) => set('description', e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              type="datetime-local"
              label={t('rewards.admin.ev.form.startsAt')}
              value={form.startsAt}
              onChange={(e: any) => set('startsAt', e.target.value)}
            />
            <Input
              type="datetime-local"
              label={t('rewards.admin.ev.form.endsAt')}
              value={form.endsAt}
              onChange={(e: any) => set('endsAt', e.target.value)}
            />
            <Select
              label={t('rewards.admin.ev.form.recurrence')}
              value={form.recurrence}
              onChange={(e: any) => set('recurrence', e.target.value)}
            >
              <option value="none">{t('rewards.admin.ev.form.recurrence.none')}</option>
              <option value="yearly">{t('rewards.admin.ev.form.recurrence.yearly')}</option>
            </Select>
          </div>
          {!widening && (
            <label className="flex items-center gap-2 text-sm text-ink-1">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[rgb(var(--primary))]"
                checked={form.publish}
                onChange={(e) => set('publish', e.target.checked)}
              />
              {t('rewards.admin.ev.form.publish')}
            </label>
          )}

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold uppercase tracking-eyebrow text-ink-1">
                {t('rewards.admin.ev.form.conditions')}
              </h3>
              <div className="flex items-center gap-2 text-xs text-ink-2">
                <span>{t('rewards.admin.ev.form.mode')}</span>
                <Segmented<ConditionMode>
                  label={t('rewards.admin.ev.form.mode')}
                  value={form.conditionMode}
                  onChange={(v) => set('conditionMode', v)}
                  options={(['all', 'any'] as ConditionMode[]).map((m) => ({ id: m, label: t(`rewards.admin.ev.form.mode.${m}`) }))}
                />
              </div>
            </div>
            <ul className="space-y-2">
              {form.conditions.map((c, i) => {
                const def = conditionDef(c.type);
                const options = def.scope === 'tournament' ? tournaments : def.scope === 'event' ? events : [];
                return (
                  <li
                    key={i}
                    className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-md border border-line-subtle p-2.5 sm:grid-cols-[minmax(0,1.3fr)_90px_minmax(0,1.3fr)_auto]"
                  >
                    <Select
                      label={t('rewards.admin.ev.form.type')}
                      value={c.type}
                      onChange={(e: any) => setCond(i, { type: e.target.value, scope: '' })}
                      className="col-span-2 sm:col-span-1"
                    >
                      {CONDITION_TYPES.map((d) => (
                        <option key={d.type} value={d.type}>
                          {t(`rewards.event.cond.${d.type}`)}
                        </option>
                      ))}
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      label={t('rewards.admin.ev.form.count')}
                      value={def.single ? '1' : c.count}
                      disabled={def.single}
                      onChange={(e: any) => setCond(i, { count: e.target.value })}
                    />
                    {def.scope === 'none' ? (
                      <div className="hidden sm:block" />
                    ) : options.length ? (
                      <Select
                        label={t('rewards.admin.ev.form.scope')}
                        value={c.scope}
                        onChange={(e: any) => setCond(i, { scope: e.target.value })}
                      >
                        {!def.scopeRequired && <option value="">{t('rewards.admin.ev.form.scopeAny')}</option>}
                        {def.scopeRequired && <option value="">…</option>}
                        {options.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        label={t('rewards.admin.ev.form.scope')}
                        value={c.scope}
                        placeholder={def.scopeRequired ? '' : t('rewards.admin.ev.form.scopeAny')}
                        onChange={(e: any) => setCond(i, { scope: e.target.value.trim() })}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, conditions: f.conditions.filter((_, j) => j !== i) }))}
                      className="mb-1 inline-flex h-9 w-9 items-center justify-center rounded text-ink-3 hover:bg-accent-red/10 hover:text-accent-red disabled:opacity-40"
                      aria-label={t('rewards.admin.ev.form.removeCondition')}
                      title={t('rewards.admin.ev.form.removeCondition')}
                      disabled={widening || form.conditions.length <= 1}
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                );
              })}
            </ul>
            {!widening && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => set('conditions', [...form.conditions, { type: 'daily_login', count: '1', scope: '' }])}
              >
                <Plus size={14} />
                {t('rewards.admin.ev.form.addCondition')}
              </Button>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-eyebrow text-ink-1">
              {t('rewards.admin.ev.form.rewards')}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label={t('rewards.admin.ev.form.achievement')}
                value={form.achievementId}
                disabled={widening}
                onChange={(e: any) => set('achievementId', e.target.value)}
              >
                <option value="">{t('rewards.admin.ev.form.none')}</option>
                <optgroup label={t('rewards.admin.ev.form.suggested')}>
                  {suggested.map((a) => (
                    <option key={a.id} value={a.id}>
                      {t(`achievement.${a.id}`)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t('rewards.admin.ev.form.others')}>
                  {others.map((a) => (
                    <option key={a.id} value={a.id}>
                      {t(`achievement.${a.id}`)}
                    </option>
                  ))}
                </optgroup>
              </Select>
              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1">
                  <Select
                    label={t('rewards.admin.ev.form.frame')}
                    value={form.frameId}
                    disabled={widening}
                    onChange={(e: any) => set('frameId', e.target.value)}
                  >
                    <option value="">{t('rewards.admin.ev.form.none')}</option>
                    {frameOptions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {localName(f.name, lang)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-line-subtle bg-surface-2">
                  {form.frameId ? <FrameThumb frame={form.frameId} size={48} label={form.frameId} /> : null}
                </div>
              </div>
              <div>
                <Input
                  type="number"
                  min={1}
                  max={3650}
                  label={t('rewards.admin.ev.form.frameDays')}
                  value={form.frameDays}
                  disabled={!form.frameId}
                  onChange={(e: any) => set('frameDays', e.target.value)}
                />
                <p className="mt-1 text-[11px] text-ink-3">{t('rewards.admin.ev.form.frameDaysHint')}</p>
              </div>
              <Input
                type="number"
                min={0}
                max={10000}
                label={t('rewards.admin.ev.form.xp')}
                value={form.xp}
                onChange={(e: any) => set('xp', e.target.value)}
              />
            </div>
          </section>
        </fieldset>

        <div className="flex flex-col-reverse gap-2 border-t border-line-subtle pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t('rewards.admin.ev.form.cancel')}
          </Button>
          {!locked && (
            <Button onClick={submit} loading={saving}>
              {t('rewards.admin.ev.form.save')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
