/**
 * Robots.txt Generator
 * leads.meetcursive.com (App Domain)
 *
 * Disallows all crawling — this is the app, not the marketing site.
 * The marketing site at meetcursive.com has its own robots.txt.
 */

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
  }
}
