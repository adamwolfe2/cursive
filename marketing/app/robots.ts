import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow all crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/_next/', '/popup-test', '/clean-room', '/test/'],
      },
      // AI Crawlers — explicitly allow full access
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
      },
      {
        userAgent: 'Omgilibot',
        allow: '/',
      },
      {
        userAgent: 'FacebookBot',
        allow: '/',
      },
      // Traditional search engines
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
      },
      {
        userAgent: 'Slurp',
        allow: '/',
      },
      {
        userAgent: 'DuckDuckBot',
        allow: '/',
      },
    ],
    sitemap: 'https://meetcursive.com/sitemap.xml',
    host: 'https://meetcursive.com',
  }
}
