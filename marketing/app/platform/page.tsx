import { FAQSection } from "@/components/homepage/faq-section"
import { PricingGrid, RungsSection } from "@/components/homepage/ladder-sections"
import { Section, PageHero, SecondaryLink, FinalCta, BOOKING_URL } from "@/components/secondary/page-kit"
import { platformFaqs } from "./faq-data"

/* Platform: the three steps in full (the same RungsSection as the homepage), the add-on, then prices. */
export default function PlatformPage() {
  return (
    <div className="bg-white">
      <PageHero
        id="platform-title"
        kicker="The platform"
        title="One list, three steps: find, reach, run"
        lead="Cursive finds your buyers, reaches them for you, and gives you the system to run it. Start with 25 free leads from your website and add the next step when you want it."
      >
        <SecondaryLink href={BOOKING_URL}>Book a call</SecondaryLink>
      </PageHero>

      <div className="pt-20 sm:pt-28">
        <RungsSection />
      </div>

      <Section
        id="pixel"
        title="Add the Visitor Pixel at any step"
        lead="See which companies visit your site for $97 a month. In the operating system, those visitors sit in the same dashboard as your leads and replies."
      >
        <div className="mt-6">
          <SecondaryLink href="/pixel">How the Pixel works</SecondaryLink>
        </div>
      </Section>

      <Section id="pricing" title="What each step costs" lead="Month-to-month on every plan. No long contract.">
        <PricingGrid className="mt-10 !max-w-none" />
      </Section>

      <FAQSection
        items={platformFaqs}
        pageUrl="https://www.meetcursive.com/platform"
        title="Platform questions"
        intro="How the three steps fit together. For anything else, book a call."
      />

      <FinalCta id="platform-cta" placement="platform-final-cta" />
    </div>
  )
}
