'use client';

import Link from 'next/link';
import { Swords, Heart } from 'lucide-react';
import { useThemeStore } from '@/store/useStore';

export default function Footer() {
  const { theme } = useThemeStore();

  return (
    <footer
      className={`border-t py-8 px-6 ${
        theme === 'dark'
          ? 'bg-gaming-darker border-gaming-border'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-6 h-6 text-neon-blue" />
              <span className="text-lg font-bold text-gradient">MLBB Togo</span>
            </div>
            <p className={`text-sm max-w-md ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              La communauté togolaise de Mobile Legends: Bang Bang. Connectez-vous avec les meilleurs joueurs,
              formez des équipes et participez à des tournois passionnants.
            </p>
            <p className={`text-xs mt-3 flex items-center gap-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              Fait avec <Heart size={12} className="text-red-500" /> au Togo 🇹🇬
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className={`font-semibold text-sm mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Navigation</h4>
            <ul className="space-y-2">
              {['Accueil', 'Joueurs', 'Équipes', 'Forum'].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${item === 'Accueil' ? '' : item.toLowerCase()}`}
                    className={`text-sm transition-colors ${
                      theme === 'dark' ? 'text-gray-400 hover:text-neon-blue' : 'text-gray-500 hover:text-primary-600'
                    }`}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={`font-semibold text-sm mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Communauté</h4>
            <ul className="space-y-2">
              {['Tournois', 'Événements', 'Matchs', 'Profil'].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${item.toLowerCase()}`}
                    className={`text-sm transition-colors ${
                      theme === 'dark' ? 'text-gray-400 hover:text-neon-blue' : 'text-gray-500 hover:text-primary-600'
                    }`}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`mt-8 pt-6 border-t text-center ${
          theme === 'dark' ? 'border-gaming-border' : 'border-gray-100'
        }`}>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            © 2024 MLBB Togo. Tous droits réservés. Mobile Legends: Bang Bang est une marque de Moonton.
          </p>
        </div>
      </div>
    </footer>
  );
}
