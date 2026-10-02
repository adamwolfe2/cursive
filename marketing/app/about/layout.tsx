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
  description: 'Cursive finds B2B buyers from your website, reaches them with done-for-you outreach, and builds the dashboard to run it.',
  sameAs: [
    'https://linkedin.com/company/cursive',
  ],
  slogan: 'Find your buyers, reach them, run the system',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Sales',
    email: 'hey@meetcursive.com',
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
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About Cursive',
          url: 'https://www.meetcursive.com/about',
          about: { '@type': 'Organization', name: 'Cursive', url: 'https://www.meetcursive.com' },
        },
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'About', url: 'https://www.meetcursive.com/about' },
        ]),
      ]} />
      {children}
    </>
  )
}
