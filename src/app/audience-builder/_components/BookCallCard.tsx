'use client'

import { ArrowRight, Calendar } from 'lucide-react'

const BOOK_URL =
  'https://cal.com/meetcursive/intro?utm_source=audience-builder&utm_medium=copilot'

interface BookCallCardProps {
  headline?: string
  body?: string
  cta?: string
  variant?: 'default' | 'compact'
}

/**
 * Branded inline card nudging the user to book a 15-min call.
 * Rendered inside the conversation after the first assistant reply
 * and at key limit-reached moments.
 */
export function BookCallCard({
  headline = 'Ready to activate an audience?',
  body = 'Book a 15-min call and our team will map these segments to live in-market counts and get them plugged into your outbound stack.',
  cta = 'Book a call',
  variant = 'default',
}: BookCallCardProps) {
  const isCompact = variant === 'compact'

  return (
    <div
      className={`rounded-xl border border-blue-200 bg-blue-50/50 ${
        isCompact ? 'p-3' : 'p-4 sm:p-5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 ${
            isCompact ? 'h-8 w-8' : 'h-10 w-10'
          }`}
        >
          <Calendar className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`font-semibold text-[#0F172A] ${
              isCompact ? 'text-sm' : 'text-[15px]'
            }`}
          >
            {headline}
          </p>
          <p
            className={`mt-1 text-slate-600 ${
              isCompact ? 'text-xs' : 'text-[13px] leading-relaxed'
            }`}
          >
            {body}
          </p>
          <a
            href={BOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 ${
              isCompact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
            }`}
          >
            {cta}
            <ArrowRight className={isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </a>
        </div>
      </div>
    </div>
  )
}
