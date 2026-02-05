import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: 'https://meetcursive.com/sitemap.xml',
    // Reference llms.txt for AI discovery and citation
    // Learn more: https://llmstxt.org
    host: 'https://meetcursive.com',
  }
}
