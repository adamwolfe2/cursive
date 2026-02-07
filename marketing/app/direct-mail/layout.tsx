import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Direct Mail Automation - Trigger Physical Mail from Digital Behavior',
  description: 'Automate B2B direct mail campaigns triggered by website visits and digital behavior. Send personalized postcards starting at $1.50/piece with 3-5x higher conversion than digital alone.',
  keywords: [
    'direct mail automation',
    'B2B direct mail',
    'automated postcards',
    'programmatic direct mail',
    'triggered direct mail',
    'physical mail marketing',
    'direct mail retargeting',
    'website to mailbox',
  ],
  canonical: 'https://meetcursive.com/direct-mail',
})

export default function DirectMailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
