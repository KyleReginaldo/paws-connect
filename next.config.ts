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
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '10.0.2.2',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
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
