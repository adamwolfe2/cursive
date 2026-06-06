'use client'

import { useState } from 'react'
import {
  TESTIMONIALS,
  REVIEW_COUNT,
  headshotUrl,
  type Testimonial,
} from './testimonials-data'

/** Initials for the avatar fallback. */
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

/** Real (non-AI) headshot with a graceful initials fallback if it fails to load. */
function Headshot({ t, index }: { t: Testimonial; index: number }) {
  const [errored, setErrored] = useState(false)
  if (errored) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-xs font-semibold text-white">
        {initials(t.name)}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={headshotUrl(t, index)}
      alt={t.name}
      width={40}
      height={40}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className="h-10 w-10 shrink-0 rounded-full bg-gray-100 object-cover"
    />
  )
}

function Card({ t, index }: { t: Testimonial; index: number }) {
  return (
    <figure className="flex w-[320px] shrink-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:w-[360px]">
      <Stars rating={t.rating} />
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-gray-700">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <Headshot t={t} index={index} />
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

/** One marquee row: cards duplicated so the -50% translate loops seamlessly. */
function MarqueeRow({
  items,
  reverse,
  durationSec,
}: {
  items: { t: Testimonial; index: number }[]
  reverse?: boolean
  durationSec: number
}) {
  return (
    <div className="cursive-marquee overflow-hidden">
      <div
        className="cursive-marquee__track flex w-max gap-4"
        style={{
          animation: `cursiveMarqueeScroll ${durationSec}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        {[...items, ...items].map(({ t, index }, i) => (
          <Card key={`${t.name}-${i}`} t={t} index={index} />
        ))}
      </div>
    </div>
  )
}

/**
 * Social-proof ticker. Two rows slide in opposite directions and pause on
 * hover so a reader can stop on any card. Cards are duplicated within each row
 * for a seamless infinite loop.
 */
export function Testimonials() {
  const indexed = TESTIMONIALS.map((t, index) => ({ t, index }))
  const mid = Math.ceil(indexed.length / 2)
  const rowA = indexed.slice(0, mid)
  const rowB = indexed.slice(mid)

  return (
    <section className="mb-16">
      {/* Scoped marquee keyframes + hover-pause. */}
      <style>{`
        @keyframes cursiveMarqueeScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .cursive-marquee:hover .cursive-marquee__track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .cursive-marquee__track { animation: none !important; }
        }
      `}</style>

      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Stars rating={5} />
          <span className="text-sm font-semibold text-gray-900">
            5.0/5 · {REVIEW_COUNT} reviews
          </span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          Teams turning anonymous traffic into pipeline
        </h2>
      </div>

      {/* Edge fade so cards enter/exit cleanly. */}
      <div className="relative space-y-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-24" />
        <MarqueeRow items={rowA} durationSec={70} />
        <MarqueeRow items={rowB} reverse durationSec={80} />
      </div>
    </section>
  )
}
