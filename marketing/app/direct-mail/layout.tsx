import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Direct Mail Remarketing - Automated Campaigns',
  description: 'Turn website visitors into physical touchpoints. Launch automated direct mail campaigns starting at $1.50 per piece. 48-hour delivery.',
  keywords: ['direct mail marketing', 'direct mail retargeting', 'postcard marketing', 'automated direct mail', 'direct mail campaigns'],
  canonical: 'https://meetcursive.com/direct-mail',
})

export default function DirectMailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
