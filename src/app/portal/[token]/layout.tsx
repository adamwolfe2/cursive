export const metadata = {
  title: 'Onboarding Portal | Cursive',
  description: 'Complete your onboarding steps to launch your Cursive campaign.',
}

export default function TokenPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <img
            src="/cursive-logo.png"
            alt="Cursive"
            className="h-8 w-auto"
          />
          <a
            href="mailto:support@meetcursive.com"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Need help?{' '}
            <span className="font-medium text-blue-600 hover:text-blue-700">
              support@meetcursive.com
            </span>
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 lg:py-12">
        {children}
      </main>
    </div>
  )
}
