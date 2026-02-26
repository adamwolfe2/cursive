import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: 'Cursive vs RB2B (2026): Full Feature Comparison',
  description: 'RB2B identifies website visitors and drops them in Slack. Cursive identifies them AND builds a complete AI intelligence dossier — LinkedIn history, tech stack, news mentions, and an AI-written outreach angle. See the full comparison.',
  keywords: 'cursive vs rb2b, rb2b alternative, rb2b competitor, visitor identification, intelligence layer, ai enrichment, website visitor identification 2026',

  openGraph: {
    title: 'Cursive vs RB2B (2026): Full Feature Comparison',
    description: 'RB2B identifies website visitors and drops them in Slack. Cursive identifies them AND builds a complete AI intelligence dossier — LinkedIn history, tech stack, news mentions, and an AI-written outreach angle.',
    type: 'website',
    url: 'https://www.meetcursive.com/cursive-vs-rb2b',
    siteName: 'Cursive',
    images: [{
      url: 'https://www.meetcursive.com/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Cursive vs RB2B: Full Feature Comparison (2026)',
    }],
    locale: 'en_US',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Cursive vs RB2B (2026): Full Feature Comparison',
    description: 'RB2B identifies website visitors and drops them in Slack. Cursive builds a complete AI intelligence dossier on each of them.',
    images: ['https://www.meetcursive.com/og-image.png'],
    creator: '@meetcursive',
  },

  alternates: {
    canonical: 'https://www.meetcursive.com/cursive-vs-rb2b',
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
          { name: 'Cursive vs RB2B (2026): Full Feature Comparison', url: 'https://www.meetcursive.com/cursive-vs-rb2b' },
        ]),
      ]} />
      {children}
    </>
  )
}
