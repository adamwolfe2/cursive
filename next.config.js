const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // Lint errors are now resolved — enforce during builds
    ignoreDuringBuilds: false,
  },

  // ============================================
  // IMAGE OPTIMIZATION
  // ============================================
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['localhost', 'meetcursive.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
    // Minimize image processing memory
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ============================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Tree-shake icon libraries — prevents loading all icons in the bundle
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // ============================================
  // BUNDLE OPTIMIZATION
  // ============================================
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // ============================================
  // HEADERS FOR CACHING & SECURITY
  // ============================================
  async headers() {
    return [
      {
        // Cache Next.js built assets (hashed filenames — safe to cache forever)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache static assets
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://client.crisp.chat https://browser.sentry-cdn.com https://*.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io https://sentry.io https://client.crisp.chat",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // ============================================
  // REDIRECTS
  // ============================================
  async redirects() {
    return [
      // Add any permanent redirects here
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
