import { Metadata } from "next"

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
  return children
}
