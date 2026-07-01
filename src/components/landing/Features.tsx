'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Users, Shield, MessageSquare, Swords, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { useT } from '@/lib/i18n';

const features = [
  { key: 'tournaments', icon: Trophy, href: '/tournaments', color: 'text-neon-gold', ring: 'bg-neon-gold/10' },
  { key: 'rankings', icon: Users, href: '/players', color: 'text-neon-blue', ring: 'bg-neon-blue/10' },
  { key: 'teams', icon: Shield, href: '/teams', color: 'text-neon-purple', ring: 'bg-neon-purple/10' },
  { key: 'forum', icon: MessageSquare, href: '/forum', color: 'text-neon-pink', ring: 'bg-neon-pink/10' },
  { key: 'matches', icon: Swords, href: '/matches', color: 'text-neon-blue', ring: 'bg-neon-blue/10' },
  { key: 'events', icon: Calendar, href: '/events', color: 'text-neon-green', ring: 'bg-neon-green/10' },
  { key: 'heroes', icon: Sparkles, href: '/heroes', color: 'text-neon-purple', ring: 'bg-neon-purple/10' },
  { key: 'esport', icon: Trophy, href: '#partners', color: 'text-neon-gold', ring: 'bg-neon-gold/10' },
];

export default function Features() {
  const t = useT();

  return (
    <div>

      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-blue mb-3">{t('features.eyebrow')}</p>
        <h2 className="text-3xl sm:text-5xl font-bold text-white">
          {t('features.titlePre')} <span className="text-gradient">MLBB Togo</span>
        </h2>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-lg">{t('features.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.08 }}
              className="card-gaming group flex flex-col p-7 sm:p-8"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${f.ring}`}>
                <Icon size={30} className={f.color} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t(`feat.${f.key}.title`)}</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1">{t(`feat.${f.key}.desc`)}</p>
              <Link
                href={f.href}
                className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${f.color} group-hover:gap-3 transition-all`}
              >
                {t('features.discover')} <ArrowRight size={16} />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
