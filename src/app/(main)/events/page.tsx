'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  Plus, Swords, BookOpen, Trophy,
} from 'lucide-react';
import { Card, Badge, Button, Tabs } from '@/components/ui';
import { useThemeStore, useEventStore } from '@/store/useStore';
import { api } from '@/lib/api';

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const eventTypeColors: Record<string, any> = {
  scrim: { bg: 'bg-neon-blue/20', text: 'text-neon-blue', border: 'border-neon-blue/30' },
  coaching: { bg: 'bg-neon-purple/20', text: 'text-neon-purple', border: 'border-neon-purple/30' },
  tournament: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
};

const eventTypeIcons: Record<string, any> = {
  scrim: Swords,
  coaching: BookOpen,
  tournament: Trophy,
};

export default function Events() {
  const { theme } = useThemeStore();
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <CalendarIcon className="inline w-8 h-8 mr-2 text-neon-green" />
            Événements
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Calendrier des événements MLBB Togo
          </p>
        </div>
        <div className="flex gap-3">
          <Tabs
            tabs={[
              { id: 'calendar', label: 'Calendrier' },
              { id: 'list', label: 'Liste' },
            ]}
            active={viewMode}
            onChange={setViewMode}
          />
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Nouvel événement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card hover={false}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gaming-surface' : 'hover:bg-gray-100'}`}>
                <ChevronLeft size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
              </button>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {MONTHS[month]} {year}
              </h2>
              <button onClick={nextMonth} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gaming-surface' : 'hover:bg-gray-100'}`}>
                <ChevronRight size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
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
                    className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-start transition-all relative ${
                      !day
                        ? ''
                        : isSelected
                          ? 'bg-neon-blue/20 border border-neon-blue/40'
                          : isToday
                            ? 'bg-gaming-surface border border-neon-blue/20'
                            : theme === 'dark'
                              ? 'hover:bg-gaming-surface border border-transparent'
                              : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    {day && (
                      <>
                        <span className={`text-sm font-medium ${
                          isSelected
                            ? 'text-neon-blue'
                            : isToday
                              ? 'text-neon-blue font-bold'
                              : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-1">
                            {dayEvents.slice(0, 3).map((evt: any, i: number) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                                evt.type === 'scrim' ? 'bg-neon-blue' :
                                evt.type === 'tournament' ? 'bg-yellow-400' : 'bg-neon-purple'
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

        {/* Events Sidebar */}
        <div>
          <Card hover={false}>
            <h3 className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {selectedDate ? `Événements du ${selectedDate} ${MONTHS[month]}` : 'Tous les événements'}
            </h3>
            <div className="space-y-3">
              {selectedEvents.map((event: any) => {
                const colors = eventTypeColors[event.type] || eventTypeColors.scrim;
                const Icon = eventTypeIcons[event.type] || Swords;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={14} className={colors.text} />
                      <Badge variant={event.type === 'tournament' ? 'gold' : event.type === 'scrim' ? 'neon' : 'purple'} size="sm">
                        {event.type}
                      </Badge>
                    </div>
                    <h4 className={`font-semibold text-sm mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {event.title}
                    </h4>
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {event.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
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
                <div className="text-center py-8">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                  <p className="text-sm text-gray-400">Aucun événement ce jour</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg rounded-2xl border p-6 ${
              theme === 'dark' ? 'bg-gaming-card border-gaming-border' : 'bg-white border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Nouvel événement
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
                <select className={`w-full px-4 py-3 rounded-lg border bg-gaming-surface text-white focus:outline-none focus:border-neon-blue/50 ${
                  theme === 'dark' ? 'border-gaming-border' : 'border-gray-200'
                }`}>
                  <option value="scrim">⚔️ Scrim</option>
                  <option value="tournament">🏆 Tournoi</option>
                  <option value="coaching">📚 Coaching</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Titre</label>
                <input type="text" placeholder="Nom de l'événement" className={`w-full px-4 py-3 rounded-lg border bg-gaming-surface text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/50 ${
                  theme === 'dark' ? 'border-gaming-border' : 'border-gray-200'
                }`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Date</label>
                  <input type="date" className={`w-full px-4 py-3 rounded-lg border bg-gaming-surface text-white focus:outline-none focus:border-neon-blue/50 ${
                    theme === 'dark' ? 'border-gaming-border' : 'border-gray-200'
                  }`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Heure</label>
                  <input type="time" className={`w-full px-4 py-3 rounded-lg border bg-gaming-surface text-white focus:outline-none focus:border-neon-blue/50 ${
                    theme === 'dark' ? 'border-gaming-border' : 'border-gray-200'
                  }`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea rows={3} placeholder="Description..." className={`w-full px-4 py-3 rounded-lg border bg-gaming-surface text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/50 resize-none ${
                  theme === 'dark' ? 'border-gaming-border' : 'border-gray-200'
                }`} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1">Annuler</Button>
                <Button onClick={() => setShowCreate(false)} className="flex-1">Créer</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
