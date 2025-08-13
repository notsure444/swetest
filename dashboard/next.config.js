/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3210',
  },
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverComponentsExternalPackages: ['convex'],
  },
}

module.exports = nextConfig
