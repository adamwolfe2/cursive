// Force dynamic — this page uses Supabase auth which requires runtime env vars
export const dynamic = 'force-dynamic'

export default function MarketplaceProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
