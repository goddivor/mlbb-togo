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
    // suppressHydrationWarning: the inline theme script sets the `class` on
    // <html> before hydration, which would otherwise trip a mismatch warning.
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Set the theme class before paint to avoid a flash: public routes are
            dark; the dashboard follows the stored preference (light by default). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var p=location.pathname;var pub=p==='/'||p.indexOf('/admin-login')===0;var adm=p==='/admin'||p.indexOf('/admin/')===0;var t=localStorage.getItem('mlbb-theme')||'light';var pal=localStorage.getItem('mlbb-palette')||'default';var d=pub?true:t==='dark';if(pal!=='default'&&!adm)d=true;document.documentElement.classList.toggle('dark',d);if(pal!=='default'&&!adm)document.documentElement.classList.add('theme-'+pal);}catch(e){document.documentElement.classList.add('dark');}})();",
          }}
        />
        <meta name="referrer" content="no-referrer" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Poppins:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gaming-dark text-gray-200 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
