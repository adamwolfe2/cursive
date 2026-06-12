"use client"

import { useState } from "react"
import {
  TESTIMONIALS,
  REVIEW_COUNT,
  headshotUrl,
  type Testimonial,
} from "./testimonials-data"

/** Initials for the avatar fallback. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "xs" }) {
  const cls = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5"
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`${cls} ${i < rating ? "text-amber-400" : "text-gray-200"}`}
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-[11px] font-semibold text-white">
        {initials(t.name)}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={headshotUrl(t, index)}
      alt={t.name}
      width={32}
      height={32}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className="h-8 w-8 shrink-0 rounded-full bg-gray-100 object-cover"
    />
  )
}

function Card({ t, index }: { t: Testimonial; index: number }) {
  return (
    <figure className="flex w-[248px] shrink-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:w-[272px]">
      <Stars rating={t.rating} size="xs" />
      <blockquote className="mt-2 flex-1 text-[13px] leading-relaxed text-gray-700">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-3 flex items-center gap-2.5">
        <Headshot t={t} index={index} />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-gray-900">
            {t.name}
          </p>
          <p className="truncate text-[11px] text-gray-500">
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
        className="cursive-marquee__track flex w-max gap-3"
        style={{
          animation: `cursiveMarqueeScroll ${durationSec}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
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
 * Homepage social-proof ticker. Two compact rows slide in opposite directions
 * and pause on hover so a reader can stop on any card. Cards are duplicated
 * within each row for a seamless infinite loop.
 *
 * NOTE: testimonials in ./testimonials-data are fictitious placeholders with
 * licensed stock headshots — swap for verified customer reviews when available.
 */
export function TestimonialsSection() {
  const indexed = TESTIMONIALS.map((t, index) => ({ t, index }))
  const mid = Math.ceil(indexed.length / 2)
  const rowA = indexed.slice(0, mid)
  const rowB = indexed.slice(mid)

  return (
    <section className="overflow-hidden border-t border-gray-100 bg-white py-16">
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

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Stars rating={5} />
            <span className="text-sm font-semibold text-gray-900">
              5.0/5 · {REVIEW_COUNT} reviews
            </span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-gray-900 sm:text-4xl">
            Teams turning anonymous traffic into pipeline
          </h2>
        </div>
      </div>

      {/* Full-bleed marquee with edge fades so cards enter/exit cleanly. */}
      <div className="relative space-y-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-24" />
        <MarqueeRow items={rowA} durationSec={70} />
        <MarqueeRow items={rowB} reverse durationSec={80} />
      </div>
    </section>
  )
}
