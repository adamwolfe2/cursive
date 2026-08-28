'use client'

/**
 * Platform-aware pixel install guide.
 *
 * Shows install steps for the buyer's actual stack (auto-detected at pixel
 * creation) instead of a generic "paste before </head>", and lets them switch
 * platforms from a logo grid when detection was wrong or inconclusive.
 */

import { useState } from 'react'
import { Check, Copy, ChevronDown } from 'lucide-react'
import {
  PLATFORM_GUIDES,
  getPlatformGuide,
  type PlatformSlug,
} from '@/lib/funnel/platform-detect'

/**
 * Brand mark via simple-icons' CDN, falling back to a brand-coloured letter
 * tile if the image fails. Avoids shipping a dozen hand-copied SVG paths
 * (which go stale and are easy to get subtly wrong) and adds no dependency.
 */
function PlatformLogo({
  icon,
  color,
  label,
  size = 20,
}: {
  icon: string | null
  color: string
  label: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)

  if (!icon || failed) {
    return (
      <span
        aria-hidden="true"
        style={{ background: `#${color}`, width: size, height: size }}
        className="inline-flex shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
      >
        {label.charAt(0)}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.simpleicons.org/${icon}/${color}`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

export function PlatformInstallGuide({
  snippet,
  platform,
  onPlatformChange,
}: {
  snippet: string
  /** Detected platform; null renders the picker open so they can choose. */
  platform: string | null
  /** Persist an override. Fire-and-forget; UI updates optimistically. */
  onPlatformChange?: (slug: PlatformSlug) => void
}) {
  const [selected, setSelected] = useState<string | null>(platform)
  const [pickerOpen, setPickerOpen] = useState(!platform)
  const [copied, setCopied] = useState(false)

  const guide = getPlatformGuide(selected)
  const detected = !!platform

  function choose(slug: PlatformSlug) {
    setSelected(slug)
    setPickerOpen(false)
    onPlatformChange?.(slug)
  }

  function copySnippet() {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Snippet */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">
            Your pixel snippet
          </span>
          <button
            type="button"
            onClick={copySnippet}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <code className="block break-all font-mono text-[11px] leading-relaxed text-gray-800">
          {snippet}
        </code>
      </div>

      {/* Selected platform + steps */}
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <PlatformLogo
              icon={guide.icon}
              color={guide.color}
              label={guide.label}
              size={22}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {guide.label}
              </p>
              <p className="text-xs text-gray-500">Goes in {guide.location}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            aria-expanded={pickerOpen}
          >
            {detected && selected === platform ? 'Not right?' : 'Change'}
            <ChevronDown
              size={12}
              className={pickerOpen ? 'rotate-180 transition' : 'transition'}
            />
          </button>
        </div>

        <ol className="mt-4 space-y-2">
          {guide.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        {guide.note && (
          <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-900">
            {guide.note}
          </p>
        )}
      </div>

      {/* Platform picker */}
      {pickerOpen && (
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="mb-3 text-xs font-medium text-gray-500">
            What is your site built on?
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PLATFORM_GUIDES.map((p) => {
              const active = p.slug === selected
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => choose(p.slug)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                    active
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <PlatformLogo
                    icon={p.icon}
                    color={active ? 'FFFFFF' : p.color}
                    label={p.label}
                    size={16}
                  />
                  <span className="truncate">{p.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
