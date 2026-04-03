import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Email Finder: Find Professional Email Addresses by Name and Company for Free | Cursive",
  description: "Learn how email finder tools locate professional email addresses using a person's name and company. Compare free vs paid options, verification methods, and best practices for B2B outreach.",
  keywords: "email finder, find email address, email lookup, email finder tool, find email by name, professional email finder, free email finder, B2B email lookup, email verification",

  openGraph: {
    title: "Email Finder: Find Professional Email Addresses by Name and Company for Free | Cursive",
    description: "Learn how email finder tools locate professional email addresses using a person's name and company. Compare free vs paid options, verification methods, and best practices for B2B outreach.",
    type: "article",
    url: "https://www.meetcursive.com/blog/email-finder",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Email Finder: Find Professional Email Addresses by Name and Company for Free",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Email Finder: Find Professional Email Addresses by Name and Company for Free | Cursive",
    description: "Learn how email finder tools locate professional email addresses using a person's name and company. Compare free vs paid options, verification methods, and best practices for B2B outreach.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/email-finder",
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
          { name: 'Email Finder: Find Professional Email Addresses by Name and Company for Free', url: 'https://www.meetcursive.com/blog/email-finder' },
        ]),
        generateBlogPostSchema({
          title: 'Email Finder: Find Professional Email Addresses by Name and Company for Free',
          description: 'Learn how email finder tools locate professional email addresses using a person\'s name and company. Compare free vs paid options, verification methods, and best practices for B2B outreach.',
          url: 'https://www.meetcursive.com/blog/email-finder',
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
        }),
      ]} />
      {children}
    </>
  )
}
