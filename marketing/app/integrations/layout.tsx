import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Integrations - Connect to 200+ Tools',
  description: 'Seamlessly sync Cursive data with your existing marketing stack. 200+ integrations including Salesforce, HubSpot, Google Ads, and more.',
  keywords: ['integrations', 'CRM integration', 'marketing automation', 'API', 'webhooks', 'data sync'],
  canonical: 'https://www.meetcursive.com/integrations',
})

export default function IntegrationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Integrations', url: 'https://www.meetcursive.com/integrations' },
      ])} />
      {children}
    </>
  )
}
