import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Audience Builder - Create Limitless Targeted Audiences',
  description: 'Access live-intent B2B and B2C data, create limitless audiences, and engage across every channel. 25,000+ categories, 220M+ consumer profiles, 140M+ business profiles.',
  keywords: ['audience builder', 'audience targeting', 'B2B audience builder', 'intent-based targeting', 'audience segmentation'],
  canonical: 'https://meetcursive.com/audience-builder',
})

export default function AudienceBuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
