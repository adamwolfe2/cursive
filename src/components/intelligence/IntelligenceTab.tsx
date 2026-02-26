'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useToast } from '@/lib/hooks/use-toast'

interface LinkedInProfile {
  fullName: string
  headline: string
  summary: string
  currentRole: string
  currentCompany: string
  location: string
  connectionsCount: number
  profileUrl: string
  photoUrl?: string
  experiences: Array<{ title: string; company: string; duration: string; current: boolean }>
  education: Array<{ school: string; degree: string; field: string }>
}

interface SocialIntelResult {
  socialProfiles: Array<{ network: string; url: string; username: string }>
  confirmedName: string
  bio: string
  location: string
  photo?: string
}

interface NewsArticle {
  title: string
  url: string
  date: string
  snippet: string
  source: string
}

interface IntelligenceData {
  id: string
  company_tech_stack?: { technologies?: string[]; categories?: Record<string, string[]> }
  linkedin_data?: LinkedInProfile
  social_intel?: SocialIntelResult
  news_mentions?: NewsArticle[]
  research_brief?: string
  research_brief_at?: string
  research_outreach_angle?: string
  intelligence_tier?: 'none' | 'auto' | 'intel' | 'deep_research'
}

interface IntelligenceTabProps {
  leadId: string
  workspaceId: string
  initialTier?: string
}

