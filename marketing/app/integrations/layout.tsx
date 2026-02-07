import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Integrations - Connect to 50+ Tools',
  description: 'Seamlessly sync Cursive data with your existing marketing stack. 50+ integrations including Salesforce, HubSpot, Google Ads, and more.',
  keywords: ['integrations', 'CRM integration', 'marketing automation', 'API', 'webhooks', 'data sync'],
  canonical: 'https://meetcursive.com/integrations',
})

export default function IntegrationsLayout({ children }: { children: React.ReactNode }) {
  return children
}
