import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "GDPR-Compliant Website Visitor Identification: Complete Guide (2026)",
  description: "Most visitor identification tools violate GDPR by default. Learn which tools are truly GDPR compliant, why US-only tools are a legal risk, and how to identify visitors without violating EU law.",
  keywords: [
    "gdpr compliant visitor identification",
    "gdpr website visitor tracking",
    "gdpr visitor identification b2b",
    "gdpr compliant b2b lead generation",
    "gdpr website visitor tracking",
    "visitor identification gdpr",
    "b2b visitor tracking compliance",
    "gdpr pixel tracking",
    "consent management visitor identification",
    "legitimate interests visitor tracking",
  ].join(", "),

  openGraph: {
    title: "GDPR-Compliant Website Visitor Identification: Complete Guide (2026)",
    description: "Most visitor identification tools violate GDPR by default. Learn which tools are truly GDPR compliant, why US-only tools are a legal risk, and how to identify visitors without violating EU law.",
    type: "article",
    url: "https://www.meetcursive.com/blog/gdpr-compliant-visitor-identification",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "GDPR-Compliant Website Visitor Identification: Complete Guide (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "GDPR-Compliant Website Visitor Identification: Complete Guide (2026)",
    description: "Most visitor identification tools violate GDPR by default. Learn which tools are truly GDPR compliant, why US-only tools are a legal risk, and how to identify visitors without violating EU law.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/gdpr-compliant-visitor-identification",
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
          { name: 'GDPR-Compliant Website Visitor Identification: Complete Guide (2026)', url: 'https://www.meetcursive.com/blog/gdpr-compliant-visitor-identification' },
        ]),
        generateBlogPostSchema({
          title: 'GDPR-Compliant Website Visitor Identification: Complete Guide (2026)',
          description: 'Most visitor identification tools violate GDPR by default. Learn which tools are truly GDPR compliant, why US-only tools are a legal risk, and how to identify visitors without violating EU law.',
          url: 'https://www.meetcursive.com/blog/gdpr-compliant-visitor-identification',
          datePublished: '2026-02-24',
          dateModified: '2026-02-24',
        }),
      ]} />
      {children}
    </>
  )
}
