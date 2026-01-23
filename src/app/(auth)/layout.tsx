// Auth Layout - Simple layout for auth pages

// Force dynamic rendering for all auth pages
export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
