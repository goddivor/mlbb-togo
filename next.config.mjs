/** @type {import('next').NextConfig} */
// Member pages live under /dashboard. Their former top-level URLs (bookmarks,
// links stored in notifications by the API) redirect there.
const MEMBER_ROUTES = [
  'ai', 'design', 'draft', 'emblems', 'events', 'forum', 'friends', 'heroes',
  'items', 'leaderboard', 'map', 'matches', 'messages', 'my-requests',
  'notifications', 'pick-ban', 'players', 'profile', 'progress', 'recruitment',
  'settings', 'spells', 'standings', 'stats', 'stream', 'teams', 'tournaments',
];

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return MEMBER_ROUTES.flatMap((route) => [
      { source: `/${route}`, destination: `/dashboard/${route}`, permanent: false },
      { source: `/${route}/:path*`, destination: `/dashboard/${route}/:path*`, permanent: false },
    ]);
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'akmweb.youngjoygame.com',
      },
      {
        protocol: 'https',
        hostname: 'akmwebstatic.yuanzhanapp.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
    ],
  },
};

export default nextConfig;
