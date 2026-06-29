/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ],
  },
};

export default nextConfig;
