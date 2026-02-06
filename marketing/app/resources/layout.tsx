import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Resources - Guides on Visitor Identification & Lead Generation',
  description: 'Expert guides, blog posts, and resources on visitor identification, intent data, audience building, direct mail, and B2B lead generation strategies. Learn how to turn anonymous traffic into qualified leads.',
  keywords: ['marketing resources', 'visitor identification guides', 'lead generation resources', 'B2B marketing guides', 'intent data resources', 'audience building guides', 'marketing blog'],
  canonical: 'https://www.meetcursive.com/resources',
})

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children
}
