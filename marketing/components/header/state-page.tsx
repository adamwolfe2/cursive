import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { Stage } from "@/components/homepage/stage"
import { H2, LEAD } from "@/components/homepage/type"
import { START_CTA_LABEL, startUrl } from "@/lib/cta"
import { FOCUS_RING } from "./nav-icons"

/** Shared frame for the 404 and error screens, in the same light Stage the homepage uses. */
export function StatePage({
  kicker,
  title,
  body,
  actions,
  footnote,
}: {
  kicker: string
  title: string
  body: string
  actions?: ReactNode
  footnote?: ReactNode
}) {
  return (
    <section aria-labelledby="state-title" className="px-2 py-4 sm:px-4">
      <div className="mx-auto max-w-7xl">
        <Stage>
          <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
            <p className="text-[15px] font-semibold text-[#0066DD]">{kicker}</p>
            <h1 id="state-title" className={`${H2} mt-3`}>
              {title}
            </h1>
            <p className={`mt-4 max-w-[46ch] text-balance ${LEAD}`}>{body}</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">{actions}</div>
            {footnote}
          </div>
        </Stage>
      </div>
    </section>
  )
}

const BTN = "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors"

export const primaryAction = `${BTN} bg-[#007AFF] text-white hover:bg-[#0066DD] ${FOCUS_RING}`
export const secondaryAction = `${BTN} border border-[#d6e4f7] bg-white text-[#0f172a] hover:border-[#007AFF] ${FOCUS_RING}`

export function StartLeadsLink({ placement }: { placement: string }) {
  return (
    <a href={startUrl(placement)} className={primaryAction}>
      {START_CTA_LABEL}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  )
}

export function QuickLinks({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px]">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className={`rounded-md font-medium text-[#334155] underline-offset-4 hover:text-[#007AFF] hover:underline ${FOCUS_RING}`}>
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
