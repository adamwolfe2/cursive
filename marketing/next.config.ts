import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        // Cache hashed Next.js build assets forever (safe — filenames change on rebuild)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Security + CSP headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.vercel-scripts.com https://www.googletagmanager.com https://www.google-analytics.com https://cdn.segment.com https://js.stripe.com https://client.crisp.chat https://settings.crisp.chat",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://client.crisp.chat",
              "font-src 'self' https://fonts.gstatic.com https://client.crisp.chat",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.segment.io https://api.stripe.com https://www.google-analytics.com https://vitals.vercel-insights.com https://api.audiencelab.io https://leads.meetcursive.com https://client.crisp.chat https://settings.crisp.chat wss://client.relay.crisp.chat wss://stream.relay.crisp.chat wss://client.relay.rescue.crisp.chat wss://stream.relay.rescue.crisp.chat https://storage.crisp.chat",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://calendly.com https://cal.com https://player.mux.com https://game.crisp.chat",
              "media-src 'self' https://client.crisp.chat",
              "worker-src 'self' blob: https://client.crisp.chat",
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

  // Explicit non-www → www redirect (belt-and-suspenders alongside Vercel domain settings)
  async redirects() {
    // Legacy offer pages describing retired models (marketplace credit packs, managed tiers,
    // Venture Studio, the $197 Custom Audience and $247 bundle). 301 them to /pricing (the
    // find/reach/run ladder) so link equity lands on the live offer.
    const RETIRED_OFFER_PAGES = [
      '/direct-mail',
      '/marketplace',
      '/services',
      '/venture-studio',
      '/data-access',
      '/clean-room',
      '/demos',
      '/custom-audiences',
      '/audience-builder',
      '/intent-audiences',
    ]
    // Retired pages with a better home than /pricing. /case-studies made results claims we cannot verify.
    const MOVED_PAGES: Array<[string, string]> = [
      ['/case-studies', '/'],
      ['/visitor-identification', '/pixel'],
    ]

    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'meetcursive.com' }],
        destination: 'https://www.meetcursive.com/:path*',
        permanent: true,
      },
      ...RETIRED_OFFER_PAGES.flatMap((path) => [
        { source: path, destination: '/pricing', permanent: true },
        { source: `${path}/:slug*`, destination: '/pricing', permanent: true },
      ]),
      ...MOVED_PAGES.flatMap(([path, destination]) => [
        { source: path, destination, permanent: true },
        { source: `${path}/:slug*`, destination, permanent: true },
      ]),
    ]
  },
};

export default nextConfig;
