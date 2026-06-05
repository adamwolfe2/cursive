export const metadata = {
  title: 'Setup | Cursive',
  description: 'Finish setting up your Cursive pixel and audience.',
}

// Pass-through — child routes handle their own auth and chrome.
export default function FunnelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
