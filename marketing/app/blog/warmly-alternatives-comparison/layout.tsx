import { Metadata } from "next"

export const metadata: Metadata = {
  title: "7 Best Warmly Alternatives & Competitors in 2026 | Cursive",
  description: "Compare the 7 best Warmly alternatives for visitor identification, intent data, and outbound outreach. Find tools that combine visitor ID with full outbound capabilities at better value.",
  keywords: "warmly alternatives, warmly competitors, visitor identification tools, website visitor tracking, warmly vs competitors, b2b visitor identification, intent data platforms, buyer intent tools, account identification software, website deanonymization tools",

  openGraph: {
    title: "7 Best Warmly Alternatives & Competitors in 2026 | Cursive",
    description: "Compare the 7 best Warmly alternatives for visitor identification, intent data, and outbound outreach. Find tools that combine visitor ID with full outbound capabilities at better value.",
    type: "article",
    url: "https://www.meetcursive.com/blog/warmly-alternatives-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "7 Best Warmly Alternatives & Competitors in 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "7 Best Warmly Alternatives & Competitors in 2026 | Cursive",
    description: "Compare the 7 best Warmly alternatives for visitor identification, intent data, and outbound outreach. Find tools that combine visitor ID with full outbound capabilities at better value.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/warmly-alternatives-comparison",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
