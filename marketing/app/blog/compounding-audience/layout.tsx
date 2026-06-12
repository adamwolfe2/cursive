import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "The Compounding Audience: Why Identity Resolution Gets More Valuable Every Month | Cursive",
  description: "First-party data built on your own traffic compounds in ways purchased lists never can. How identity resolution creates an audience asset that grows in value and accuracy every month you run it.",
  keywords: "compounding audience marketing, first party data strategy, visitor identification value, intent data over time, first party audience, identity resolution ROI, B2B audience building",

  openGraph: {
    title: "The Compounding Audience: Why Identity Resolution Gets More Valuable Every Month | Cursive",
    description: "First-party data built on your own traffic compounds in ways purchased lists never can. How identity resolution creates an audience asset that grows in value and accuracy every month you run it.",
    type: "article",
    url: "https://www.meetcursive.com/blog/compounding-audience",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "The Compounding Audience",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "The Compounding Audience: Why Identity Resolution Gets More Valuable Every Month | Cursive",
    description: "First-party data built on your own traffic compounds in ways purchased lists never can. How identity resolution creates an audience asset that grows in value and accuracy every month you run it.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/compounding-audience",
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
          { name: 'The Compounding Audience', url: 'https://www.meetcursive.com/blog/compounding-audience' },
        ]),
        generateBlogPostSchema({
          title: 'The Compounding Audience: Why Identity Resolution Gets More Valuable Every Month',
          description: 'First-party data built on your own traffic compounds in ways purchased lists never can. How identity resolution creates an audience asset that grows in value and accuracy every month you run it.',
          url: 'https://www.meetcursive.com/blog/compounding-audience',
          datePublished: '2026-06-12',
          dateModified: '2026-06-12',
        }),
      ]} />
      {children}
    </>
  )
}
