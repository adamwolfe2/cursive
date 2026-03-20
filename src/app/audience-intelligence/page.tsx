'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, Sparkles, ArrowRight, Users, Building2, Target, Zap } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface SegmentResult {
  segment_id: string
  name: string
  category: string
  sub_category: string | null
  description: string | null
  type: string
  similarity?: number
}

interface SearchResponse {
  segments: SegmentResult[]
  total: number
  search_type: 'semantic' | 'keyword' | 'none'
  categories: string[]
}

const SUGGESTED_SEARCHES = [
  { label: 'HVAC Contractors', icon: Building2 },
  { label: 'SaaS Decision Makers', icon: Target },
  { label: 'Home Buyers', icon: Users },
  { label: 'Auto Insurance Leads', icon: Zap },
  { label: 'Solar Energy Homeowners', icon: Sparkles },
  { label: 'Restaurant Owners', icon: Building2 },
  { label: 'Real Estate Investors', icon: Target },
  { label: 'E-commerce Brands', icon: Users },
]

export default function AudienceIntelligencePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SegmentResult[]>([])
  const [searchType, setSearchType] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const performSearch = useCallback(async (searchQuery: string, type?: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setHasSearched(false)
      setSearchType('')
      return
    }

    setLoading(true)
    setHasSearched(true)

    try {
      const params = new URLSearchParams({ q: searchQuery, limit: '12' })
      if (type || typeFilter) params.set('type', type || typeFilter)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000)

      const response = await fetch(`/api/public/segment-search?${params}`, {
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!response.ok) throw new Error('Search failed')

      const data: SearchResponse = await response.json()
      setResults(data.segments)
      setSearchType(data.search_type)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  // Debounced search on typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }
    debounceRef.current = setTimeout(() => performSearch(query), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, performSearch])

  const handleSuggestionClick = (label: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery(label)
    performSearch(label)
    inputRef.current?.focus()
  }

  const handleTypeFilter = (type: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const newType = typeFilter === type ? '' : type
    setTypeFilter(newType)
    if (query.trim()) performSearch(query, newType)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/cursive-logo.png" alt="Cursive" width={36} height={36} priority />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#007AFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0066DD] transition-colors"
          >
            Get Started Free
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero + Search */}
      <div className={`transition-all duration-500 ease-out ${hasSearched ? 'pt-8 pb-4' : 'pt-24 sm:pt-32 pb-12'}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className={`transition-all duration-500 ease-out ${hasSearched ? 'mb-4' : 'mb-8'}`}>
            {!hasSearched && (
              <>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#007AFF]/5 border border-[#007AFF]/10 px-3 py-1 text-xs font-medium text-[#007AFF] mb-4">
                  <Sparkles className="h-3 w-3" />
                  AI-Powered Audience Intelligence
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
                  Find your perfect audience
                </h1>
                <p className="mt-3 text-base sm:text-lg text-gray-500 max-w-xl mx-auto">
                  Search 19,000+ pre-built audience segments with AI. Describe who you want to reach — we will find the right segments instantly.
                </p>
              </>
            )}
          </div>

          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto">
            <div className={`relative rounded-2xl border transition-all duration-200 ${
              loading ? 'border-gray-300 shadow-sm' : 'border-gray-200 hover:border-gray-300 focus-within:border-gray-300 focus-within:shadow-sm'
            } bg-white`}>
              <div className="flex items-center">
                <div className="pl-4 flex items-center">
                  {loading ? (
                    <div className="h-5 w-5 rounded-full border-2 border-[#007AFF]/30 border-t-[#007AFF] animate-spin" />
                  ) : (
                    <Search className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your target audience..."
                  className="flex-1 px-3 py-4 text-base text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => { setQuery(''); setResults([]); setHasSearched(false) }}
                    className="pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Type filter pills */}
            {hasSearched && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-xs text-gray-400">Filter:</span>
                {['B2B', 'B2C'].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTypeFilter(t)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      typeFilter === t
                        ? 'bg-[#007AFF] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Searches */}
      {!hasSearched && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-center mb-4">
            Try a search
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTED_SEARCHES.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => handleSuggestionClick(label)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:border-[#007AFF]/30 hover:bg-[#007AFF]/5 hover:text-[#007AFF] transition-all"
              >
                <Icon className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
          {loading ? (
            <div className="space-y-3 max-w-3xl mx-auto">
              {/* AI thinking indicator */}
              <div className="flex items-center gap-2 py-2 px-1">
                <div className="flex gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#007AFF] animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-[#007AFF] animate-pulse" style={{ animationDelay: '200ms' }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-[#007AFF] animate-pulse" style={{ animationDelay: '400ms' }} />
                </div>
                <span className="text-sm text-gray-400">Finding matching audience segments...</span>
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/50 p-5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-32 bg-gray-100 rounded mb-3" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 max-w-md mx-auto">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900">No matching segments found</p>
              <p className="text-sm text-gray-500 mt-1">
                Try different keywords or a broader description
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {results.length} segment{results.length !== 1 ? 's' : ''} found
                  </span>
                  {searchType === 'semantic' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#007AFF]/5 px-2 py-0.5 text-[10px] font-medium text-[#007AFF]">
                      <Sparkles className="h-2.5 w-2.5" />
                      AI matched
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {results.map((seg, index) => (
                  <div
                    key={seg.segment_id}
                    className="group rounded-xl border border-gray-100 bg-white p-5 hover:border-[#007AFF]/20 hover:shadow-sm transition-all"
                    style={{
                      animation: 'fadeSlideUp 0.3s ease-out forwards',
                      animationDelay: `${index * 50}ms`,
                      opacity: 0,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{seg.name}</h3>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            seg.type === 'B2B'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}>
                            {seg.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1.5">
                          {seg.category}{seg.sub_category ? ` / ${seg.sub_category}` : ''}
                        </p>
                        {seg.description && (
                          <p className="text-sm text-gray-500 leading-relaxed">{seg.description}</p>
                        )}
                      </div>
                      {seg.similarity && (
                        <div className="text-right shrink-0">
                          <div className="text-xs font-medium text-[#007AFF]">
                            {Math.round(seg.similarity * 100)}%
                          </div>
                          <div className="text-[10px] text-gray-400">match</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-8 rounded-2xl bg-gradient-to-br from-gray-50 to-[#007AFF]/5 border border-gray-200 p-6 sm:p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Ready to reach this audience?
                </h3>
                <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
                  Get verified contact data — emails, phone numbers, and LinkedIn profiles — for any audience segment.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#007AFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0066DD] transition-colors shadow-sm"
                  >
                    Start Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/services/contact"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Talk to Sales
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Stats — only shown when not searching */}
      {!hasSearched && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">19,000+</div>
                <div className="text-xs text-gray-500 mt-1">Pre-built Segments</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">280M+</div>
                <div className="text-xs text-gray-500 mt-1">Contact Records</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">B2B & B2C</div>
                <div className="text-xs text-gray-500 mt-1">Audience Coverage</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">AI-Powered</div>
                <div className="text-xs text-gray-500 mt-1">Semantic Matching</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animation */}
      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
