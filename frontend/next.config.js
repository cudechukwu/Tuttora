/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force redeploy to pick up environment variables - URGENT FIX
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