export function IntelligenceTab({ leadId, workspaceId: _workspaceId, initialTier = 'none' }: IntelligenceTabProps) {
  const toast = useToast()
  const [_isRequestingDeep, setIsRequestingDeep] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['lead-intelligence', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/intelligence`)
      if (!res.ok) throw new Error('Failed to fetch intelligence data')
      return res.json()
    },
  })

  const intel = data?.data as IntelligenceData | undefined
  const tier = intel?.intelligence_tier ?? initialTier
  const creditsRemaining = data?.credits_remaining as number | undefined

  const enrichMutation = useMutation({
    mutationFn: async (requestTier: 'intel' | 'deep_research') => {
      const res = await fetch(`/api/leads/${leadId}/intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: requestTier }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Enrichment failed')
      return result
    },
    onSuccess: (_, requestTier) => {
      if (requestTier === 'deep_research') {
        setIsRequestingDeep(true)
        toast.success('Deep research queued. Results will appear in about 3 minutes.')
      } else {
        toast.success('Intelligence pack queued. Results will appear shortly.')
      }
      const delay = requestTier === 'intel' ? 35000 : 180000
      setTimeout(() => refetch(), delay)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Enrichment failed. Please try again.')
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const hasTechStack = (intel?.company_tech_stack?.technologies?.length ?? 0) > 0
  const hasLinkedIn = !!(intel?.linkedin_data?.headline)
  const hasSocial = (intel?.social_intel?.socialProfiles?.length ?? 0) > 0
  const hasNews = (intel?.news_mentions?.length ?? 0) > 0
  const hasResearch = !!(intel?.research_brief)

  const hasAnyIntel = hasTechStack || hasLinkedIn || hasSocial || hasNews

  const tierLabel: Record<string, string> = {
    none: 'No enrichment',
    auto: 'Basic',
    intel: 'Intelligence Pack',
    deep_research: 'Deep Research',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header + Tier badge */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Intelligence</h3>
          <p className="text-xs text-gray-500 mt-0.5">{tierLabel[tier] ?? 'No enrichment'}</p>
          <p className="text-xs text-zinc-500 mt-1">{creditsRemaining ?? '\u2014'} credits remaining</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {tier === 'deep_research' ? (
            <span className="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 font-medium">
              \u2746 Deep Research complete
            </span>
          ) : tier === 'intel' ? (
            <>
              <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 font-medium">
                \u2713 Intel Pack active
              </span>
              <button
                onClick={() => enrichMutation.mutate('deep_research')}
                disabled={enrichMutation.isPending || (creditsRemaining !== undefined && creditsRemaining < 10)}
                className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {enrichMutation.isPending && enrichMutation.variables === 'deep_research'
                  ? 'Queuing...'
                  : 'Upgrade to Deep Research (10 credits)'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => enrichMutation.mutate('intel')}
                disabled={enrichMutation.isPending || (creditsRemaining !== undefined && creditsRemaining < 2)}
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {enrichMutation.isPending && enrichMutation.variables === 'intel'
                  ? 'Queuing...'
                  : 'Intel Pack (2 credits)'}
              </button>
              <button
                onClick={() => enrichMutation.mutate('deep_research')}
                disabled={enrichMutation.isPending || (creditsRemaining !== undefined && creditsRemaining < 10)}
                className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {enrichMutation.isPending && enrichMutation.variables === 'deep_research'
                  ? 'Queuing...'
                  : 'Deep Dive (10 credits)'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tech Stack */}
      {hasTechStack && (
        <section>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tech Stack</h4>
          <div className="flex flex-wrap gap-1.5">
            {(intel?.company_tech_stack?.technologies ?? []).slice(0, 20).map(tech => (
              <span
                key={tech}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md border border-gray-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* LinkedIn Profile */}
      {hasLinkedIn && (
        <section>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">LinkedIn</h4>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              {intel?.linkedin_data?.photoUrl && (
                <img
                  src={intel.linkedin_data.photoUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{intel?.linkedin_data?.fullName}</p>
                <p className="text-xs text-gray-600 mt-0.5">{intel?.linkedin_data?.headline}</p>
                <p className="text-xs text-gray-500 mt-1">{intel?.linkedin_data?.location}</p>
              </div>
              {intel?.linkedin_data?.profileUrl && (
                <a
                  href={intel.linkedin_data.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline shrink-0"
                >
                  View
                </a>
              )}
            </div>
            {intel?.linkedin_data?.summary && (
              <p className="text-xs text-gray-600 mt-3 leading-relaxed line-clamp-3">
                {intel.linkedin_data.summary}
              </p>
            )}
            {(intel?.linkedin_data?.experiences?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-1.5">
                {intel?.linkedin_data?.experiences?.slice(0, 3).map((exp, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    {exp.current && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    )}
                    <span>
                      {exp.title} at {exp.company}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Social Profiles */}
      {hasSocial && (
        <section>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Social Profiles</h4>
          <div className="flex flex-wrap gap-2">
            {intel?.social_intel?.socialProfiles?.map(p => (
              <a
                key={p.network}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {p.network}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* News Mentions */}
      {hasNews && (
        <section>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Recent News</h4>
          <div className="space-y-2">
            {intel?.news_mentions?.slice(0, 3).map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <p className="text-xs font-medium text-gray-900 line-clamp-1">{article.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{article.snippet}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {article.source} \u00b7 {article.date}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Deep Research Brief */}
      {hasResearch && (
        <section>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Research Brief</h4>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
              {intel?.research_brief}
            </p>
            {intel?.research_brief_at && (
              <p className="text-xs text-gray-400 mt-2">
                Generated {new Date(intel.research_brief_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Suggested Outreach Angle */}
      {intel?.research_outreach_angle && (
        <section className="mt-4">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Suggested Outreach Angle
          </h4>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-sm text-zinc-800 leading-relaxed font-medium italic">
              &ldquo;{intel.research_outreach_angle}&rdquo;
            </p>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasAnyIntel && !hasResearch && tier === 'none' && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-1">No intelligence data yet</p>
          <p className="text-xs text-gray-400">
            Run Intel Pack to enrich this lead with LinkedIn, social profiles, and news mentions.
          </p>
        </div>
      )}

      {/* Pending state \u2014 enrichment queued */}
      {enrichMutation.isSuccess && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          Enrichment queued. Results will appear here automatically.
        </div>
      )}
    </div>
  )
}
