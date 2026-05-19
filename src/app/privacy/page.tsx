import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Privacy Policy — Cursive',
  description:
    'The canonical Cursive Privacy Policy is published at https://www.meetcursive.com/privacy. This page redirects there.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://www.meetcursive.com/privacy' },
}

export default function PrivacyPage() {
  redirect('https://www.meetcursive.com/privacy')
}
