# MLBB Togo — Frontend (Next.js)

Interface web de la plateforme MLBB Togo, portée depuis l'ancienne SPA React/Vite vers Next.js 14 (App Router, TypeScript).

## Démarrage

```bash
npm install
npm run dev        # http://localhost:3005
```

L'API backend doit tourner sur `http://localhost:3006/api` (voir `../backend`). L'URL est configurable via `NEXT_PUBLIC_API_URL` dans `.env.local`.

## Structure

```
src/
├── app/
│   ├── layout.tsx              # layout racine (polices, Providers, particules)
│   ├── globals.css             # styles Tailwind + thème gaming
│   ├── (auth)/                 # pages plein écran : login, register
│   └── (main)/                 # pages avec navbar + sidebar + footer
│       ├── page.tsx            # accueil
│       ├── dashboard, players, teams, forum, tournaments,
│       │   events, matches, heroes, profile, settings
│       └── admin/              # tableau de bord + gestion (users, teams,
│                               #   tournaments, posts, forms, logs)
├── components/                 # ui/ (composants réutilisables), layout/, common/
├── lib/                        # api.ts (client), constants.ts, helpers.ts, mockData.ts
├── store/                      # stores Zustand
└── types/                      # types partagés
```

## Données

Toutes les pages chargent leurs données via le client `src/lib/api.ts`, qui appelle l'API NestJS. Si le backend est hors-ligne, le client retombe sur les données de démonstration (`src/lib/mockData.ts`) pour que l'interface reste consultable. Les mutations (création, suppression, modération) mettent à jour l'état local de façon optimiste et tentent l'appel API en arrière-plan.

## Authentification

La page de connexion effectue un véritable appel `POST /auth/login`, stocke le jeton JWT (localStorage) et le rattache aux requêtes protégées. Compte de démonstration : `togoking@mlbb.tg` / `password123`.

## Build de production

```bash
npm run build
npm run start
```
