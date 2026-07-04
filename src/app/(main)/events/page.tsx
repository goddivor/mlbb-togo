'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  Plus, Swords, BookOpen, Trophy,
} from 'lucide-react';
import { Badge, Button, Tabs, Card, PageHeader, EmptyState, Input, Textarea, Select } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { useEventStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';

const DAY_KEYS = [
  'events.day.sun', 'events.day.mon', 'events.day.tue', 'events.day.wed',
  'events.day.thu', 'events.day.fri', 'events.day.sat',
];
const MONTH_KEYS = [
  'events.month.jan', 'events.month.feb', 'events.month.mar', 'events.month.apr',
  'events.month.may', 'events.month.jun', 'events.month.jul', 'events.month.aug',
  'events.month.sep', 'events.month.oct', 'events.month.nov', 'events.month.dec',
];

// Border/background styles per event type
const eventTypeCard: Record<string, string> = {
  scrim: 'bg-primary/10 border-primary/30',
  coaching: 'bg-meta-5/10 border-meta-5/30',
  tournament: 'bg-warning/10 border-warning/30',
};

const eventTypeIcons: Record<string, any> = {
  scrim: Swords,
  coaching: BookOpen,
  tournament: Trophy,
};

export default function Events() {
  const t = useT();
  const { events, setEvents } = useEventStore();
  const [currentDate, setCurrentDate] = useState(new Date(2024, 2, 1));
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState('calendar');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.events.list().then(setEvents);
  }, [setEvents]);

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

  return (
    <div className="space-y-6">

      <PageHeader
        icon={<CalendarIcon size={28} />}
        title={t('events.title')}
        subtitle={t('events.subtitle')}
        variant="green"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              tabs={[
                { id: 'calendar', label: t('events.tab.calendar') },
                { id: 'list', label: t('events.tab.list') },
              ]}
              active={viewMode}
              onChange={setViewMode}
            />
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              {t('events.new')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2">
          <Card>

            <div className="mb-6 flex items-center justify-between">
              <button onClick={prevMonth} className="rounded-sm p-2 transition-colors hover:bg-gray-2 dark:hover:bg-meta-4">
                <ChevronLeft size={20} className="text-body dark:text-bodydark" />
              </button>
              <h2 className="text-xl font-bold text-black dark:text-white">
                {t(MONTH_KEYS[month])} {year}
              </h2>
              <button onClick={nextMonth} className="rounded-sm p-2 transition-colors hover:bg-gray-2 dark:hover:bg-meta-4">
                <ChevronRight size={20} className="text-body dark:text-bodydark" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAY_KEYS.map((dayKey) => (
                <div key={dayKey} className="py-2 text-center text-xs font-medium text-body dark:text-bodydark">
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
                  <motion.button
                    key={index}
                    whileHover={day ? { scale: 1.05 } : {}}
                    whileTap={day ? { scale: 0.95 } : {}}
                    onClick={() => day && setSelectedDate(isSelected ? null : day)}
                    disabled={!day}
                    className={`relative flex aspect-square flex-col items-center justify-start rounded-sm p-1 transition-all ${
                      !day
                        ? ''
                        : isSelected
                          ? 'border border-primary/40 bg-primary/10'
                          : isToday
                            ? 'border border-primary/20 bg-gray-2 dark:bg-meta-4'
                            : 'border border-transparent hover:bg-gray-2 dark:hover:bg-meta-4'
                    }`}
                  >
                    {day && (
                      <>
                        <span className={`text-sm font-medium ${
                          isSelected
                            ? 'text-primary'
                            : isToday
                              ? 'font-bold text-primary'
                              : 'text-body dark:text-bodydark'
                        }`}>
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="mt-1 flex gap-0.5">
                            {dayEvents.slice(0, 3).map((evt: any, i: number) => (
                              <div key={i} className={`h-1.5 w-1.5 rounded-full ${
                                evt.type === 'scrim' ? 'bg-primary' :
                                evt.type === 'tournament' ? 'bg-warning' : 'bg-meta-5'
                              }`} />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <h3 className="mb-4 font-bold text-black dark:text-white">
              {selectedDate ? `${t('events.eventsOfDayPrefix')} ${selectedDate} ${t(MONTH_KEYS[month])}` : t('events.allEvents')}
            </h3>
            <div className="space-y-3">
              {selectedEvents.map((event: any) => {
                const cardStyle = eventTypeCard[event.type] || eventTypeCard.scrim;
                const Icon = eventTypeIcons[event.type] || Swords;
                const iconColor = event.type === 'tournament' ? 'text-warning' : event.type === 'coaching' ? 'text-meta-5' : 'text-primary';

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-sm border p-3 ${cardStyle}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Icon size={14} className={iconColor} />
                      <Badge variant={event.type === 'tournament' ? 'gold' : event.type === 'scrim' ? 'neon' : 'purple'} size="sm">
                        {event.type}
                      </Badge>
                    </div>
                    <h4 className="mb-1 text-sm font-semibold text-black dark:text-white">
                      {event.title}
                    </h4>
                    <p className="mb-2 text-xs text-body dark:text-bodydark">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-body dark:text-bodydark">
                      <span className="flex items-center gap-1">
                        <CalendarIcon size={12} />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {event.time}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {selectedEvents.length === 0 && (
                <EmptyState
                  icon={<CalendarIcon size={28} />}
                  title={t('events.noneToday')}
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Event creation modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('events.new')}
        icon={<CalendarIcon size={20} />}
        size="md"
      >
        <div className="space-y-4">
          <Select label={t('events.form.type')}>
            <option value="scrim">⚔️ {t('events.form.typeScrim')}</option>
            <option value="tournament">🏆 {t('events.form.typeTournament')}</option>
            <option value="coaching">📚 {t('events.form.typeCoaching')}</option>
          </Select>
          <Input label={t('events.form.title')} type="text" placeholder={t('events.form.namePlaceholder')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('events.form.date')} type="date" />
            <Input label={t('events.form.time')} type="time" />
          </div>
          <Textarea label={t('events.form.description')} rows={3} placeholder={t('events.form.descriptionPlaceholder')} />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1">{t('events.cancel')}</Button>
            <Button onClick={() => setShowCreate(false)} className="flex-1">{t('events.create')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
