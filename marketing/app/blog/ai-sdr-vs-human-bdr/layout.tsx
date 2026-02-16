import { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI SDR vs Human BDR: When to Use Each for B2B Sales | Cursive",
  description: "Compare AI SDRs and human BDRs for outbound sales. Learn when to use automation vs human touch, cost analysis, and hybrid strategies for maximum ROI.",
  keywords: "AI SDR, human BDR, sales automation, AI sales agents, outbound sales, SDR vs BDR, sales technology",

  openGraph: {
    title: "AI SDR vs Human BDR: When to Use Each for B2B Sales | Cursive",
    description: "Compare AI SDRs and human BDRs for outbound sales. Learn when to use automation vs human touch, cost analysis, and hybrid strategies for maximum ROI.",
    type: "article",
    url: "https://www.meetcursive.com/blog/ai-sdr-vs-human-bdr",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "AI SDR vs Human BDR: When to Use Each for B2B Sales",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "AI SDR vs Human BDR: When to Use Each for B2B Sales | Cursive",
    description: "Compare AI SDRs and human BDRs for outbound sales. Learn when to use automation vs human touch, cost analysis, and hybrid strategies for maximum ROI.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/ai-sdr-vs-human-bdr",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
