/**
 * Partner Program — outbound distribution partner one-pager.
 *
 * Recruits partners to drive traffic to the Cursive offers and earn recurring
 * commission (15% → 40%) on the MRR they generate. The apply form posts to the
 * app's /api/affiliate/apply (CORS-allowed for meetcursive.com). Approved
 * partners are emailed a portal link to sign the agreement and grab links.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { Check, Link2, Send, TrendingUp, Wallet } from "lucide-react"
import { Container } from "@/components/ui/container"
import { PartnerApplyForm } from "@/components/partner-apply-form"
import { RAMP_TIERS } from "@/lib/partner-program"
import { BOOKING_URL } from "@/lib/cta"

export const metadata: Metadata = {
  title: "Partner Program | Cursive",
  description:
    "Become a Cursive distribution partner. Drive traffic to our self-serve offers and earn 15%–40% recurring commission on the MRR you generate. Your own portal, links, and payouts.",
  alternates: { canonical: "https://www.meetcursive.com/partners" },
  openGraph: {
    title: "Partner Program | Cursive",
    description:
      "Earn 15%–40% recurring commission driving traffic to Cursive. Your own partner portal, referral links, and monthly Stripe payouts.",
    url: "https://www.meetcursive.com/partners",
    siteName: "Cursive",
    type: "website",
  },
}

const STEPS = [
  {
    icon: Send,
    title: "Apply & get approved",
    body: "Tell us how you'll promote. Approved partners get a unique referral code and a portal login.",
  },
  {
    icon: Link2,
    title: "Share your links",
    body: "Drop your tracked links into outbound, LinkedIn, your newsletter, DMs — anywhere. You own the channel.",
  },
  {
    icon: TrendingUp,
    title: "They sign up & pay",
    body: "Anyone who signs up through your link is attributed to you server-side. When they pay, you earn.",
  },
  {
    icon: Wallet,
    title: "Get paid monthly",
    body: "Recurring commission on their MRR, every month they stay. Paid via Stripe, automatically.",
  },
]

const GET = [
  "Your own partner portal — revenue, payouts, achievements, next-tier progress",
  "Tracked referral links for every offer, VSL, and lead magnet",
  "Swipe copy for cold email and LinkedIn, ready to send",
  "Server-side attribution — no lost credit, no manual tracking",
  "Monthly Stripe payouts once you're set up",
  "A binding agreement you sign right in your portal",
]

const EXPECTED = [
  "You own your outbound — channels, infrastructure, and costs are yours",
  "Drive real signups through your link; the conversion point is a paid subscription",
  "Promote honestly and compliantly (no spam, no false claims)",
  "That's it — no quotas, no exclusivity, cancel anytime",
]

const FAQS = [
  {
    q: "How much can I actually make?",
    a: "You earn your current rate on the recurring revenue of every customer you refer, every month they stay subscribed. On the $247 bundle, 5 active payers at 20% is ~$247/mo; 15 at 25% is ~$926/mo; 45 at 40% is ~$4,446/mo. It compounds because it's recurring.",
  },
  {
    q: "When does my rate go up?",
    a: "Your rate is set by how many of your referrals are currently paying: 15% to start, 20% at 5, 25% at 15, 30% at 25, 35% at 35, and 40% at 45+. When you cross a threshold, the higher rate applies to your whole active book.",
  },
  {
    q: "How do I get paid?",
    a: "Through Stripe Connect, monthly, for balances over $50. You connect Stripe and sign the agreement in your portal, and payouts run automatically. Applicable tax forms are issued via Stripe.",
  },
  {
    q: "What if a customer cancels?",
    a: "Commission stops when they stop paying, and your active-paying count (which sets your rate) goes down accordingly. Refunds and chargebacks are netted from future commissions.",
  },
  {
    q: "Is there a cost to join?",
    a: "No. It's free to become a partner. You cover your own outbound and infrastructure; we handle the product, billing, tracking, and payouts.",
  },
] as const

export default function PartnersPage() {
  return (
    <article className="bg-white text-gray-900">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-gray-100 pt-20 pb-16 sm:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/40 via-white to-white"
        />
        <Container className="relative max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Partner Program
          </p>
          <h1 className="mt-5 text-4xl font-light leading-[1.1] tracking-tight text-gray-900 sm:text-5xl">
            Sell a product that sells itself. Earn up to 40% recurring.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Cursive turns website traffic into identified leads — a $97–$247/mo offer that converts
            itself. Drive people to it, and earn recurring commission on every customer you bring, for
            as long as they stay.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#apply"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Become a partner <span aria-hidden>→</span>
            </Link>
            <Link
              href="#ramp"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400"
            >
              See the commission ramp
            </Link>
          </div>
        </Container>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 py-16 sm:py-20">
        <Container className="max-w-5xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">How it works</p>
            <h2 className="mt-4 text-3xl font-light tracking-tight text-gray-900">
              Four steps. No quotas. No exclusivity.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.title} className="rounded-2xl border border-gray-200 p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-primary">Step {i + 1}</p>
                  <h3 className="mt-1 text-base font-medium text-gray-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.body}</p>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* ── The ramp ─────────────────────────────────────────────────────── */}
      <section id="ramp" className="border-b border-gray-100 py-16 sm:py-20">
        <Container className="max-w-5xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">The ramp</p>
            <h2 className="mt-4 text-3xl font-light tracking-tight text-gray-900">
              The more you bring, the more you keep.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
              Your rate is set by how many of your referrals are currently paying. Cross a threshold and
              the higher rate applies to your entire active book — not just new referrals.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {RAMP_TIERS.map((tier) => (
              <div key={tier.rate} className="rounded-xl border border-gray-200 p-5 text-center">
                <div className="text-3xl font-light text-primary">{tier.rate}%</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{tier.label}</div>
                <div className="mt-2 text-xs text-gray-500">{tier.range} paying referrals</div>
              </div>
            ))}
          </div>

          {/* Earnings example */}
          <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              What that looks like on the $247 bundle
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ExampleStat payers="5 active payers" rate="20%" monthly="~$247 / mo" />
              <ExampleStat payers="15 active payers" rate="25%" monthly="~$926 / mo" />
              <ExampleStat payers="45 active payers" rate="40%" monthly="~$4,446 / mo" />
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Recurring — paid every month each customer stays subscribed. Illustrative; actual earnings
              depend on what your referrals buy and retain.
            </p>
          </div>
        </Container>
      </section>

      {/* ── What you get / what's expected ───────────────────────────────── */}
      <section className="border-b border-gray-100 py-16 sm:py-20">
        <Container className="max-w-5xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-light tracking-tight text-gray-900">What you get</h2>
              <ul className="mt-6 space-y-3">
                {GET.map((g) => (
                  <li key={g} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-light tracking-tight text-gray-900">What we expect</h2>
              <ul className="mt-6 space-y-3">
                {EXPECTED.map((g) => (
                  <li key={g} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-gray-500">
                Full terms are in the{" "}
                <Link href="/partners/terms" className="font-medium text-primary hover:underline">
                  Partner Agreement
                </Link>
                , which you sign in your portal after approval.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Apply ────────────────────────────────────────────────────────── */}
      <section id="apply" className="border-b border-gray-100 py-16 sm:py-20">
        <Container className="max-w-2xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Apply</p>
            <h2 className="mt-4 text-3xl font-light tracking-tight text-gray-900">
              Become a Cursive partner.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-gray-600">
              Takes two minutes. We review every application personally.
            </p>
          </div>
          <PartnerApplyForm />
        </Container>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 py-16 sm:py-20">
        <Container className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">FAQ</p>
          <h2 className="mt-4 text-3xl font-light tracking-tight text-gray-900">Partner FAQ.</h2>
          <dl className="mt-10 divide-y divide-gray-100 border-y border-gray-100">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="grid grid-cols-1 gap-4 py-7 sm:grid-cols-[260px_1fr] sm:gap-10"
              >
                <dt className="text-base font-medium leading-snug text-gray-900">{faq.q}</dt>
                <dd className="text-[0.95rem] leading-relaxed text-gray-700">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <Container className="max-w-3xl text-center">
          <h2 className="text-3xl font-light tracking-tight text-gray-900">
            Start earning on every lead you send.
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#apply"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Apply now <span aria-hidden>→</span>
            </Link>
            <Link
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400"
            >
              Have questions? Book a call
            </Link>
          </div>
        </Container>
      </section>
    </article>
  )
}

function ExampleStat({ payers, rate, monthly }: { payers: string; rate: string; monthly: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
      <p className="text-xs text-gray-500">{payers}</p>
      <p className="mt-1 text-xs font-medium text-primary">{rate} rate</p>
      <p className="mt-2 text-xl font-semibold text-gray-900">{monthly}</p>
    </div>
  )
}
