import { generateMetadata } from "@/lib/seo/metadata"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"

export const metadata = generateMetadata({
  title: "Integrations: send your leads to the tools you already use",
  description:
    "Send Cursive leads to your CRM, inbox or sequencer with CSV export, webhooks and Zapier. Setup guides for Salesforce, HubSpot, Slack, Zapier and more.",
  keywords: ["lead export", "CRM integration", "webhook", "Zapier", "HubSpot", "Salesforce", "Slack"],
  canonical: "https://www.meetcursive.com/integrations",
})

/* The FAQ schema comes from FAQSection on the page, so it always matches the visible answers. */
export default function IntegrationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: "Home", url: "https://www.meetcursive.com" },
          { name: "Integrations", url: "https://www.meetcursive.com/integrations" },
        ])}
      />
      {children}
    </>
  )
}
