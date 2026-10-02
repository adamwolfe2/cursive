import { Metadata } from "next"
import { generateMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = generateMetadata({
  title: "The Cursive platform: find buyers, reach them, run it",
  description:
    "One platform in three steps. Find your buyers from your website, have Cursive reach them with LinkedIn and email outreach, and run it all from a dashboard built for your company. Start with 25 free leads.",
  keywords: ["B2B lead generation platform", "done-for-you outreach", "sales dashboard", "lead credits", "ICP leads from website"],
  canonical: "https://www.meetcursive.com/platform",
})
