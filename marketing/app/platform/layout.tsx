import { metadata } from "./metadata"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/seo/structured-data"

export { metadata }

const platformFAQs = [
  {
    question: 'What is the Cursive platform?',
    answer: 'Cursive is an AI-powered B2B lead generation and outreach platform that identifies anonymous website visitors, enriches them with data from 280M profiles, and automates personalized multi-channel outreach across email, LinkedIn, SMS, and direct mail. It combines visitor identification, intent data, audience building, and AI-driven campaigns in one unified platform.',
  },
  {
    question: 'How does Cursive identify anonymous website visitors?',
    answer: 'Cursive uses a JavaScript pixel placed on your website that captures visitor signals. Our system matches those signals deterministically against an offline-rooted identity graph of 280M+ verified consumer profiles and 140M+ business profiles, refreshed every 30 days against NCOA. Pixel match rate is 40\u201360% on US B2B traffic with 60\u201380% pixel-level accuracy on a matched record \u2014 not modeled or probabilistic. For context: cookie sync averages 2\u20135% and IP-only databases sit around 10\u201315%.',
  },
  {
    question: 'What is an AI SDR and how does Cursive use it?',
    answer: 'An AI SDR (Sales Development Representative) is an artificial intelligence agent that handles outbound sales tasks automatically. Cursive\'s AI SDR researches prospects, writes personalized emails in your brand voice, sends multi-channel sequences, follows up autonomously, and books meetings — all without manual intervention, operating 24/7.',
  },
  {
    question: 'What integrations does Cursive support?',
    answer: 'Cursive integrates natively with 200+ tools including major CRMs (Salesforce, HubSpot, Pipedrive, Zoho), marketing automation (Marketo, Pardot, ActiveCampaign, Klaviyo), ad platforms (Google Ads, Facebook, LinkedIn), and sales tools (Outreach, Salesloft, Apollo). All integrations support real-time two-way sync.',
  },
  {
    question: 'How long does it take to set up Cursive?',
    answer: 'Most teams are fully operational within 24 hours. Pixel installation takes 5 minutes. CRM integration takes 10-15 minutes. AI campaign setup requires one session with your account manager to configure brand voice and ICP targeting.',
  },
  {
    question: 'What is intent data and how does Cursive use it?',
    answer: 'Intent data tracks online research behavior to predict purchase readiness. Cursive layers a 15M+ domain organic intent network on top of standard SSP feeds (the same ~40,000 signal-source domains the rest of the industry pulls from), and exposes ~50,000 white-label intent segments via a taxonomy endpoint. The closed feedback loop maps signals back to source URLs/apps/exchanges and validates against real conversions. Audiences update weekly with three intent tiers: Hot (7-day activity), Warm (14-day), and Scale (30-day).',
  },
  {
    question: 'Can Cursive replace my existing sales tools?',
    answer: 'Cursive is designed to either replace or complement your existing stack. It replaces: visitor tracking tools (RB2B, Leadfeeder), data enrichment (Clearbit, ZoomInfo for SMBs), email sequencing (Instantly, Smartlead), and LinkedIn automation tools. It integrates with enterprise tools like Salesforce, Salesloft, and HubSpot.',
  },
]

const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cursive',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://www.meetcursive.com/platform',
  description: 'All-in-one B2B lead generation and AI-powered outreach platform with visitor identification, people search, lead marketplace, and campaign management.',
  offers: {
    '@type': 'Offer',
    price: '1000',
    priceCurrency: 'USD',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '1000.00',
      priceCurrency: 'USD',
      referenceQuantity: {
        '@type': 'QuantitativeValue',
        value: '1',
        unitCode: 'MON',
      },
    },
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'AI Studio',
    'People Search',
    'Lead Marketplace',
    'Campaign Manager',
    'Visitor Intelligence',
    'Intent Data & Audiences',
  ],
}

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData data={[
        productSchema,
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Platform', url: 'https://www.meetcursive.com/platform' },
        ]),
        generateFAQSchema(platformFAQs),
      ]} />
      {children}
    </>
  )
}
