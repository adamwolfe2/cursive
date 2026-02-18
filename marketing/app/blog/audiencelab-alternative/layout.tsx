import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best AudienceLab Alternatives & Competitors in 2026 | Cursive",
  description: "Looking for AudienceLab alternatives? Compare the best competitors for B2B data, visitor identification, and outreach automation. See why teams choose Cursive for a complete pipeline solution.",
  keywords: [
    "audiencelab alternative",
    "audiencelab alternatives",
    "audiencelab competitors",
    "best alternative to audiencelab",
    "audiencelab vs cursive",
    "audiencelab replacement",
    "b2b data providers",
    "lead generation platforms",
    "audiencelab pricing",
    "full pipeline outreach",
  ].join(", "),

  openGraph: {
    title: "Best AudienceLab Alternatives & Competitors in 2026 | Cursive",
    description: "Looking for AudienceLab alternatives? Compare the best competitors for B2B data, visitor identification, and outreach automation. See why teams choose Cursive for a complete pipeline solution.",
    type: "article",
    url: "https://www.meetcursive.com/blog/audiencelab-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best AudienceLab Alternatives & Competitors in 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best AudienceLab Alternatives & Competitors in 2026 | Cursive",
    description: "Looking for AudienceLab alternatives? Compare the best competitors for B2B data, visitor identification, and outreach automation. See why teams choose Cursive for a complete pipeline solution.",
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
          { name: 'Best AudienceLab Alternatives & Competitors in 2026', url: 'https://www.meetcursive.com/blog/audiencelab-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best AudienceLab Alternatives & Competitors in 2026',
          description: 'Looking for AudienceLab alternatives? Compare the best competitors for B2B data, visitor identification, and outreach automation. See why teams choose Cursive for a complete pipeline solution.',
          url: 'https://www.meetcursive.com/blog/audiencelab-alternative',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
