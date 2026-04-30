export const metadata = {
  title: 'Client Portal | Cursive',
  description: 'Track your onboarding and campaign progress with Cursive.',
}

// Minimal pass-through layout — child routes handle their own auth/token checks.
// portal/page.tsx handles Supabase auth for /portal.
// portal/[token]/page.tsx handles token auth for /portal/[token].
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
