import { generateMetadata } from "@/lib/seo/metadata"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"

const DESCRIPTION =
  "Add the Visitor Pixel for $97 a month to see which companies visit your site and what they looked at. An add-on to your leads and outreach, month-to-month."

export const metadata = generateMetadata({
  title: "Visitor Pixel: see which companies visit your site",
  description: DESCRIPTION,
  keywords: ["website visitor pixel", "which companies visit my website", "B2B visitor tracking", "visitor identification add-on"],
  canonical: "https://www.meetcursive.com/pixel",
})

/* The FAQ schema comes from FAQSection on the page, so it always matches the visible answers. */
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://www.meetcursive.com/pixel#product",
  name: "Cursive Visitor Pixel",
  description: DESCRIPTION,
  brand: { "@type": "Brand", name: "Cursive" },
  offers: {
    "@type": "Offer",
    priceCurrency: "USD",
    price: "97",
    priceSpecification: { "@type": "UnitPriceSpecification", price: "97", priceCurrency: "USD", unitCode: "MON" },
    availability: "https://schema.org/InStock",
    url: "https://leads.meetcursive.com/get-leads",
  },
}

export default function PixelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData
        data={[
          productSchema,
          generateBreadcrumbSchema([
            { name: "Home", url: "https://www.meetcursive.com" },
            { name: "Visitor Pixel", url: "https://www.meetcursive.com/pixel" },
          ]),
        ]}
      />
      {children}
    </>
  )
}
