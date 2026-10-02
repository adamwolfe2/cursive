import { FAQSection } from "@/components/homepage/faq-section"
import { PageHero, SecondaryLink, FinalCta, BOOKING_URL } from "@/components/secondary/page-kit"
import { allFaqs } from "./data"

export default function FAQPage() {
  return (
    <div className="bg-white">
      <PageHero
        id="faq-title"
        kicker="FAQ"
        title="Questions, answered"
        lead="How the free 25 work, what outreach and the Visitor Pixel are, what things cost and how we handle your data."
      >
        <SecondaryLink href={BOOKING_URL}>Book a call</SecondaryLink>
      </PageHero>

      <FAQSection
        items={allFaqs}
        pageUrl="https://www.meetcursive.com/faq"
        title="Everything in one place"
        intro="Short answers. If yours is not here, talk to the team that builds your list."
      />

      <FinalCta id="faq-cta" placement="faq-final-cta" />
    </div>
  )
}
