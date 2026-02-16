import { Metadata } from "next"

export const metadata: Metadata = {
  title: "How to Scale Outbound Sales Without Hiring More SDRs | Cursive",
  description: "Scale B2B outbound sales with automation, data, and technology. Proven strategies to 3x pipeline without increasing headcount or budget.",
  keywords: "scale outbound sales, sales automation, SDR productivity, outbound scaling, sales operations, pipeline growth",

  openGraph: {
    title: "How to Scale Outbound Sales Without Hiring More SDRs | Cursive",
    description: "Scale B2B outbound sales with automation, data, and technology. Proven strategies to 3x pipeline without increasing headcount or budget.",
    type: "article",
    url: "https://www.meetcursive.com/blog/scaling-outbound",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "How to Scale Outbound Sales Without Hiring More SDRs",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "How to Scale Outbound Sales Without Hiring More SDRs | Cursive",
    description: "Scale B2B outbound sales with automation, data, and technology. Proven strategies to 3x pipeline without increasing headcount or budget.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/scaling-outbound",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
