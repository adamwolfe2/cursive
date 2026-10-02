"use client"

import { useEffect } from "react"
import Link from "next/link"
import { QuickLinks, StatePage, primaryAction, secondaryAction } from "@/components/header/state-page"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Marketing site error:", error)
  }, [error])

  return (
    <StatePage
      kicker="Something broke on our side"
      title="This page did not load"
      body="Try again. If it keeps happening, tell us at hey@meetcursive.com and include the error ID below."
      actions={
        <>
          <button type="button" onClick={reset} className={primaryAction}>
            Try again
          </button>
          <Link href="/" className={secondaryAction}>
            Back to home
          </Link>
        </>
      }
      footnote={
        <>
          {error.digest && (
            <p className="mt-8 font-mono text-xs text-[#64748b]">Error ID: {error.digest}</p>
          )}
          <QuickLinks links={[{ href: "/pricing", label: "Pricing" }, { href: "/contact", label: "Contact" }]} />
        </>
      }
    />
  )
}
