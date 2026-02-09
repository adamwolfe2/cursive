import { Metadata } from "next"
import { generateMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = generateMetadata({
  title: "AI-Powered B2B Lead Generation Platform",
  description: "Explore Cursive's AI-powered platform: visitor identification, audience builder, intent data, direct mail automation, and 200+ integrations for B2B lead generation.",
  keywords: [
    "AI lead generation platform",
    "B2B visitor identification",
    "intent data",
    "audience builder",
    "direct mail automation",
    "lead generation integrations",
    "AI outbound platform",
    "B2B sales platform",
  ],
  canonical: "https://meetcursive.com/platform",
})
