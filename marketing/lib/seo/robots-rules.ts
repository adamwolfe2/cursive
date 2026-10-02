/**
 * Crawl rules shared by robots.ts and its test.
 * /_next/ is deliberately not blocked: search engines need its CSS and JS to render pages.
 */
export const SITE_URL = 'https://www.meetcursive.com'

export const DISALLOWED_PATHS = ['/api/', '/admin/', '/dashboard/', '/popup-test', '/clean-room', '/test/', '/call-booked']

/** AI and search crawlers we name explicitly. They get the same blocked paths as everyone else. */
export const NAMED_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'Googlebot',
  'Bingbot',
  'DuckDuckBot',
]
