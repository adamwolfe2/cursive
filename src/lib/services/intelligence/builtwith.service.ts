import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { fetchWithBackoff } from './rate-limiter'

export interface TechStackResult {
  technologies: string[]
  categories: Record<string, string[]>
  raw?: Record<string, unknown>
}

export async function getCompanyTechStack(domain: string): Promise<TechStackResult | null> {
  const apiKey = process.env.BUILTWITH_API_KEY
  if (!apiKey) {
    safeLog('[BuiltWith] No API key configured, skipping')
    return null
  }

  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0]

  try {
    const url = `https://api.builtwith.com/free1/api.json?KEY=${apiKey}&LOOKUP=${cleanDomain}`
    const res = await fetchWithBackoff(url, {}, 2)
    if (!res.ok) return null

    const data = await res.json()
    if (!data?.Results?.[0]) return null

    const result = data.Results[0]
    const paths = result.Result?.Paths ?? []
    const technologies: string[] = []
    const categories: Record<string, string[]> = {}

    for (const path of paths) {
      for (const tech of (path.Technologies ?? [])) {
        const name = tech.Name as string
        const cat = tech.Tag as string ?? 'Other'
        if (name && !technologies.includes(name)) {
          technologies.push(name)
          if (!categories[cat]) categories[cat] = []
          categories[cat].push(name)
        }
      }
    }

    return { technologies, categories, raw: data }
  } catch (err) {
    safeError('[BuiltWith] Error fetching tech stack', err)
    return null
  }
}
