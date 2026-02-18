import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

const blogPublisherSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Cursive Blog',
  url: 'https://www.meetcursive.com/blog',
  description: 'Expert guides on visitor identification, intent data, B2B lead generation, and sales automation.',
  publisher: {
    '@type': 'Organization',
    name: 'Cursive',
    url: 'https://www.meetcursive.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.meetcursive.com/cursive-logo.png',
    },
    sameAs: [
      'https://twitter.com/meetcursive',
      'https://linkedin.com/company/cursive',
    ],
  },
  inLanguage: 'en-US',
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
        ]),
        blogPublisherSchema,
      ]} />
      {children}
    </>
  )
}
