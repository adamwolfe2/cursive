'use client'

import { useState, useEffect } from 'react'
import { SearchForm } from '@/components/people-search/search-form'
import { SearchResults } from '@/components/people-search/search-results'

interface SearchResult {
  id: string
  person_data: {
    first_name: string
    last_name: string
    full_name: string
    email: string
    email_revealed: boolean
    title?: string
    seniority?: string
    department?: string
    company_name?: string
    location?: string
    linkedin_url?: string
  }
}

export default function PeopleSearchPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [creditsRemaining, setCreditsRemaining] = useState(0)

  // Fetch credits on mount
  useEffect(() => {
    fetchCredits()
  }, [])

  const handleSearch = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/people-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            company: data.company,
            domain: data.domain,
            job_title: data.job_title,
            seniority: data.seniority,
            department: data.department,
            location: data.location,
          },
          save_search: data.save_search,
          search_name: data.search_name,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Search failed')
      }

      setResults(result.data.results)

      // Fetch user's current credits
      await fetchCredits()
    } catch (err: any) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/users/me')
      const data = await response.json()
      if (data.success) {
        setCreditsRemaining(data.data.credits_remaining)
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err)
    }
  }

  const handleEmailRevealed = () => {
    // Decrement credits locally
    setCreditsRemaining((prev) => Math.max(0, prev - 1))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-medium text-zinc-900">People Search</h1>
        <p className="mt-1 text-[13px] text-zinc-600">
          Find and connect with decision-makers at target companies
        </p>
      </div>

      {/* Credits Info */}
      <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-zinc-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-[13px] text-zinc-900">
              <span className="font-medium">{creditsRemaining}</span> credits remaining today
            </p>
          </div>
          <a
            href="/pricing"
            className="text-[13px] font-medium text-zinc-900 hover:text-zinc-700"
          >
            Get more credits →
          </a>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-[13px] font-medium text-red-900">Search Error</h3>
              <p className="mt-1 text-[13px] text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Layout: Search Form + Results */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Search Form (Left Sidebar) */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <SearchForm onSearch={handleSearch} loading={loading} />
          </div>
        </div>

        {/* Results (Main Content) */}
        <div className="lg:col-span-2">
          <SearchResults
            results={results}
            creditsRemaining={creditsRemaining}
            onEmailRevealed={handleEmailRevealed}
          />
        </div>
      </div>
    </div>
  )
}
