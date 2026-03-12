import { safeError } from '@/lib/utils/log-sanitizer'
import { fetchWithBackoff } from './rate-limiter'
import { getCachedResult, setCachedResult, buildCacheKey, CACHE_TTL_DAYS } from './cache'

export interface NewsArticle {
  title: string
  url: string
  date: string
  snippet: string
  source: string
}

export async function getNewsMentions(name: string, company: string): Promise<NewsArticle[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return []

  // Check cache first
  const cacheKey = buildCacheKey('serper', { name, company })
  const cached = await getCachedResult<NewsArticle[]>('serper', cacheKey)
  if (cached) return cached

  try {
    const query = `"${name}" "${company}"`
    const res = await fetchWithBackoff('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 5 }),
    }, 2)

    if (!res.ok) return []
    const data = await res.json()

    const result: NewsArticle[] = (data.news ?? []).slice(0, 5).map((a: any) => ({
      title: a.title ?? '',
      url: a.link ?? '',
      date: a.date ?? '',
      snippet: a.snippet ?? '',
      source: a.source ?? '',
    }))
    void setCachedResult('serper', cacheKey, result, CACHE_TTL_DAYS.serper)
    return result
  } catch (err) {
    safeError('[Serper] Error fetching news mentions', err)
    return []
  }
}
