import { Metadata } from "next"

export const metadata: Metadata = {
  title: "B2B Lead Generation: Intent-Based Strategies That Build Pipeline (2026) | Cursive",
  description: "Proven B2B lead generation strategies that prioritize intent over volume. Learn how to build predictable pipeline using visitor identification, intent data, and multi-channel outreach.",
  keywords: "B2B lead generation, lead generation strategies, intent-based lead generation, pipeline generation, outbound lead generation, qualified leads, B2B sales leads, lead gen tactics, visitor identification leads, demand generation",

  openGraph: {
    title: "B2B Lead Generation: Intent-Based Strategies That Build Pipeline (2026) | Cursive",
    description: "Proven B2B lead generation strategies that prioritize intent over volume. Learn how to build predictable pipeline using visitor identification, intent data, and multi-channel outreach.",
    type: "article",
    url: "https://www.meetcursive.com/blog/lead-generation",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "B2B Lead Generation: Intent-Based Strategies That Build Pipeline",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "B2B Lead Generation: Intent-Based Strategies That Build Pipeline (2026) | Cursive",
    description: "Proven B2B lead generation strategies that prioritize intent over volume. Learn how to build predictable pipeline using visitor identification, intent data, and multi-channel outreach.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/lead-generation",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
