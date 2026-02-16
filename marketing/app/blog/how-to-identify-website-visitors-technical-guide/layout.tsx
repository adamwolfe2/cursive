import { Metadata } from "next"

export const metadata: Metadata = {
  title: "How to Identify Website Visitors: Technical Guide | Cursive",
  description: "Learn the technical methods behind website visitor identification including IP tracking, reverse lookup, cookie-based tracking, and privacy-compliant approaches for B2B lead generation.",
  keywords: "website visitor identification, visitor tracking technology, IP-based identification, reverse IP lookup, cookie tracking, first-party data, visitor identification methods, B2B visitor tracking, anonymous visitor identification, GDPR compliant tracking, privacy-safe visitor tracking, visitor identification software",

  openGraph: {
    title: "How to Identify Website Visitors: Technical Guide | Cursive",
    description: "Learn the technical methods behind website visitor identification including IP tracking, reverse lookup, cookie-based tracking, and privacy-compliant approaches for B2B lead generation.",
    type: "article",
    url: "https://www.meetcursive.com/blog/how-to-identify-website-visitors-technical-guide",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/cursive-social-preview.png",
      width: 1200,
      height: 630,
      alt: "How to Identify Website Visitors: Technical Guide",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "How to Identify Website Visitors: Technical Guide | Cursive",
    description: "Learn the technical methods behind website visitor identification including IP tracking, reverse lookup, cookie-based tracking, and privacy-compliant approaches for B2B lead generation.",
    images: ["https://www.meetcursive.com/cursive-social-preview.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/how-to-identify-website-visitors-technical-guide",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
