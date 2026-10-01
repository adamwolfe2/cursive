import { Dancing_Script } from 'next/font/google'

// The script accent the marketing site sets under its headlines ("Fill Your Pipeline").
// Shared by /start and the free-leads dashboard home; apply `scriptFont.variable` on a wrapper.
export const scriptFont = Dancing_Script({ subsets: ['latin'], weight: ['500'], variable: '--font-script', display: 'swap' })
