'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'

export function HowWeFindLeads() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-blue-50 transition-colors"
        aria-expanded={open}
      >
        <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        <span className="text-xs font-medium text-blue-700 flex-1">How we find your leads</span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-blue-400 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-blue-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-3 pt-0.5 text-xs text-blue-800 space-y-1.5">
          <p>
            We match verified leads from our database to your industry and target
            locations, then score them for quality. New leads arrive every morning at 8am CT.
          </p>
          <p>
            <Link href="/settings" className="font-medium underline underline-offset-1 hover:text-blue-900 transition-colors">
              Adjust targeting →
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
