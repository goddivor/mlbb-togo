'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { calendarEvents } from '@/mocks/calendar';
import type { CalendarEvent } from '@/mocks/types';
import { useT } from '@/lib/i18n';
import { PageHeader, SectionCard, Badge, Button } from '@/components/ui';

const VIEWS = ['Day', 'Week', 'Month'] as const;

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  match: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
  final: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
  tournament: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7' },
  meeting: { bg: 'rgba(148, 163, 184, 0.1)', text: '#64748b' },
  draft: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
  live: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
};

export default function CalendarPage() {
  const t = useT();
  const [view, setView] = useState<(typeof VIEWS)[number]>('Month');
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const grouped = calendarEvents.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    const day = new Date(ev.start).toDateString();
    acc[day] = acc[day] || [];
    acc[day].push(ev);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CalendarIcon size={28} />}
        title="Calendar"
        subtitle="Matches, tournaments, drafts and events"
        variant="blue"
      />

      <SectionCard className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: view === v ? 'var(--accent-primary)' : 'var(--surface-bg)',
                color: view === v ? 'var(--badge-success-text)' : 'var(--page-text)',
                border: '1px solid var(--card-border)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-16 text-sm" style={{ color: 'var(--sidebar-text)' }}>No events.</div>
          )}
          {Object.entries(grouped).map(([day, events]) => (
            <div key={day}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--sidebar-text)' }}>{day}</p>
              <div className="space-y-2">
                {events.map((ev: CalendarEvent) => {
                  const start = new Date(ev.start);
                  const end = ev.end ? new Date(ev.end) : null;
                  const style = TYPE_STYLE[ev.type] || TYPE_STYLE.meeting;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setSelected(ev)}
                      className="w-full text-left glass-card p-4 hover:-translate-y-1"
                      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: style.bg, color: style.text }}>
                          <CalendarIcon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: 'var(--page-text)' }}>{ev.title}</p>
                          <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {end ? ` - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </p>
                        </div>
                        <Badge size="sm" style={{ background: style.bg, color: style.text }}>{ev.type}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div>
          {selected ? (
            <SectionCard>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--sidebar-text)' }}>Event Details</p>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--page-text)' }}>{selected.title}</h3>
              <div className="space-y-2 text-xs" style={{ color: 'var(--sidebar-text)' }}>
                <p className="inline-flex items-center gap-1.5"><Clock size={12} /> {new Date(selected.start).toLocaleString()}</p>
                {selected.location && <p className="inline-flex items-center gap-1.5"><MapPin size={12} /> {selected.location}</p>}
                {selected.description && <p>{selected.description}</p>}
              </div>
              <Button size="sm" variant="secondary" className="mt-4 w-full">Add to calendar</Button>
            </SectionCard>
          ) : (
            <SectionCard>
              <div className="py-8 text-center text-sm" style={{ color: 'var(--sidebar-text)' }}>
                Select an event to view details
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
