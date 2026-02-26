import { safeError } from '@/lib/utils/log-sanitizer'
import { fetchWithBackoff } from './rate-limiter'

export interface SocialIntelResult {
  socialProfiles: Array<{ network: string; url: string; username: string }>
  confirmedName: string
  bio: string
  location: string
  photo?: string
}

export async function getSocialIntel(email: string): Promise<SocialIntelResult | null> {
  const apiKey = process.env.FULLCONTACT_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetchWithBackoff('https://api.fullcontact.com/v3/person.enrich', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    }, 2)

    if (!res.ok) return null
    const data = await res.json()

    const profiles = (data.details?.profiles ?? []).map((p: any) => ({
      network: p.network ?? '',
      url: p.url ?? '',
      username: p.username ?? '',
    })).filter((p: any) => p.network && p.url)

    return {
      socialProfiles: profiles,
      confirmedName: data.fullName ?? '',
      bio: data.details?.bio ?? '',
      location: data.details?.locations?.[0]?.formatted ?? '',
      photo: data.avatar,
    }
  } catch (err) {
    safeError('[FullContact] Error fetching social intel', err)
    return null
  }
}
