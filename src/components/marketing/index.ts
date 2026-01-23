/**
 * Marketing Components Index
 * OpenInfo Platform
 *
 * Export all marketing site components.
 */

// Layout
export { Navigation } from './layout/navigation'
export { Footer } from './layout/footer'

// UI Components
export {
  AnimatedSection,
  AnimatedContainer,
  AnimatedItem,
  FadeIn,
  AnimatedText,
  AnimatedHeading,
  AnimatedCard,
  AnimatedButton,
  AnimatedLink,
  Parallax,
  Floating,
  Reveal,
  Counter,
  MagneticButton,
} from './ui/animated-components'

// Sections
export { HeroSection } from './sections/hero'
export { FeaturesSection } from './sections/features'
export { StatsSection, StatsLightSection } from './sections/stats'
export { TestimonialsSection, FeaturedTestimonial } from './sections/testimonials'
export { CTASection, SimpleCTASection, NewsletterCTA } from './sections/cta'
export { DemoSection } from './sections/demo'

// SEO Components
export {
  OrganizationJsonLd,
  SoftwareJsonLd,
  FAQJsonLd,
  BlogPostJsonLd,
  BreadcrumbJsonLd,
  PricingJsonLd,
  HomePageJsonLd,
  PricingPageJsonLd,
} from './seo/structured-data'
