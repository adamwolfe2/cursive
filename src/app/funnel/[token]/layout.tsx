import Image from 'next/image'

export const metadata = {
  title: 'Your Setup | Cursive',
  description: 'Complete your Cursive setup.',
}

export default function FunnelTokenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Image
            src="/cursive-logo.png"
            alt="Cursive"
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
          />
          <a
            href="mailto:support@meetcursive.com"
            className="text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            Need help?{' '}
            <span className="font-medium text-blue-600 hover:text-blue-700">
              support@meetcursive.com
            </span>
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        {children}
      </main>
    </div>
  )
}
