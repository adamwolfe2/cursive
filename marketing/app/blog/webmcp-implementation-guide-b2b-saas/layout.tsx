import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "How to Implement WebMCP on Your B2B SaaS Website (With Real Code) | Cursive",
  description: "Step-by-step guide to implementing WebMCP on a Next.js B2B site. Includes declarative forms, imperative tool registration, llms.txt, and testing with Chrome 146.",
  keywords: "WebMCP implementation guide, WebMCP Next.js, how to add WebMCP, WebMCP tutorial, WebMCP code example",

  openGraph: {
    title: "How to Implement WebMCP on Your B2B SaaS Website (With Real Code) | Cursive",
    description: "Step-by-step guide to implementing WebMCP on a Next.js B2B site. Includes declarative forms, imperative tool registration, llms.txt, and testing with Chrome 146.",
    type: "article",
    url: "https://www.meetcursive.com/blog/webmcp-implementation-guide-b2b-saas",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Code editor showing WebMCP declarative form attributes and imperative tool registration alongside a Chrome DevTools panel displaying registered tools",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "How to Implement WebMCP on Your B2B SaaS Website (With Real Code) | Cursive",
    description: "Step-by-step guide to implementing WebMCP on a Next.js B2B site. Includes declarative forms, imperative tool registration, llms.txt, and testing with Chrome 146.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/webmcp-implementation-guide-b2b-saas",
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
          { name: 'How to Implement WebMCP on Your B2B SaaS Website (With Real Code)', url: 'https://www.meetcursive.com/blog/webmcp-implementation-guide-b2b-saas' },
        ]),
        generateBlogPostSchema({
          title: 'How to Implement WebMCP on Your B2B SaaS Website (With Real Code)',
          description: 'Step-by-step guide to implementing WebMCP on a Next.js B2B site. Includes declarative forms, imperative tool registration, llms.txt, and testing with Chrome 146.',
          url: 'https://www.meetcursive.com/blog/webmcp-implementation-guide-b2b-saas',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
