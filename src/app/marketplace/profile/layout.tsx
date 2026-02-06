// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic'

export default function MarketplaceProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
