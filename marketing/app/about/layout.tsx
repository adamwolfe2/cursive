import { metadata } from "./metadata"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"

export { metadata }

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cursive',
  url: 'https://www.meetcursive.com',
  logo: 'https://www.meetcursive.com/cursive-logo.png',
  description: 'AI-powered B2B lead generation and outbound automation platform',
  sameAs: [
    'https://twitter.com/meetcursive',
    'https://linkedin.com/company/cursive',
  ],
  foundingDate: '2025',
  areaServed: ['US', 'CA', 'UK', 'AU'],
  slogan: 'Turn Website Visitors Into Booked Meetings',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Sales',
    email: 'hello@meetcursive.com',
    areaServed: 'US',
    availableLanguage: ['en'],
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData data={[
        organizationSchema,
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'About', url: 'https://www.meetcursive.com/about' },
        ]),
      ]} />
      {children}
    </>
  )
}
