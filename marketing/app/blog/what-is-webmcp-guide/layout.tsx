import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "What Is WebMCP? A Practical Guide for B2B Marketers | Cursive",
  description: "Google's WebMCP standard lets AI agents interact with your website through structured tools instead of scraping. Here's what it is, how it works, and why B2B teams should care.",
  keywords: "what is WebMCP, WebMCP explained, WebMCP for marketers, agentic web, AI agents websites",

  openGraph: {
    title: "What Is WebMCP? A Practical Guide for B2B Marketers | Cursive",
    description: "Google's WebMCP standard lets AI agents interact with your website through structured tools instead of scraping. Here's what it is, how it works, and why B2B teams should care.",
    type: "article",
    url: "https://www.meetcursive.com/blog/what-is-webmcp-guide",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "What Is WebMCP? A Practical Guide for B2B Marketers and Growth Teams",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "What Is WebMCP? A Practical Guide for B2B Marketers | Cursive",
    description: "Google's WebMCP standard lets AI agents interact with your website through structured tools instead of scraping. Here's what it is, how it works, and why B2B teams should care.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/what-is-webmcp-guide",
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
          { name: 'What Is WebMCP? A Practical Guide for B2B Marketers', url: 'https://www.meetcursive.com/blog/what-is-webmcp-guide' },
        ]),
        generateBlogPostSchema({
          title: 'What Is WebMCP? A Practical Guide for B2B Marketers',
          description: 'Google\'s WebMCP standard lets AI agents interact with your website through structured tools instead of scraping. Here\'s what it is, how it works, and why B2B teams should care.',
          url: 'https://www.meetcursive.com/blog/what-is-webmcp-guide',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
