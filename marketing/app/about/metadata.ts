import { Metadata } from "next"

const TITLE = "About Cursive | We find your buyers, reach them, and run the system"
const DESCRIPTION =
  "Cursive finds your buyers, reaches them for you, and gives you the system to run it. Start with 25 free leads from your website, then add outreach or a dashboard when you are ready."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: "about cursive, B2B lead generation, find buyers, done-for-you outreach, sales dashboard",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.meetcursive.com/about",
    siteName: "Cursive",
    images: [{ url: "https://www.meetcursive.com/cursive-social-preview.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["https://www.meetcursive.com/cursive-social-preview.png"],
    creator: "@meetcursive",
  },
  alternates: {
    canonical: "https://www.meetcursive.com/about",
  },
}
