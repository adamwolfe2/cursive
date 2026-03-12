import { safeError } from '@/lib/utils/log-sanitizer'
import { fetchWithBackoff } from './rate-limiter'
import { getCachedResult, setCachedResult, buildCacheKey, CACHE_TTL_DAYS } from './cache'

export interface LinkedInProfile {
  fullName: string
  headline: string
  summary: string
  currentRole: string
  currentCompany: string
  location: string
  connectionsCount: number
  profileUrl: string
  photoUrl?: string
  experiences: Array<{
    title: string
    company: string
    duration: string
    current: boolean
  }>
  education: Array<{
    school: string
    degree: string
    field: string
  }>
}

export async function getLinkedInProfile(
  linkedinUrl?: string,
  email?: string,
  name?: string,
  company?: string,
): Promise<LinkedInProfile | null> {
  const apiKey = process.env.PROXYCURL_API_KEY
  if (!apiKey) return null

  // Check cache first
  const cacheKey = buildCacheKey('proxycurl', {
    ...(linkedinUrl ? { linkedin_url: linkedinUrl } : {}),
    ...(email ? { email } : {}),
  })
  const cached = await getCachedResult<LinkedInProfile>('proxycurl', cacheKey)
  if (cached) return cached

  try {
    let url: string
    if (linkedinUrl) {
      url = `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl)}&use_cache=if-present`
    } else if (email) {
      // Reverse lookup via email
      url = `https://nubela.co/proxycurl/api/linkedin/profile/resolve/email?email=${encodeURIComponent(email)}&lookup_depth=superficial&enrich_profile=enrich`
    } else {
      return null
    }

    const res = await fetchWithBackoff(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    }, 2)

    if (!res.ok) return null
    const data = await res.json()

    // Handle resolve response (returns {linkedin_profile_url, profile})
    const profile = data.profile ?? data

    const experiences = (profile.experiences ?? []).slice(0, 5).map((e: any) => ({
      title: e.title ?? '',
      company: e.company ?? '',
      duration: e.date_range ?? '',
      current: !e.ends_at,
    }))

    const education = (profile.education ?? []).slice(0, 3).map((e: any) => ({
      school: e.school ?? '',
      degree: e.degree_name ?? '',
      field: e.field_of_study ?? '',
    }))

    const currentExp = experiences.find((e: { current: boolean }) => e.current) ?? experiences[0]

    const result: LinkedInProfile = {
      fullName: profile.full_name ?? '',
      headline: profile.headline ?? '',
      summary: profile.summary ?? '',
      currentRole: currentExp?.title ?? '',
      currentCompany: currentExp?.company ?? '',
      location: profile.city ?? profile.country_full_name ?? '',
      connectionsCount: profile.connections ?? 0,
      profileUrl: profile.public_identifier
        ? `https://linkedin.com/in/${profile.public_identifier}`
        : linkedinUrl ?? '',
      photoUrl: profile.profile_pic_url,
      experiences,
      education,
    }
    void setCachedResult('proxycurl', cacheKey, result, CACHE_TTL_DAYS.proxycurl)
    return result
  } catch (err) {
    safeError('[Proxycurl] Error fetching LinkedIn profile', err)
    return null
  }
}
