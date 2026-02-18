import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Best Website Visitor Identification Software in 2026: 8 Tools Compared | Cursive",
  description: "Compare the 8 best website visitor identification software tools for 2026. Find the right platform for de-anonymizing B2B website visitors — with identification rates, pricing, and a buyer's guide.",
  keywords: "best website visitor identification software, visitor identification software, website visitor tracking software, anonymous visitor identification tools, identify website visitors software, visitor identification tools comparison 2026, de-anonymize website visitors, b2b visitor identification",

  openGraph: {
    title: "Best Website Visitor Identification Software in 2026: 8 Tools Compared | Cursive",
    description: "Compare the 8 best website visitor identification software tools for 2026. Find the right platform for de-anonymizing B2B website visitors — with identification rates, pricing, and a buyer's guide.",
    type: "article",
    url: "https://www.meetcursive.com/blog/best-website-visitor-identification-software",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best Website Visitor Identification Software in 2026: 8 Tools Compared",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Website Visitor Identification Software in 2026: 8 Tools Compared | Cursive",
    description: "Compare the 8 best website visitor identification software tools for 2026. Find the right platform for de-anonymizing B2B website visitors — with identification rates, pricing, and a buyer's guide.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/best-website-visitor-identification-software",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
