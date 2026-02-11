import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Data Clean Room - Secure Data Collaboration',
  description: 'Collaborate with partners and match audiences without exposing personal information. Privacy-preserving data joins with GDPR and CCPA compliance.',
  keywords: ['data clean room', 'secure data sharing', 'privacy-preserving analytics', 'data collaboration', 'data matching'],
  canonical: 'https://www.meetcursive.com/clean-room',
})

export default function CleanRoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
