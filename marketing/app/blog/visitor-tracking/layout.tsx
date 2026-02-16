import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Website Visitor Tracking: How It Works and How to Implement It (2026 Guide) | Cursive",
  description: "Learn how website visitor tracking works for B2B companies. Covers IP-based identification, cookie tracking, privacy-compliant methods, and step-by-step implementation for turning anonymous traffic into qualified leads.",
  keywords: "visitor tracking, website visitor identification, anonymous visitor tracking, B2B visitor tracking, visitor identification software, website analytics, visitor intelligence, IP-based tracking, cookie tracking, privacy-compliant tracking, website visitor identification tools, deanonymization",

  openGraph: {
    title: "Website Visitor Tracking: How It Works and How to Implement It (2026 Guide) | Cursive",
    description: "Learn how website visitor tracking works for B2B companies. Covers IP-based identification, cookie tracking, privacy-compliant methods, and step-by-step implementation for turning anonymous traffic into qualified leads.",
    type: "article",
    url: "https://www.meetcursive.com/blog/visitor-tracking",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Website Visitor Tracking: How It Works and How to Implement It",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Website Visitor Tracking: How It Works and How to Implement It (2026 Guide) | Cursive",
    description: "Learn how website visitor tracking works for B2B companies. Covers IP-based identification, cookie tracking, privacy-compliant methods, and step-by-step implementation for turning anonymous traffic into qualified leads.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/visitor-tracking",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
