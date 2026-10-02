import { ArrowRight } from "lucide-react"
import { BOOKING_URL, startUrl } from "@/lib/cta"
import { H2 } from "@/components/homepage/type"

/* "Which one is for me?": the question every pricing page has to answer. One row per situation, not cards. */
const ROWS: Array<{ when: string; pick: string; why: string; href: string; cta: string }> = [
  {
    when: "You want a list your team will work",
    pick: "Find them",
    why: "Buy credits and pull leads when you need them, or get 25 fresh ones every Monday on Starter.",
    href: startUrl("pricing-guide-find"),
    cta: "Get my 25 leads",
  },
  {
    when: "You want meetings, not a spreadsheet",
    pick: "Reach them",
    why: "We write and run LinkedIn and email outreach to the list you shaped, and hand you the replies.",
    href: BOOKING_URL,
    cta: "Book a call",
  },
  {
    when: "Your pipeline lives in five tools",
    pick: "Run it",
    why: "One dashboard for leads, replies, site visitors, chat and CRM, built around how you sell.",
    href: BOOKING_URL,
    cta: "Book a call",
  },
]

export function PlanGuide() {
  return (
    <section aria-labelledby="guide-heading" className="px-6 pt-20 sm:pt-28">
      <div className="mx-auto max-w-6xl">
        <h2 id="guide-heading" className={H2}>
          Which one is for you?
        </h2>
        <ul className="mt-10 border-t border-[#e2e8f0]">
          {ROWS.map((r) => (
            <li key={r.pick} className="grid gap-3 border-b border-[#e2e8f0] py-7 md:grid-cols-[1.1fr_0.6fr_1.4fr_9.5rem] md:items-center md:gap-8">
              <p className="text-[19px] font-semibold leading-snug text-[#0f172a]">{r.when}</p>
              <p className="text-[15px] font-semibold text-[#0066DD]">{r.pick}</p>
              <p className="max-w-[52ch] text-[15px] leading-relaxed text-[#475569]">{r.why}</p>
              <a
                href={r.href}
                {...(r.href === BOOKING_URL ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap md:justify-self-end rounded-md text-[15px] font-semibold text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 transition-colors hover:decoration-[#007AFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
              >
                {r.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
