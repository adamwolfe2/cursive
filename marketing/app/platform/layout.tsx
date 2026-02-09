import { metadata } from "./metadata"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"

export { metadata }

const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cursive',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://meetcursive.com/platform',
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
          { name: 'Home', url: 'https://meetcursive.com' },
          { name: 'Platform', url: 'https://meetcursive.com/platform' },
        ]),
      ]} />
      {children}
    </>
  )
}
