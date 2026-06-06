'use client'

import { useState } from 'react'
import { TESTIMONIALS, type Testimonial } from './testimonials-data'

/** Initials for the avatar chip. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.76 1.69-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.78.57-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 00-.36-1.12L1.4 9.6c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69L9.05 2.93z" />
        </svg>
      ))}
    </div>
  )
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="mb-4 break-inside-avoid rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <Stars rating={t.rating} />
      <blockquote className="mt-3 text-sm leading-relaxed text-gray-700">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-xs font-semibold text-white">
          {initials(t.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {t.name}
          </p>
          <p className="truncate text-xs text-gray-500">
            {t.title} · {t.company}
          </p>
        </div>
      </figcaption>
    </figure>
  )
}

/**
 * Social-proof wall. Shows a compact set by default; "Show more" reveals all
 * (keeps the landing page short on mobile while the full wall is one tap away).
 */
export function Testimonials() {
  const [expanded, setExpanded] = useState(false)
  const INITIAL = 6
  const visible = expanded ? TESTIMONIALS : TESTIMONIALS.slice(0, INITIAL)
  const avg = (
    TESTIMONIALS.reduce((s, t) => s + t.rating, 0) / TESTIMONIALS.length
  ).toFixed(1)

  return (
    <section className="mb-16">
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Stars rating={5} />
          <span className="text-sm font-semibold text-gray-900">
            {avg}/5 · {TESTIMONIALS.length} reviews
          </span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          Teams turning anonymous traffic into pipeline
        </h2>
      </div>

      {/* CSS-columns masonry: 1 col mobile → 2 → 3, no row-height jaggedness. */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {visible.map((t) => (
          <Card key={`${t.name}-${t.company}`} t={t} />
        ))}
      </div>

      {TESTIMONIALS.length > INITIAL && (
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {expanded
              ? 'Show fewer'
              : `Show all ${TESTIMONIALS.length} reviews`}
            <svg
              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        </div>
      )}
    </section>
  )
}
