import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'eCommerce Marketing Solutions',
  description: 'Turn anonymous visitors into customers. Identify shoppers, build high-intent audiences, and activate across channels with verified consumer data.',
  keywords: ['ecommerce marketing', 'online store visitor tracking', 'ecommerce retargeting', 'cart abandonment', 'ecommerce lead generation'],
  canonical: 'https://meetcursive.com/industries/ecommerce',
})

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  return children
}
