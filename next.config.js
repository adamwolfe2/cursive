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
    // TODO: re-enable after fixing 57 pre-existing console.log warnings
    ignoreDuringBuilds: true,
  },

  // ============================================
  // IMAGE OPTIMIZATION
  // ============================================
  images: {
    formats: ['image/avif', 'image/webp'],
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
      {
        protocol: 'https',
        hostname: 'meetcursive.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
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
            value: 'strict-origin-when-cross-origin',
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
              // 'unsafe-inline' is required for:
              //   - Crisp chat bootstrap (dangerouslySetInnerHTML inline script)
              //   - Next.js inline hydration chunks injected at runtime
              // 'strict-dynamic' is added so modern browsers ignore 'unsafe-inline' and
              //   instead trust only scripts loaded by already-trusted scripts (e.g. Crisp
              //   injecting its own <script> tag). Older browsers fall back to 'unsafe-inline'.
              // 'unsafe-eval' has been intentionally omitted — nothing in this codebase
              //   requires it (Stripe.js, Sentry, Crisp, and Next.js all work without it).
              "script-src 'self' 'unsafe-inline' 'strict-dynamic' https://js.stripe.com https://client.crisp.chat https://browser.sentry-cdn.com https://*.vercel-scripts.com",
              // 'unsafe-inline' is required for Tailwind utility classes applied as inline
              //   styles and for any CSS-in-JS style injections from third-party widgets.
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https: http:",
              // wss://client.crisp.chat — Crisp uses a WebSocket relay for real-time chat.
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io https://sentry.io https://client.crisp.chat wss://client.crisp.chat",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://*.supabase.co https://accounts.google.com",
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
