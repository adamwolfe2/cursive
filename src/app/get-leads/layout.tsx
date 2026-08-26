import Image from 'next/image'
import { AudienceCycleCountdown } from './AudienceCycleCountdown'

export const metadata = {
  title: 'Cursive — Find the people searching for your product',
  description:
    'See the companies visiting your site + a weekly list of people actively searching for what you sell.',
}

export default function GetLeadsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <AudienceCycleCountdown />
      <header className="border-b border-gray-100 bg-white">
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
            Questions?{' '}
            <span className="font-medium text-blue-600 hover:text-blue-700">
              support@meetcursive.com
            </span>
          </a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
