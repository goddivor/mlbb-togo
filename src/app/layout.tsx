import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/common/Providers';

export const metadata: Metadata = {
  title: 'Mobile Legends: TOGO',
  description:
    'La plateforme communautaire des joueurs Mobile Legends: Bang Bang du Togo — classements, équipes, tournois, forum et héros.',
  icons: { icon: '/mlbbtogo-icon.png' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        {/* Évite le hotlink-protection du CDN Moonton : ne pas envoyer le Referer aux images externes. */}
        <meta name="referrer" content="no-referrer" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gaming-dark text-gray-200 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
