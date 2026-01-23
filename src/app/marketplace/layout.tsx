/**
 * Marketplace Layout
 * Force dynamic rendering for all marketplace pages
 */

export const dynamic = 'force-dynamic'

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
