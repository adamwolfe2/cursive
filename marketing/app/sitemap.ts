import { MetadataRoute } from 'next'
import { integrations } from '@/lib/integrations-data'
import {
  BLOG_INDEX,
  BLOG_POST_PATHS,
  CORE_PATHS,
  EDUCATIONAL_PATHS,
  INDUSTRY_PATHS,
  INTEGRATIONS_INDEX,
  LEGAL_PATHS,
  PRODUCT_PATHS,
  SECONDARY_PATHS,
  type SitemapPath,
} from '@/lib/seo/sitemap-paths'

const BASE_URL = 'https://www.meetcursive.com'

/**
 * No lastModified: we do not track per-page edit dates, and stamping every URL with the build time teaches
 * crawlers to ignore the field. Priorities and frequencies are hints only.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const integrationPaths: SitemapPath[] = integrations.map((i) => ({
    url: `/integrations/${i.slug}`,
    priority: 0.5,
    changeFrequency: 'monthly',
  }))

  const all: SitemapPath[] = [
    ...CORE_PATHS,
    ...PRODUCT_PATHS,
    INTEGRATIONS_INDEX,
    ...integrationPaths,
    ...INDUSTRY_PATHS,
    ...EDUCATIONAL_PATHS,
    ...SECONDARY_PATHS,
    BLOG_INDEX,
    ...BLOG_POST_PATHS,
    ...LEGAL_PATHS,
  ]

  return all.map(({ url, priority, changeFrequency }) => ({
    url: `${BASE_URL}${url}`,
    changeFrequency,
    priority,
  }))
}
