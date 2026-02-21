import type { Metadata } from 'next'
import { SettingsLayoutClient } from './settings-layout-client'

export const metadata: Metadata = {
  title: 'Settings | Cursive',
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SettingsLayoutClient>{children}</SettingsLayoutClient>
}
