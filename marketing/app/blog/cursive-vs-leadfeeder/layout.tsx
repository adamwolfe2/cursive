import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cursive vs Leadfeeder: Person-Level vs Company-Level ID (2026) | Cursive",
  description: "Leadfeeder identifies companies visiting your site. Cursive identifies the actual people. Compare these two fundamentally different approaches to website visitor identification and find out which delivers more pipeline.",
  keywords: "cursive vs leadfeeder, leadfeeder alternative, leadfeeder competitor, person level identification, company level identification, website visitor identification, leadfeeder pricing, leadfeeder review, b2b visitor tracking, best leadfeeder alternative 2026",

  openGraph: {
    title: "Cursive vs Leadfeeder: Person-Level vs Company-Level ID (2026) | Cursive",
    description: "Leadfeeder identifies companies visiting your site. Cursive identifies the actual people. Compare these two fundamentally different approaches to website visitor identification.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-leadfeeder",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs Leadfeeder: Person-Level vs Company-Level ID (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs Leadfeeder: Person-Level vs Company-Level ID (2026) | Cursive",
    description: "Leadfeeder identifies companies visiting your site. Cursive identifies the actual people. Compare these two fundamentally different approaches to website visitor identification.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-leadfeeder",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
