import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Venture Studio | White-Glove Revenue Engine Partnership',
  description: 'White-glove partnership for ambitious companies. We embed a dedicated team to build, launch, and scale your entire go-to-market. $25,000-$150,000/mo. By application only.',
  keywords: ['venture studio', 'revenue engine', 'go-to-market partnership', 'growth studio', 'white-glove marketing', 'GTM strategy', 'dedicated growth team', 'B2B growth partnership'],
  canonical: 'https://meetcursive.com/venture-studio',
})

export default function VentureStudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
