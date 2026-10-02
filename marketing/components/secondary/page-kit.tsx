import { ArrowRight, Check } from "lucide-react"
import type { ReactNode } from "react"
import { SiteForm } from "@/components/homepage/start-hero"
import { Stage } from "@/components/homepage/stage"
import { H2, LEAD } from "@/components/homepage/type"
import { BOOKING_URL } from "@/lib/cta"

/*
 * Building blocks for the secondary marketing pages (/about, /platform, /pixel, /integrations, /faq, ...), so they
 * share the homepage's look: bold sentence-case headings, hairline rows instead of card grids, one Stage per
 * closing call to action. No client code here except what SiteForm brings; pages stay server components.
 */

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"

export const H1 =
  "mx-auto max-w-[20ch] text-[2.375rem] font-semibold leading-[1.08] tracking-[-0.035em] text-[#0f172a] sm:text-[3.5rem]"

/** Page opener: small label, the one H1, a lead paragraph and optional actions. */
export function PageHero({
  id,
  kicker,
  title,
  lead,
  children,
}: {
  id: string
  kicker?: string
  title: string
  lead: string
  children?: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="px-2 pt-2 sm:px-4 sm:pt-3">
      <Stage>
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center sm:py-24">
          {kicker && <p className="mb-5 text-[15px] font-semibold text-[#0066DD]">{kicker}</p>}
          <h1 id={id} className={H1}>
            {title}
          </h1>
          <p className={`mt-5 max-w-[52ch] text-balance sm:text-[19px] ${LEAD}`}>{lead}</p>
          {children && <div className="mt-9 flex flex-wrap items-center justify-center gap-3">{children}</div>}
        </div>
      </Stage>
    </section>
  )
}

/** A titled block with the homepage's section rhythm. */
export function Section({
  id,
  title,
  lead,
  children,
  className = "",
}: {
  id: string
  title: string
  lead?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={`scroll-mt-20 px-6 pt-20 sm:pt-28 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <h2 id={`${id}-heading`} className={`max-w-[24ch] ${H2}`}>
          {title}
        </h2>
        {lead && <p className={`mt-4 max-w-[56ch] ${LEAD}`}>{lead}</p>}
        {children}
      </div>
    </section>
  )
}

export interface Row {
  title: string
  body: string
  /** Small blue label shown beside the title on wide screens. */
  tag?: string
  href?: string
  cta?: string
}

/** Hairline rows: a short title on the left, the explanation on the right. The homepage "plan guide" pattern. */
export function Rows({ rows }: { rows: Row[] }) {
  return (
    <ul className="mt-10 border-t border-[#e2e8f0]">
      {rows.map((r) => {
        const external = r.href?.startsWith("http")
        return (
          <li
            key={r.title}
            className="grid gap-3 border-b border-[#e2e8f0] py-7 md:grid-cols-[1fr_1.6fr_9.5rem] md:items-start md:gap-10"
          >
            <div>
              <p className="text-[19px] font-semibold leading-snug text-[#0f172a]">{r.title}</p>
              {r.tag && <p className="mt-1 text-[14px] font-semibold text-[#0066DD]">{r.tag}</p>}
            </div>
            <p className="max-w-[56ch] text-[16px] leading-relaxed text-[#475569]">{r.body}</p>
            {r.href && r.cta ? (
              <a
                href={r.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-md text-[15px] font-semibold text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 transition-colors hover:decoration-[#007AFF] md:justify-self-end ${FOCUS}`}
              >
                {r.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <span />
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Short checked list inside a Stage-less block. */
export function Checks({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-2.5">
      {items.map((p) => (
        <li key={p} className="flex items-start gap-2.5 text-[16px] text-[#334155]">
          <Check className="mt-1 h-4 w-4 shrink-0 text-[#007AFF]" aria-hidden="true" />
          {p}
        </li>
      ))}
    </ul>
  )
}

/** Numbered steps in three columns on wide screens, stacked on phones. */
export function Steps({ steps }: { steps: Array<{ title: string; body: string }> }) {
  return (
    <ol className="mt-10 grid gap-px overflow-hidden rounded-[28px] border border-[#e3eeff] bg-[#e3eeff] md:grid-cols-3">
      {steps.map((s, i) => (
        <li key={s.title} className="bg-white p-6 sm:p-8">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#007AFF] text-[14px] font-semibold text-white">
            {i + 1}
          </span>
          <h3 className="mt-5 text-[19px] font-semibold text-[#0f172a]">{s.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-[#475569]">{s.body}</p>
        </li>
      ))}
    </ol>
  )
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith("http")
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`inline-flex h-12 items-center gap-2 rounded-xl border border-[#d6e4f7] bg-white px-5 text-[15px] font-semibold text-[#0f172a] transition-colors hover:border-[#007AFF] ${FOCUS}`}
    >
      {children}
    </a>
  )
}

export { BOOKING_URL }

/** The canonical closing block: same Stage, same form, same label as the homepage and /pricing. */
export function FinalCta({
  id,
  placement,
  title = "Get your 25 leads in about a minute",
  sub = "Free, no card, no sales call.",
}: {
  id: string
  placement: string
  title?: string
  sub?: string
}) {
  return (
    <section aria-labelledby={id} className="px-2 pb-20 pt-20 sm:px-4 sm:pb-28 sm:pt-28">
      <Stage className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
          <h2 id={id} className={H2}>
            {title}
          </h2>
          <p className={`mt-3 ${LEAD}`}>{sub}</p>
          <SiteForm placement={placement} className="mx-auto mt-8" />
        </div>
      </Stage>
    </section>
  )
}
