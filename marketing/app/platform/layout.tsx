import { metadata } from "./metadata"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"

export { metadata }

/* No ratings or review counts: we have none to show. The FAQ schema comes from FAQSection on the page. */
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Cursive",
  serviceType: "B2B lead generation and done-for-you outreach",
  url: "https://www.meetcursive.com/platform",
  description:
    "Find your buyers from your website, have Cursive reach them with LinkedIn and email outreach, and run it all from a dashboard built for your company.",
  provider: { "@type": "Organization", name: "Cursive", url: "https://www.meetcursive.com" },
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData
        data={[
          serviceSchema,
          generateBreadcrumbSchema([
            { name: "Home", url: "https://www.meetcursive.com" },
            { name: "Platform", url: "https://www.meetcursive.com/platform" },
          ]),
        ]}
      />
      {children}
    </>
  )
}
