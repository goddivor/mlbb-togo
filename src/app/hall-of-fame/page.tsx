'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { hallOfFame } from '@/mocks/hallOfFame';
import type { HallOfFameSeason } from '@/mocks/types';
import { useT } from '@/lib/i18n';
import { PageHeader, SectionCard, Badge, Button } from '@/components/ui';

const PLACES = [
  { key: 'champion', label: 'Champion', icon: Trophy, color: '#fbbf24' },
  { key: 'runnerUp', label: 'Vice-Champion', icon: Medal, color: '#94a3b8' },
  { key: 'third', label: 'Third', icon: Award, color: '#cd7f32' },
] as const;

export default function HallOfFamePage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Trophy size={28} />}
        title="Hall of Fame"
        subtitle="Legends and champions across seasons"
        variant="blue"
      />

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px" style={{ background: 'var(--card-border)' }} />
        <div className="space-y-8">
          {hallOfFame.map((season: HallOfFameSeason, idx) => (
            <motion.div
              key={season.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-16"
            >
              <div
                className="absolute left-4 top-1 h-8 w-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--accent-primary)', color: '#fff' }}
              >
                <Trophy size={18} />
              </div>

              <SectionCard>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--page-text)' }}>{season.season}</h3>
                  <Badge variant="purple" size="sm">Season</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {PLACES.map((place) => {
                    const team = season[place.key];
                    if (!team) return null;
                    return (
                      <div key={place.key} className="rounded-xl border p-4 text-center" style={{ background: 'var(--surface-bg)', borderColor: 'var(--card-border)' }}>
                        <div className="mx-auto mb-2 h-12 w-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff' }}>
                          <place.icon size={22} />
                        </div>
                        <p className="text-xs font-semibold mb-1" style={{ color: place.color }}>{place.label}</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--page-text)' }}>{team.name}</p>
                      </div>
                    );
                  })}
                </div>

                {season.awards?.length ? (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--sidebar-text)' }}>Awards</p>
                    <div className="flex flex-wrap gap-2">
                      {season.awards.map((a) => (
                        <Badge key={a.id} variant="gold" size="sm">
                          {a.category}: {a.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </SectionCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
