import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best AudienceLab Alternatives: Visitor ID Tools That Include AI Outreach (2026)",
  description: "AudienceLab identifies website visitors but stops there — no AI outreach, no intent data, no direct mail. Compare the 7 best AudienceLab alternatives that complete the full pipeline.",
  keywords: "audiencelab alternative, audiencelab alternatives, audiencelab competitors, website visitor identification tools, best alternative to audiencelab, audiencelab replacement, visitor tracking alternatives, b2b visitor id comparison 2026",

  openGraph: {
    title: "Best AudienceLab Alternatives: Visitor ID Tools That Include AI Outreach (2026) | Cursive",
    description: "AudienceLab identifies website visitors but stops there — no AI outreach, no intent data, no direct mail. Compare the 7 best AudienceLab alternatives that complete the full pipeline.",
    type: "article",
    url: "https://www.meetcursive.com/blog/audiencelab-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best AudienceLab Alternatives: Visitor ID Tools With AI Outreach (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best AudienceLab Alternatives: Visitor ID Tools That Include AI Outreach (2026) | Cursive",
    description: "AudienceLab identifies website visitors but stops there — no AI outreach, no intent data, no direct mail. Compare the 7 best alternatives.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/audiencelab-alternative",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'Best AudienceLab Alternatives: Visitor ID Tools That Include AI Outreach (2026)', url: 'https://www.meetcursive.com/blog/audiencelab-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best AudienceLab Alternatives: Visitor ID Tools That Include AI Outreach (2026)',
          description: 'AudienceLab identifies website visitors but stops there — no AI outreach, no intent data, no direct mail. Compare the 7 best AudienceLab alternatives that complete the full pipeline.',
          url: 'https://www.meetcursive.com/blog/audiencelab-alternative',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
