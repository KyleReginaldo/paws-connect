import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fjogjfdhtszaycqirwpm.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Ensure proper 404 handling
  async redirects() {
    return [];
  },
  async rewrites() {
    return [];
  },
  // This ensures that 404s are handled by the not-found.tsx page
  trailingSlash: false,
  skipMiddlewareUrlNormalize: false,
};

export default nextConfig;
