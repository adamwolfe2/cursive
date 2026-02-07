import { generateMetadata as genMeta } from '@/lib/seo/metadata'

export const metadata = genMeta({
  title: 'What is Lead Enrichment? Complete Guide (2026)',
  description: 'Learn what lead enrichment is, how it works, types of enrichment data (firmographic, technographic, intent), implementation strategies, and how to choose the right provider for your B2B sales and marketing team.',
  keywords: [
    'lead enrichment',
    'data enrichment',
    'B2B data enrichment',
    'lead enrichment software',
    'CRM enrichment',
    'contact enrichment',
    'firmographic data',
    'technographic data',
    'lead enrichment tools',
    'enrichment API',
  ],
  canonical: 'https://meetcursive.com/what-is-lead-enrichment',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
