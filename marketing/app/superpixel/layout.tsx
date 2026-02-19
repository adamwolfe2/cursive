import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cursive Super Pixel — Turn Anonymous Website Visitors Into Verified Leads | Book a Demo',
  description: 'The Cursive Super Pixel V4 identifies, enriches, and delivers your website visitors as verified leads with name, email, mobile, and intent score — in real time. 98% US coverage. 60B+ daily intent signals. 0.05% bounce rate.',
  openGraph: {
    title: 'Cursive Super Pixel — Turn Anonymous Website Visitors Into Verified Leads',
    description: 'The Cursive Super Pixel V4 identifies your website visitors as verified leads with name, email, mobile, and intent score — in real time.',
    type: 'website',
    url: 'https://www.meetcursive.com/superpixel',
    siteName: 'Cursive',
    images: [{ url: 'https://www.meetcursive.com/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cursive Super Pixel — Turn Anonymous Website Visitors Into Verified Leads',
    description: 'Identify your website visitors as verified leads with name, email, mobile, and intent score in real time.',
    images: ['https://www.meetcursive.com/og-image.png'],
  },
  alternates: { canonical: 'https://www.meetcursive.com/superpixel' },
  robots: { index: true, follow: true },
}

export default function SuperPixelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
