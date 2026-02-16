import { Metadata } from "next"

export const metadata: Metadata = {
  title: "8 Best ZoomInfo Alternatives & Competitors for 2026 (Cheaper Options) | Cursive",
  description: "Tired of ZoomInfo's $15k-$40k+ annual contracts? Compare 8 affordable ZoomInfo alternatives for B2B data, intent signals, and prospecting. Find the right fit for your budget.",
  keywords: "zoominfo alternatives, zoominfo competitors, zoominfo alternative cheaper, zoominfo replacement, affordable b2b data providers, b2b contact database, sales intelligence tools, zoominfo pricing alternatives, cheaper than zoominfo, b2b prospecting tools 2026",

  openGraph: {
    title: "8 Best ZoomInfo Alternatives & Competitors for 2026 (Cheaper Options) | Cursive",
    description: "Tired of ZoomInfo's $15k-$40k+ annual contracts? Compare 8 affordable ZoomInfo alternatives for B2B data, intent signals, and prospecting. Find the right fit for your budget.",
    type: "article",
    url: "https://www.meetcursive.com/blog/zoominfo-alternatives-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "8 Best ZoomInfo Alternatives & Competitors for 2026 (Cheaper Options)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "8 Best ZoomInfo Alternatives & Competitors for 2026 (Cheaper Options) | Cursive",
    description: "Tired of ZoomInfo's $15k-$40k+ annual contracts? Compare 8 affordable ZoomInfo alternatives for B2B data, intent signals, and prospecting. Find the right fit for your budget.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/zoominfo-alternatives-comparison",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
