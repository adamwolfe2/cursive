import { Metadata } from "next"
import { generateMetadata } from "@/lib/seo/metadata"

const baseMetadata = generateMetadata({
  title: "AI-Powered B2B Lead Generation Platform",
  description: "Explore Cursive's AI-powered platform: visitor identification, audience builder, intent data, direct mail automation, and 200+ integrations for B2B lead generation.",
  keywords: [
    "AI lead generation platform",
    "B2B visitor identification",
    "intent data",
    "audience builder",
    "direct mail automation",
    "lead generation integrations",
    "AI outbound platform",
    "B2B sales platform",
  ],
  canonical: "https://meetcursive.com/platform",
})

export const metadata: Metadata = {
  ...baseMetadata,
  other: {
    // Product Schema - Main Platform
    'script:ld+json:product': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Cursive Platform',
      description: 'All-in-one B2B lead generation and AI-powered outreach platform with visitor identification, people search, lead marketplace, and campaign management.',
      brand: {
        '@type': 'Brand',
        name: 'Cursive'
      },
      offers: {
        '@type': 'Offer',
        price: '2000',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '2000.00',
          priceCurrency: 'USD',
          referenceQuantity: {
            '@type': 'QuantitativeValue',
            value: '1',
            unitCode: 'MON'
          }
        },
        availability: 'https://schema.org/InStock'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '127',
        bestRating: '5',
        worstRating: '1'
      }
    }),
    // Features Schema
    'script:ld+json:features': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Cursive Platform Features',
      hasFeature: [
        {
          '@type': 'PropertyValue',
          name: 'AI Studio',
          description: 'Train AI on your brand, tone, and messaging. Generate campaign copy, emails, and landing pages that sound like you.'
        },
        {
          '@type': 'PropertyValue',
          name: 'People Search',
          description: 'Search 500M+ verified B2B contacts by name, company, title, location, and industry.'
        },
        {
          '@type': 'PropertyValue',
          name: 'Lead Marketplace',
          description: 'Browse and buy pre-verified B2B lead lists on demand. Pay-per-lead pricing with instant CSV download.'
        },
        {
          '@type': 'PropertyValue',
          name: 'Campaign Manager',
          description: 'Build, schedule, and track multi-channel email campaigns with AI-powered personalization and A/B testing.'
        },
        {
          '@type': 'PropertyValue',
          name: 'Visitor Intelligence',
          description: 'Install tracking pixel to identify anonymous website visitors in real-time and export decision-maker contacts.'
        },
        {
          '@type': 'PropertyValue',
          name: 'Intent Data & Audiences',
          description: '450B+ monthly intent signals across 30,000+ commercial categories. Pre-built segments and custom audience builder.'
        }
      ]
    }),
    // Software Application Schema
    'script:ld+json:software': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Cursive',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://meetcursive.com/platform',
      description: 'All-in-one B2B lead generation and AI-powered outreach platform',
      offers: {
        '@type': 'Offer',
        price: '2000',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '2000.00',
          priceCurrency: 'USD',
          referenceQuantity: {
            '@type': 'QuantitativeValue',
            value: '1',
            unitCode: 'MON'
          }
        }
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '127',
        bestRating: '5',
        worstRating: '1'
      }
    }),
  }
}
