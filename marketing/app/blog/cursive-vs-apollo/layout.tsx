import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Cursive vs Apollo: 70% Visitor ID + $1k/mo vs Cold Contact Database (2026) | Cursive",
  description: "Compare Cursive and Apollo.io for B2B sales. Apollo has 250M+ contacts for cold outreach at $49/user/mo. Cursive identifies 70% of YOUR website visitors and automates warm, personalized outreach at $1k/mo — no cold lists needed.",
  keywords: "cursive vs apollo, apollo alternative, apollo.io comparison, visitor identification vs prospecting, b2b sales tools, apollo pricing, cursive pricing, cold outreach vs warm outreach, website visitor identification, sales engagement platform",

  openGraph: {
    title: "Cursive vs Apollo: 70% Visitor ID + $1k/mo vs Cold Contact Database (2026) | Cursive",
    description: "Apollo has 250M+ contacts for cold outreach at $49/user/mo. Cursive identifies 70% of YOUR website visitors and automates warm, personalized outreach at $1k/mo — no cold lists needed.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-apollo",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs Apollo: Visitor ID vs Prospecting Database (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs Apollo: 70% Visitor ID + $1k/mo vs Cold Contact Database (2026) | Cursive",
    description: "Apollo has 250M+ contacts for cold outreach at $49/user/mo. Cursive identifies 70% of YOUR website visitors and automates warm, personalized outreach at $1k/mo — no cold lists needed.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-apollo",
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
          { name: 'Cursive vs Apollo: 70% Visitor ID + $1k/mo vs Cold Contact Database (2026)', url: 'https://www.meetcursive.com/blog/cursive-vs-apollo' },
        ]),
        generateBlogPostSchema({
          title: 'Cursive vs Apollo: 70% Visitor ID + $1k/mo vs Cold Contact Database (2026)',
          description: 'Compare Cursive and Apollo.io for B2B sales. Apollo has 250M+ contacts for cold outreach at $49/user/mo. Cursive identifies 70% of YOUR website visitors and automates warm, personalized outreach at $1k/mo — no cold lists needed.',
          url: 'https://www.meetcursive.com/blog/cursive-vs-apollo',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
