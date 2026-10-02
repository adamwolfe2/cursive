import { generateMetadata } from "@/lib/seo/metadata"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"

export const metadata = generateMetadata({
  title: "FAQ: questions about Cursive leads, outreach and pricing",
  description:
    "Answers about your 25 free leads, how Cursive finds and checks them, done-for-you outreach, the Visitor Pixel, pricing and privacy.",
  keywords: ["Cursive FAQ", "free B2B leads questions", "lead credits", "done-for-you outreach questions", "Visitor Pixel"],
  canonical: "https://www.meetcursive.com/faq",
})

/* The FAQ schema comes from FAQSection on the page, built from the same answers visitors read. */
export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: "Home", url: "https://www.meetcursive.com" },
          { name: "FAQ", url: "https://www.meetcursive.com/faq" },
        ])}
      />
      {children}
    </>
  )
}
