/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force redeploy to pick up environment variables - URGENT FIX - CACHE BUST
  // FORCE REDEPLOY: Screen sharing API endpoints fixed - CACHE BUST
  // URGENT: Vercel still serving old compiled code with wrong URLs
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  staticPageGenerationTimeout: 0,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig 