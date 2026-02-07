import { Metadata } from "next"
import { generateOrganizationSchema } from "@/lib/seo/structured-data"

export const metadata: Metadata = {
  title: "About Cursive | AI-Powered Lead Generation Platform",
  description: "Meet the team behind Cursive. We built the world's most advanced visitor identification and AI outreach platform because we were tired of bad lead data.",
  keywords: "about cursive, lead generation platform, B2B data, visitor identification, AI outreach, team",
  openGraph: {
    title: "About Cursive | AI-Powered Lead Generation Platform",
    description: "Meet the team behind Cursive. We built the world's most advanced visitor identification and AI outreach platform because we were tired of bad lead data.",
    url: "https://meetcursive.com/about",
    siteName: "Cursive",
    images: [{
      url: "https://meetcursive.com/cursive-social-preview.png",
      width: 1200,
      height: 630,
    }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Cursive | AI-Powered Lead Generation Platform",
    description: "Meet the team behind Cursive. We built the world's most advanced visitor identification and AI outreach platform because we were tired of bad lead data.",
    images: ["https://meetcursive.com/cursive-social-preview.png"],
    creator: "@meetcursive",
  },
  alternates: {
    canonical: "https://meetcursive.com/about",
  },
  other: {
    // Organization Schema
    'script:ld+json:organization': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Cursive',
      url: 'https://meetcursive.com',
      logo: 'https://meetcursive.com/cursive-logo.png',
      description: 'AI-powered B2B lead generation and outbound automation platform',
      sameAs: [
        'https://twitter.com/meetcursive',
        'https://linkedin.com/company/cursive',
      ],
      foundingDate: '2023',
      areaServed: ['US', 'CA', 'UK', 'AU'],
      slogan: 'Turn Website Visitors Into Booked Meetings',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-844-CURSIVE',
        contactType: 'Sales',
        email: 'hello@meetcursive.com',
        areaServed: 'US',
        availableLanguage: ['en']
      },
    }),
    // Company Mission Schema
    'script:ld+json:mission': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: 'Cursive Mission',
      description: 'Make lead generation effortless by providing high-quality verified leads, AI-powered outreach, and done-for-you campaigns accessible to every company.',
      text: 'Every company deserves access to high-quality leads without hiring an army of BDRs or stitching together 10 tools.'
    }),
  }
}
