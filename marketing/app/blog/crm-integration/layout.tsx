import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "CRM Integration & Data Enrichment: The Complete B2B Guide (2026) | Cursive",
  description: "Learn how to integrate your CRM with visitor identification, automate data enrichment workflows, and sync intent signals to HubSpot, Salesforce, and your entire marketing stack.",
  keywords: "CRM integration, CRM data enrichment, Salesforce integration, HubSpot integration, marketing automation, data sync, workflow automation, sales and marketing alignment, CRM visitor data, B2B CRM strategy",

  openGraph: {
    title: "CRM Integration & Data Enrichment: The Complete B2B Guide (2026) | Cursive",
    description: "Learn how to integrate your CRM with visitor identification, automate data enrichment workflows, and sync intent signals to HubSpot, Salesforce, and your entire marketing stack.",
    type: "article",
    url: "https://www.meetcursive.com/blog/crm-integration",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "CRM Integration & Data Enrichment: The Complete B2B Guide",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "CRM Integration & Data Enrichment: The Complete B2B Guide (2026) | Cursive",
    description: "Learn how to integrate your CRM with visitor identification, automate data enrichment workflows, and sync intent signals to HubSpot, Salesforce, and your entire marketing stack.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/crm-integration",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'CRM Integration & Data Enrichment: The Complete B2B Guide (2026)', url: 'https://www.meetcursive.com/blog/crm-integration' },
        ]),
        generateBlogPostSchema({
          title: 'CRM Integration & Data Enrichment: The Complete B2B Guide (2026)',
          description: 'Learn how to integrate your CRM with visitor identification, automate data enrichment workflows, and sync intent signals to HubSpot, Salesforce, and your entire marketing stack.',
          url: 'https://www.meetcursive.com/blog/crm-integration',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
