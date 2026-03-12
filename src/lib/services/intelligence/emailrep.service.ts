import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { fetchWithBackoff } from './rate-limiter'
import { getCachedResult, setCachedResult, buildCacheKey, CACHE_TTL_DAYS } from './cache'

export interface EmailQualityResult {
  score: number
  suspicious: boolean
  deliverable: boolean
  disposable: boolean
  free: boolean
  spoofable: boolean
  provider?: string
}

export async function getEmailQuality(email: string): Promise<EmailQualityResult | null> {
  // Check cache first
  const cacheKey = buildCacheKey('emailrep', { email })
  const cached = await getCachedResult<EmailQualityResult>('emailrep', cacheKey)
  if (cached) return cached

  try {
    const res = await fetchWithBackoff(
      `https://emailrep.io/${encodeURIComponent(email)}`,
      {
        headers: {
          'User-Agent': 'Cursive/1.0',
          ...(process.env.EMAILREP_API_KEY ? { 'Key': process.env.EMAILREP_API_KEY } : {}),
        },
      },
      2
    )
    if (!res.ok) return null
    const data = await res.json()

    const result: EmailQualityResult = {
      score: Math.round((data.reputation === 'high' ? 90 : data.reputation === 'medium' ? 60 : 30)),
      suspicious: data.suspicious ?? false,
      deliverable: !data.details?.disposable,
      disposable: data.details?.disposable ?? false,
      free: data.details?.free_provider ?? false,
      spoofable: data.details?.spoofable ?? false,
      provider: data.details?.domain_exists ? 'work' : undefined,
    }
    void setCachedResult('emailrep', cacheKey, result, CACHE_TTL_DAYS.emailrep)
    return result
  } catch (err) {
    safeError('[EmailRep] Error checking email quality', err)
    return null
  }
}
