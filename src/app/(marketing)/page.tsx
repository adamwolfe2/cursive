/**
 * Marketing Homepage
 * OpenInfo Platform
 *
 * The main landing page showcasing all features.
 */

import {
  HeroSection,
  FeaturesSection,
  StatsSection,
  TestimonialsSection,
  CTASection,
  NewsletterCTA,
} from '@/components/marketing'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <NewsletterCTA />
    </>
  )
}
