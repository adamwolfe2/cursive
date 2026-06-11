import type { Metadata } from 'next'
import { SuperPixelView } from './SuperPixelView'

export const metadata: Metadata = {
  title: "Cursive Super Pixel — 40–60% Deterministic Visitor Match",
  description: "97% of your website visitors leave without buying. The Cursive Super Pixel matches 40–60% of them deterministically against an offline-rooted identity graph of 280M+ verified profiles, refreshed every 30 days against NCOA. The engine behind the $97/mo Visitor Pixel — self-serve, live in 60 seconds.",
  robots: { index: true, follow: true },
}

// Structured data preserved + updated to self-serve pricing.
const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Cursive Super Pixel (Visitor Pixel)',
  description:
    'Website visitor identification engine that matches 40–60% of anonymous traffic to real people deterministically, with verified work emails and intent scoring.',
  brand: { '@type': 'Brand', name: 'Cursive' },
  offers: {
    '@type': 'Offer',
    price: '97',
    priceCurrency: 'USD',
    url: 'https://leads.meetcursive.com/get-leads',
    availability: 'https://schema.org/InStock',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What does the Super Pixel actually do?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It identifies the real people visiting your site who never fill out a form — name, verified work email, company, and an intent score — synced straight to your portal and CRM.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is it different from other pixels?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our data comes direct from primary sources and is verified monthly, so the bounce rate is 0.05% versus an industry 20%+. We identify the actual person, not just companies or LinkedIn users.',
      },
    },
    {
      '@type': 'Question',
      name: 'How fast is it live?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Drop the snippet and you are live in about 60 seconds. Most sites see their first identified visitors the same day.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does it cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Visitor Pixel is $97/mo, self-serve and month-to-month. Add a weekly Custom Audience for $197/mo, or get both in the Bundle for $247/mo. Cancel anytime.',
      },
    },
  ],
}

export default function SuperPixelPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <SuperPixelView />
    </>
  )
}
