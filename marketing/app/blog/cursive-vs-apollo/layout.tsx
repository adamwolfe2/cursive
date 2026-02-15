import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cursive vs Apollo: Visitor ID vs Prospecting Database (2026) | Cursive",
  description: "Compare Cursive and Apollo.io for B2B sales. Apollo is a 200M+ contact prospecting database for cold outreach. Cursive identifies YOUR website visitors and automates warm, personalized outreach. Different approaches, complementary tools.",
  keywords: "cursive vs apollo, apollo alternative, apollo.io comparison, visitor identification vs prospecting, b2b sales tools, apollo pricing, cursive pricing, cold outreach vs warm outreach, website visitor identification, sales engagement platform",

  openGraph: {
    title: "Cursive vs Apollo: Visitor ID vs Prospecting Database (2026) | Cursive",
    description: "Compare Cursive and Apollo.io for B2B sales. Apollo is a 200M+ contact prospecting database for cold outreach. Cursive identifies YOUR website visitors and automates warm, personalized outreach.",
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
    title: "Cursive vs Apollo: Visitor ID vs Prospecting Database (2026) | Cursive",
    description: "Compare Cursive and Apollo.io for B2B sales. Apollo is a 200M+ contact prospecting database for cold outreach. Cursive identifies YOUR website visitors and automates warm, personalized outreach.",
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
  return children
}
