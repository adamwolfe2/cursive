import { MetadataRoute } from 'next'
import { DISALLOWED_PATHS, NAMED_CRAWLERS, SITE_URL } from '@/lib/seo/robots-rules'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOWED_PATHS },
      // A bot with its own group ignores the '*' group, so repeat the blocked paths here.
      { userAgent: NAMED_CRAWLERS, allow: '/', disallow: DISALLOWED_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
