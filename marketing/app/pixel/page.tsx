import { FAQSection } from "@/components/homepage/faq-section"
import { PageHero, Section, Rows, Steps, SecondaryLink, FinalCta, type Row } from "@/components/secondary/page-kit"
import { GET_LEADS_URL } from "@/lib/cta"
import { pixelFaqs } from "./faq-data"

/*
 * Visitor Pixel: an add-on that feeds step 3 ("Run it"), not the headline product
 * (.claude/specs/2026-10-01-cursive-pivot.md). $97/mo. No match-rate or database-size claims.
 */

const STEPS = [
  { title: "Add one snippet", body: "Paste a single tag into your site. It works on any platform that lets you add a script." },
  { title: "We match the visit", body: "When we can tie a visit to a company, and where possible a person, it is listed with the pages they viewed." },
  { title: "You see who is warm", body: "Companies already on your site sit next to your leads, so you know who to reach first." },
]

const WHAT_YOU_SEE: Row[] = [
  { title: "Company", body: "Which company visited, with its industry, size and location." },
  { title: "People, where we can", body: "A name, title and work email for the person when we can match one. Visits we cannot match are not guessed." },
  { title: "Pages viewed", body: "What each visitor looked at, so pricing-page visitors stand out from one-page bounces." },
  { title: "Beside your leads", body: "Visitors and leads in one place. In the operating system they share a dashboard with replies and site chat." },
]

export default function PixelPage() {
  return (
    <div className="bg-white">
      <PageHero
        id="pixel-title"
        kicker="Add-on, $97 a month"
        title="See which companies are already on your site"
        lead="Your leads show who you could sell to. The Visitor Pixel shows who is already looking. Add it to any step, month-to-month."
      >
        <SecondaryLink href={GET_LEADS_URL}>Add the Visitor Pixel</SecondaryLink>
      </PageHero>

      <Section id="how" title="How it works">
        <Steps steps={STEPS} />
      </Section>

      <Section
        id="what-you-see"
        title="What you see"
        lead="We show the visitors we can identify. Not every visit can be matched, and we would rather show fewer real ones than a long list of guesses."
      >
        <Rows rows={WHAT_YOU_SEE} />
      </Section>

      <Section
        id="fit"
        title="Part of run it"
        lead="The Pixel is the signal that feeds your dashboard. Find your buyers, reach them, and see which of them, or which companies you never listed, show up on your site."
      >
        <div className="mt-6">
          <SecondaryLink href="/platform">See the platform</SecondaryLink>
        </div>
      </Section>

      <FAQSection
        items={pixelFaqs}
        pageUrl="https://www.meetcursive.com/pixel"
        title="Pixel questions"
        intro="What it does, where it stops and what it costs."
      />

      <FinalCta
        id="pixel-cta"
        placement="pixel-final-cta"
        sub="Free, no card, no sales call. Add the Pixel any time after."
      />
    </div>
  )
}
