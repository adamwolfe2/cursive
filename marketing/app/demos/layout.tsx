import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Interactive Demos - Experience Cursive',
  description: 'Explore 12 interactive demos showcasing visitor tracking, intent signals, audience building, AI campaigns, and more. See Cursive in action.',
  keywords: ['product demo', 'interactive demo', 'lead generation demo', 'B2B software demo', 'visitor tracking demo'],
  canonical: 'https://meetcursive.com/demos',
})

export default function DemosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
