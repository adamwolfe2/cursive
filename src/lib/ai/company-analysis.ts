/**
 * Company Analysis Cache
 *
 * Wraps analyzeCompany() with a Supabase-backed persistent cache keyed on domain.
 * If 10 users have leads from acme.com, the AI call runs once instead of 10×.
 *
 * Cache TTL: 24 hours
 * Storage: company_analysis_cache table (no RLS — service-level cache)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeCompany, type CompanyAnalysis } from '@/lib/services/ai/claude.service'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Get company analysis, using the DB cache when possible.
 * Falls back to live AI call on cache miss or stale entry.
 */
export async function getCachedCompanyAnalysis(
  companyData: Parameters<typeof analyzeCompany>[0]
): Promise<CompanyAnalysis> {
  const domain = companyData.domain?.toLowerCase().trim()

  // Without a domain we can't cache — call AI directly
  if (!domain) {
    return analyzeCompany(companyData)
  }

  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString()

  // Check cache
  const { data: cached } = await supabase
    .from('company_analysis_cache')
    .select('analysis, analyzed_at')
    .eq('domain', domain)
    .gte('analyzed_at', cutoff)
    .maybeSingle()

  if (cached?.analysis) {
    return cached.analysis as CompanyAnalysis
  }

  // Cache miss — call AI
  const analysis = await analyzeCompany(companyData)

  // Upsert result (non-blocking — don't delay the response)
  void supabase
    .from('company_analysis_cache')
    .upsert(
      { domain, analysis, analyzed_at: new Date().toISOString() },
      { onConflict: 'domain' }
    )
    .then(() => undefined)

  return analysis
}
