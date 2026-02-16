import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Your Next Lead Won't Fill Out a Form — They'll Send an AI Agent | Cursive",
  description: "AI browser agents are changing how B2B buyers evaluate and purchase software. Here's how visitor identification and lead generation need to evolve for the agentic web.",
  keywords: "AI agents B2B buying, agentic buyer journey, AI lead generation future, website visitor identification AI agents",

  openGraph: {
    title: "Your Next Lead Won't Fill Out a Form — They'll Send an AI Agent | Cursive",
    description: "AI browser agents are changing how B2B buyers evaluate and purchase software. Here's how visitor identification and lead generation need to evolve for the agentic web.",
    type: "article",
    url: "https://www.meetcursive.com/blog/ai-agents-replacing-buyer-journey",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Illustration of an AI agent visiting vendor websites on behalf of a B2B buyer, comparing pricing and features through structured WebMCP tools while the human decision-maker reviews a summary report",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Your Next Lead Won't Fill Out a Form — They'll Send an AI Agent | Cursive",
    description: "AI browser agents are changing how B2B buyers evaluate and purchase software. Here's how visitor identification and lead generation need to evolve for the agentic web.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/ai-agents-replacing-buyer-journey",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
