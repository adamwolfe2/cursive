"use client"

import { IntegrationsLine } from "@/components/homepage/integrations-line"
import { FAQSection } from "@/components/homepage/faq-section"
import { SiteForm, StartExample, StartHero } from "@/components/homepage/start-hero"
import { DatabaseSection, LadderPricing, RecursiveSection, RungsSection } from "@/components/homepage/ladder-sections"
import { Stage } from "@/components/homepage/stage"
import { H2 } from "@/components/homepage/type"

/*
 * Homepage: find them, reach them, run it (.claude/specs/2026-10-01-cursive-pivot.md).
 * Hero and example scan sell the free 25; the rungs, the "recursive" entry and pricing show the climb.
 */
export function HumanHomePage() {
  return (
    <div className="bg-white">
      <StartHero />
      <StartExample />
      <DatabaseSection />
      <RungsSection />
      <RecursiveSection />
      <LadderPricing />

      <IntegrationsLine />

      <FAQSection />

      <section aria-labelledby="final-cta-heading" className="px-2 pb-20 pt-4 sm:px-4 sm:pb-28">
        <Stage className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
            <h2 id="final-cta-heading" className={H2}>
              Get your 25 leads in about a minute
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-[#475569]">Free, no card, no sales call.</p>
            <SiteForm placement="home-final-cta" className="mx-auto mt-8" />
          </div>
        </Stage>
      </section>
    </div>
  )
}
