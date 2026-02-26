import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: 'Beyond Visitor Identification: Why Your Pixel Data Needs an AI Intelligence Layer',
  description: 'Knowing who visited your site is the beginning, not the end. The gap between identification and conversation is where deals are won or lost — and where the Intelligence Layer comes in.',
  keywords: 'visitor identification, ai intelligence layer, b2b lead enrichment, website visitor data, outreach personalization, cursive intelligence',

  openGraph: {
    title: 'Beyond Visitor Identification: Why Your Pixel Data Needs an AI Intelligence Layer',
    description: 'Knowing who visited your site is the beginning, not the end. The gap between identification and conversation is where deals are won or lost — and where the Intelligence Layer comes in.',
    type: 'article',
    url: 'https://www.meetcursive.com/blog/beyond-visitor-identification',
    siteName: 'Cursive',
    images: [{
      url: 'https://www.meetcursive.com/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Beyond Visitor Identification: Why Your Pixel Data Needs an AI Intelligence Layer',
    }],
    locale: 'en_US',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Beyond Visitor Identification: Why Your Pixel Data Needs an AI Intelligence Layer',
    description: 'Knowing who visited your site is the beginning, not the end. The gap between identification and conversation is where deals are won or lost.',
    images: ['https://www.meetcursive.com/og-image.png'],
    creator: '@meetcursive',
  },

  alternates: {
    canonical: 'https://www.meetcursive.com/blog/beyond-visitor-identification',
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
          { name: 'Beyond Visitor Identification: Why Your Pixel Data Needs an AI Intelligence Layer', url: 'https://www.meetcursive.com/blog/beyond-visitor-identification' },
        ]),
        generateBlogPostSchema({
          title: 'Beyond Visitor Identification: Why Your Pixel Data Needs an AI Intelligence Layer',
          description: 'Knowing who visited your site is the beginning, not the end. The gap between identification and conversation is where deals are won or lost — and where the Intelligence Layer comes in.',
          url: 'https://www.meetcursive.com/blog/beyond-visitor-identification',
          datePublished: '2026-02-25',
          dateModified: '2026-02-25',
        }),
      ]} />
      {children}
    </>
  )
}
