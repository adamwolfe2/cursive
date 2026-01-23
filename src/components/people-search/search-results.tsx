'use client'

import { useState } from 'react'
import { EmailRevealButton } from './email-reveal-button'

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

interface SearchResultsProps {
  results: SearchResult[]
  creditsRemaining: number
  onEmailRevealed: () => void
}

export function SearchResults({
  results,
  creditsRemaining,
  onEmailRevealed,
}: SearchResultsProps) {
  const [revealedEmails, setRevealedEmails] = useState<Record<string, string>>({})

  const handleReveal = (resultId: string, email: string) => {
    setRevealedEmails((prev) => ({ ...prev, [resultId]: email }))
    onEmailRevealed()
  }

  if (results.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 className="mt-2 text-[13px] font-medium text-zinc-900">
          No results yet
        </h3>
        <p className="mt-1 text-[13px] text-zinc-600">
          Enter search criteria and click &quot;Search People&quot; to find contacts
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-zinc-900">
          {results.length} {results.length === 1 ? 'result' : 'results'} found
        </h3>
        <div className="text-[13px] text-zinc-600">
          Credits remaining: <span className="font-medium text-zinc-900">{creditsRemaining}</span>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {results.map((result) => {
                const person = result.person_data
                const isRevealed = person.email_revealed || !!revealedEmails[result.id]
                const displayEmail = revealedEmails[result.id] || person.email

                return (
                  <tr key={result.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-[13px] text-zinc-900">
                            {person.full_name}
                          </div>
                          {person.seniority && (
                            <div className="text-[12px] text-zinc-500">
                              {person.seniority}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-zinc-900">
                        {person.title || 'N/A'}
                      </div>
                      {person.department && (
                        <div className="text-[12px] text-zinc-500">
                          {person.department}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-zinc-900">
                        {person.company_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-zinc-900">
                        {person.location || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <EmailRevealButton
                        resultId={result.id}
                        maskedEmail={person.email}
                        revealed={isRevealed}
                        onReveal={handleReveal}
                        creditsAvailable={creditsRemaining > 0}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {person.linkedin_url && (
                          <a
                            href={person.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-600 hover:text-zinc-900 transition-colors"
                            title="View LinkedIn Profile"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credits Warning */}
      {creditsRemaining === 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-[13px] font-medium text-amber-900">
                No credits remaining
              </h3>
              <div className="mt-2 text-[13px] text-amber-800">
                <p>
                  You&apos;ve used all your credits for today. Credits reset at midnight,
                  or{' '}
                  <a
                    href="/pricing"
                    className="font-medium underline hover:text-amber-900"
                  >
                    upgrade to Pro
                  </a>{' '}
                  for 1000 credits per day.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
