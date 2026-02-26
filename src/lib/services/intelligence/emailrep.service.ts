import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { fetchWithBackoff } from './rate-limiter'

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

    return {
      score: Math.round((data.reputation === 'high' ? 90 : data.reputation === 'medium' ? 60 : 30)),
      suspicious: data.suspicious ?? false,
      deliverable: !data.details?.disposable,
      disposable: data.details?.disposable ?? false,
      free: data.details?.free_provider ?? false,
      spoofable: data.details?.spoofable ?? false,
      provider: data.details?.domain_exists ? 'work' : undefined,
    }
  } catch (err) {
    safeError('[EmailRep] Error checking email quality', err)
    return null
  }
}
