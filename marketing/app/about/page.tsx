import { PageHero, Section, Rows, Checks, SecondaryLink, FinalCta, BOOKING_URL, type Row } from "@/components/secondary/page-kit"
import { startUrl } from "@/lib/cta"

/*
 * About: what Cursive is and how we work, in the find / reach / run frame (.claude/specs/2026-10-01-cursive-pivot.md).
 * Only claims we can stand behind: no customer counts, team size, funding, match rates or certifications.
 */

const WHAT_WE_DO: Row[] = [
  {
    title: "Find them",
    tag: "Free to start",
    body: "Paste your website. We work out who buys from you and send 25 decision makers, each with a checked work email and a line on why they fit. Like the good ones, skip the rest, add past customers, and the next batch gets closer.",
    href: startUrl("about-find"),
    cta: "Get my 25 leads",
  },
  {
    title: "Reach them",
    tag: "Done for you",
    body: "We write and run LinkedIn and email outreach to the same list, inside each platform's limits, and hand you the replies. You take the meetings.",
    href: "/pricing",
    cta: "See pricing",
  },
  {
    title: "Run it",
    tag: "Built for you",
    body: "A dashboard for your company that ties together leads, replies, site visitors, your site chat, your CRM and any API you use. We build it, host it and keep it up.",
    href: BOOKING_URL,
    cta: "Book a call",
  },
]

const PRINCIPLES = [
  "Checked, or left out. If we cannot check a person's work email, they are not in your list and do not count against your leads.",
  "Show the reason. Every lead says why it fits, so you can judge the match yourself instead of trusting a score.",
  "Prices in the open. Every plan and price is on the pricing page, and every plan is month-to-month.",
  "Start small. The first 25 are free with no card, so you see the work before you pay for any of it.",
]

export default function AboutPage() {
  return (
    <div className="bg-white">
      <PageHero
        id="about-title"
        kicker="About Cursive"
        title="We built the lead tool we wanted to buy"
        lead="Most lead tools sell you a database and leave the rest to you. Cursive starts from who actually buys from you, gets closer with every batch, and can run the outreach too."
      >
        <SecondaryLink href={BOOKING_URL}>Book a call</SecondaryLink>
      </PageHero>

      <Section
        id="what-we-do"
        title="Find them. Reach them. Run it."
        lead="Cursive finds your buyers, reaches them for you, and gives you the system to run it. Start at the first step and climb only when you want to."
      >
        <Rows rows={WHAT_WE_DO} />
      </Section>

      <Section
        id="recursive"
        title="Why we are called Cursive"
        lead="Recursive means repeating a process where each pass starts from the result of the last one. That is how a lead list should work."
      >
        <p className="mt-6 max-w-[60ch] text-[17px] leading-relaxed text-[#475569]">
          Every like, every skip and every past customer you add shapes the next 25. A list you buy once does not learn.
          A list built this way gets closer to your ideal buyer with every batch.
        </p>
      </Section>

      <Section id="how-we-work" title="How we work" lead="Four rules we hold ourselves to.">
        <Checks items={PRINCIPLES} />
      </Section>

      <Section id="contact" title="Talk to us">
        <p className="mt-4 max-w-[56ch] text-[17px] leading-relaxed text-[#475569]">
          Questions about a list, outreach or a dashboard go straight to the team that builds them. Email{" "}
          <a
            href="mailto:hey@meetcursive.com"
            className="font-semibold text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 hover:decoration-[#007AFF]"
          >
            hey@meetcursive.com
          </a>{" "}
          or book a call.
        </p>
      </Section>

      <FinalCta id="about-cta" placement="about-final-cta" />
    </div>
  )
}
