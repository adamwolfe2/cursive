"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Users, Layers, Mail, CalendarCheck, Clock,
  ArrowRight, Check, CheckCircle2, type LucideIcon,
} from "lucide-react"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { GET_LEADS_URL, BOOKING_URL } from "@/lib/cta"

const EASE = [0.22, 1, 0.36, 1] as const

function IconChip({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

const expectations: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Mail, title: "Check your inbox", body: "A calendar invite is on its way. Accept it so the time is locked in for both of us." },
  { icon: Clock, title: "30 focused minutes", body: "We'll map your ICP, look at live matches in our data, and recommend the right plan. No hard sell." },
  { icon: CalendarCheck, title: "Come prepared", body: "Install the pixel below before we talk and we'll review your real visitors together on the call." },
]

const plans: Array<{
  name: string
  price: string
  icon: LucideIcon
  description: string
  items: string[]
  cta: string
  highlight: boolean
}> = [
  {
    name: "Visitor Pixel",
    price: "$97",
    icon: Eye,
    description: "Identify the companies and people visiting your site.",
    items: [
      "40–60% deterministic match rate",
      "Company + person-level detail",
      "One-snippet install, 60 seconds",
    ],
    cta: "Install the Pixel",
    highlight: false,
  },
  {
    name: "Pixel + Audience Bundle",
    price: "$247",
    icon: Layers,
    description: "Site traffic and in-market intent in one feed.",
    items: [
      "Everything in Visitor Pixel",
      "Everything in Custom Audience",
      "Best value vs. buying separately",
    ],
    cta: "Get the Bundle",
    highlight: true,
  },
  {
    name: "Custom Audience",
    price: "$197",
    icon: Users,
    description: "A fresh weekly list of buyers searching for your product.",
    items: [
      "Weekly list of in-market prospects",
      "Built to your exact ICP",
      "First audience within 24 hours",
    ],
    cta: "Get an Audience",
    highlight: false,
  },
]

export default function CallBookedPage() {
  return (
    <>
      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Call Booked", href: "/call-booked" },
            ]} />
          </div>

          {/* Hero — confirmation */}
          <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="text-center max-w-3xl mx-auto"
              >
                <div className="mx-auto mb-8 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  You&apos;re in.
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    Your call is booked
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  We just sent a calendar invite to your inbox — accept it to confirm. In the
                  meantime, you don&apos;t have to wait to see Cursive work.
                </p>
              </motion.div>
            </Container>
          </section>

          {/* What to expect on the call */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <div className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900">
                  What to expect
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    on the call
                  </span>
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {expectations.map((e, i) => (
                  <motion.div
                    key={e.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={e.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{e.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{e.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* While you wait — self-serve plans */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <div className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900">
                  While you wait
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    see your visitors now
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Install the Visitor Pixel in 60 seconds and walk into the call already seeing who&apos;s
                  on your site. Self-serve, month-to-month, cancel anytime.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
                {plans.map((plan, i) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className={`relative flex flex-col rounded-2xl p-6 sm:p-8 transition-shadow ${
                      plan.highlight
                        ? "bg-white border border-primary shadow-lg ring-1 ring-primary/20"
                        : "bg-white border border-gray-200 hover:shadow-lg"
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white whitespace-nowrap">
                        Most Popular
                      </span>
                    )}
                    <IconChip Icon={plan.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-light text-gray-900">{plan.price}</span>
                      <span className="text-sm text-gray-500">/mo</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{plan.description}</p>
                    <ul className="mt-5 space-y-2.5 flex-1">
                      {plan.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      href={GET_LEADS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant={plan.highlight ? "default" : "outline"}
                      className="w-full mt-8"
                    >
                      {plan.cta}
                    </Button>
                  </motion.div>
                ))}
              </div>
              <p className="mt-8 text-center text-sm text-gray-500">
                No setup fee. No long-term contract. Cancel anytime.
              </p>
            </Container>
          </section>

          {/* Closing CTA */}
          <section className="py-20 sm:py-28 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE }}
                className="text-center max-w-2xl mx-auto"
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900">
                  Don&apos;t wait for the
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    call to get started
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Install the pixel in 60 seconds. Plans from $97/mo, month-to-month, cancel anytime.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                    Manage Your Booking
                  </Button>
                </div>
                <p className="mt-8 text-sm text-gray-400">
                  Questions before your call? Email{" "}
                  <a href="mailto:hey@meetcursive.com" className="text-primary hover:underline">
                    hey@meetcursive.com
                  </a>
                </p>
              </motion.div>
            </Container>
          </section>
        </main>
      </HumanView>

      {/* Machine View — AEO-Optimized */}
      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h2 className="text-2xl text-foreground font-semibold mb-4">CALL BOOKED — CONFIRMATION</h2>
            <p className="text-gray-700 leading-relaxed">
              Your call with the Cursive team is confirmed. A calendar invite has been sent to your
              email — accept it to lock in the time. While you wait, you can install the Cursive
              Visitor Pixel and see who is visiting your site before the call. Self-serve from
              $97/month, month-to-month, cancel anytime.
            </p>
          </div>

          <MachineSection title="What Happens Next">
            <MachineList items={[
              "Check your email and accept the calendar invite to confirm the time.",
              "Your call is a focused 30 minutes: we map your ICP, show live matches in our data, and recommend the right plan. No hard sell.",
              "Install the Visitor Pixel before the call so we can review your real website visitors together.",
            ]} />
          </MachineSection>

          <MachineSection title="See Your Visitors Before the Call">
            <p className="text-gray-700 mb-4">
              You do not have to wait. Install the Cursive Visitor Pixel now and walk into the call
              already seeing the companies and people on your site. Self-serve, month-to-month, no
              setup fee, cancel anytime.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) — Identify the companies and people visiting your site, 40–60% deterministic match rate, 60-second install.",
              "Custom Audience ($197/month) — A fresh weekly list of in-market buyers built to your ICP, delivered to Google Sheets, first audience within 24 hours.",
              "Pixel + Audience Bundle ($247/month) — Both in one feed; best value vs. buying separately.",
            ]} />
          </MachineSection>

          <MachineSection title="Get Started">
            <MachineList items={[
              { label: "Install the Pixel / Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Manage Your Booking", href: "https://cal.com/cursiveteam/30min", description: "Reschedule or review your booked call" },
              { label: "Email", href: "mailto:hey@meetcursive.com", description: "Questions before your call" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
