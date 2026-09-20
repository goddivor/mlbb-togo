'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  Plus, Swords, BookOpen, Trophy, MapPin, CalendarDays, CalendarClock,
} from 'lucide-react';
import { Badge, Button, Tabs, Card, PageHeader, EmptyState, Input, Textarea, Select, StatCard } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { useEventStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { cn, formatDate } from '@/lib/helpers';
import { fadeUp, stagger, still } from '@/lib/motion';
import CitySelect from '@/components/geo/CitySelect';
import toast from 'react-hot-toast';

const DAY_KEYS = [
  'events.day.sun', 'events.day.mon', 'events.day.tue', 'events.day.wed',
  'events.day.thu', 'events.day.fri', 'events.day.sat',
];
const MONTH_KEYS = [
  'events.month.jan', 'events.month.feb', 'events.month.mar', 'events.month.apr',
  'events.month.may', 'events.month.jun', 'events.month.jul', 'events.month.aug',
  'events.month.sep', 'events.month.oct', 'events.month.nov', 'events.month.dec',
];

type EventKind = 'scrim' | 'coaching' | 'tournament';

/** Per-type accent (card edge, calendar dot, badge). */
const EVENT_META: Record<EventKind, { accent: 'cyan' | 'violet' | 'gold'; badge: string; dot: string; icon: any; labelKey: string }> = {
  scrim: { accent: 'cyan', badge: 'neon', dot: 'bg-accent-cyan', icon: Swords, labelKey: 'events.form.typeScrim' },
  coaching: { accent: 'violet', badge: 'purple', dot: 'bg-accent-violet', icon: BookOpen, labelKey: 'events.form.typeCoaching' },
  tournament: { accent: 'gold', badge: 'gold', dot: 'bg-accent-gold', icon: Trophy, labelKey: 'events.form.typeTournament' },
};

const metaOf = (type: string) => EVENT_META[(type as EventKind) in EVENT_META ? (type as EventKind) : 'scrim'];

export default function Events() {
  const t = useT();
  const reduce = useReducedMotion();
  const { events, setEvents } = useEventStore();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState('calendar');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: 'scrim', title: '', date: '', time: '', description: '', city: '' });
  const [saving, setSaving] = useState(false);

  const loadEvents = () => api.events.list().then((l: any) => setEvents(Array.isArray(l) ? l : []));

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createEvent = async () => {
    if (!form.title.trim() || !form.date) {
      toast.error(t('events.form.required'));
      return;
    }
    setSaving(true);
    try {
      await api.events.create({
        title: form.title.trim(),
        type: form.type,
        date: form.date,
        time: form.time || null,
        description: form.description.trim() || null,
        city: form.city || null,
      });
      await loadEvents();
      setForm({ type: 'scrim', title: '', date: '', time: '', description: '', city: '' });
      setShowCreate(false);
      toast.success(t('events.created'));
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [year, month]);

  const getEventsForDay = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e: any) => e.date === dateStr);
  };

  const selectedEvents = selectedDate
    ? getEventsForDay(selectedDate)
    : events;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // KPIs: upcoming (today or later), this month, next event.
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const upcoming = useMemo(
    () => events.filter((e: any) => typeof e.date === 'string' && e.date >= todayStr).sort((a: any, b: any) => (a.date > b.date ? 1 : -1)),
    [events, todayStr],
  );
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const thisMonth = events.filter((e: any) => typeof e.date === 'string' && e.date.startsWith(monthPrefix)).length;
  const nextEvent = upcoming[0];

  const listVariants = reduce ? still : stagger(0.04);
  const itemVariants = reduce ? still : fadeUp;

  /** Date block: day number in display type, month abbreviation under it. */
  const DateBlock = ({ date, accent }: { date: string; accent: 'cyan' | 'violet' | 'gold' }) => {
    const d = new Date(date + 'T00:00:00');
    const ok = !isNaN(d.getTime());
    const ring = { cyan: 'border-accent-cyan/40 text-accent-cyan', violet: 'border-accent-violet/40 text-accent-violet', gold: 'border-accent-gold/40 text-accent-gold' }[accent];
    return (
      <div className={cn('flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded border bg-surface-2 cut-corners-sm', ring)}>
        <span className="font-display text-2xl font-bold leading-none num">{ok ? d.getDate() : '—'}</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
          {ok ? t(MONTH_KEYS[d.getMonth()]).slice(0, 3) : ''}
        </span>
      </div>
    );
  };

  const EventCard = ({ event }: { event: any }) => {
    const meta = metaOf(event.type);
    const Icon = meta.icon;
    return (
      <Card hover accent={meta.accent} className="!p-4">
        <div className="flex items-start gap-4">
          <DateBlock date={event.date} accent={meta.accent} />
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge variant={meta.badge} size="sm" className="gap-1">
                <Icon size={12} /> {t(meta.labelKey)}
              </Badge>
            </div>
            <h4 className="truncate font-display text-base font-bold tracking-tight2 text-ink-1">{event.title}</h4>
            {event.description && <p className="mt-1 line-clamp-2 text-xs text-ink-2">{event.description}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3 num">
              {event.time && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} /> {event.time}
                </span>
              )}
              {event.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} /> {event.city}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const eventList = (
    <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
      {selectedEvents.map((event: any) => (
        <motion.div key={event.id} variants={itemVariants}>
          <EventCard event={event} />
        </motion.div>
      ))}
      {selectedEvents.length === 0 && (
        <EmptyState className="min-h-0 py-10" icon={<CalendarIcon size={28} />} title={t('events.noneToday')} />
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('events.eyebrow')}
        icon={<CalendarIcon size={22} />}
        title={t('events.title')}
        subtitle={t('events.subtitle')}
        variant="green"
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            {t('events.new')}
          </Button>
        }
      >
        <StatCard label={t('events.kpi.upcoming')} value={upcoming.length} icon={<CalendarDays size={18} />} accent="green" />
        <StatCard label={t('events.kpi.thisMonth')} value={thisMonth} hint={`${t(MONTH_KEYS[month])} ${year}`} icon={<CalendarIcon size={18} />} accent="cyan" />
        <StatCard
          label={t('events.kpi.next')}
          value={nextEvent ? <span className="text-xl">{formatDate(nextEvent.date)}</span> : '—'}
          hint={nextEvent?.title}
          icon={<CalendarClock size={18} />}
          accent="gold"
        />
        <StatCard label={t('events.kpi.total')} value={events.length} icon={<Trophy size={18} />} accent="violet" />
      </PageHeader>

      <div className="overflow-x-auto whitespace-nowrap">
        <Tabs
          variant="underline"
          tabs={[
            { id: 'calendar', label: t('events.tab.calendar'), icon: CalendarIcon },
            { id: 'list', label: t('events.tab.list'), icon: CalendarDays, count: events.length },
          ]}
          active={viewMode}
          onChange={setViewMode}
        />
      </div>

      {viewMode === 'list' ? (
        <div className="mx-auto max-w-3xl">{eventList}</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <div className="mb-5 flex items-center justify-between">
                <button
                  onClick={prevMonth}
                  aria-label={t('events.prevMonth')}
                  className="rounded p-2 text-ink-2 transition-colors duration-fast hover:bg-surface-2 hover:text-ink-1"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="font-display text-xl font-bold tracking-tight2 text-ink-1">
                  {t(MONTH_KEYS[month])} <span className="num text-ink-3">{year}</span>
                </h2>
                <button
                  onClick={nextMonth}
                  aria-label={t('events.nextMonth')}
                  className="rounded p-2 text-ink-2 transition-colors duration-fast hover:bg-surface-2 hover:text-ink-1"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1">
                {DAY_KEYS.map((dayKey) => (
                  <div key={dayKey} className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
                    {t(dayKey)}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDay(day);
                  const isSelected = selectedDate === day;
                  const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                  return (
                    <button
                      key={index}
                      onClick={() => day && setSelectedDate(isSelected ? null : day)}
                      disabled={!day}
                      aria-pressed={day ? isSelected : undefined}
                      className={cn(
                        'relative flex aspect-square flex-col items-center justify-start rounded border p-1 transition-[background-color,border-color] duration-fast',
                        !day && 'border-transparent',
                        day && isSelected && 'border-primary/50 bg-primary/10',
                        day && !isSelected && isToday && 'border-primary/30 bg-surface-2',
                        day && !isSelected && !isToday && 'border-transparent hover:bg-surface-2',
                        day && dayEvents.length > 0 && !isSelected && 'border-line-subtle',
                      )}
                    >
                      {day && (
                        <>
                          <span
                            className={cn(
                              'text-sm num',
                              isSelected ? 'font-bold text-primary' : isToday ? 'font-bold text-primary' : 'font-medium text-ink-2',
                            )}
                          >
                            {day}
                          </span>
                          {dayEvents.length > 0 && (
                            <div className="mt-1 flex gap-0.5">
                              {dayEvents.slice(0, 3).map((evt: any, i: number) => (
                                <span key={i} className={cn('h-1.5 w-1.5 rounded-full', metaOf(evt.type).dot)} />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 border-t border-line-subtle pt-3 text-xs text-ink-3">
                {(Object.keys(EVENT_META) as EventKind[]).map((k) => (
                  <span key={k} className="inline-flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 rounded-full', EVENT_META[k].dot)} />
                    {t(EVENT_META[k].labelKey)}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <p className="eyebrow mb-3">
              {selectedDate ? `${t('events.eventsOfDayPrefix')} ${selectedDate} ${t(MONTH_KEYS[month])}` : t('events.allEvents')}
            </p>
            {eventList}
          </div>
        </div>
      )}

      {/* Event creation modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('events.new')}
        icon={<CalendarIcon size={20} />}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label={t('events.form.type')}
            value={form.type}
            onChange={(e: any) => setForm({ ...form, type: e.target.value })}
          >
            <option value="scrim">{t('events.form.typeScrim')}</option>
            <option value="tournament">{t('events.form.typeTournament')}</option>
            <option value="coaching">{t('events.form.typeCoaching')}</option>
          </Select>
          <Input
            label={t('events.form.title')}
            type="text"
            placeholder={t('events.form.namePlaceholder')}
            value={form.title}
            onChange={(e: any) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('events.form.date')}
              type="date"
              value={form.date}
              onChange={(e: any) => setForm({ ...form, date: e.target.value })}
            />
            <Input
              label={t('events.form.time')}
              type="time"
              value={form.time}
              onChange={(e: any) => setForm({ ...form, time: e.target.value })}
            />
          </div>
          <CitySelect
            label={t('events.form.city')}
            value={form.city}
            onChange={(city) => setForm({ ...form, city })}
          />
          <Textarea
            label={t('events.form.description')}
            rows={3}
            placeholder={t('events.form.descriptionPlaceholder')}
            value={form.description}
            onChange={(e: any) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1">{t('events.cancel')}</Button>
            <Button onClick={createEvent} loading={saving} className="flex-1">{t('events.create')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
