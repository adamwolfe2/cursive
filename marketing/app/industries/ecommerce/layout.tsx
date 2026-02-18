import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'B2B Ecommerce Lead Generation - Identify Wholesale Buyers with Cursive',
  description: 'Identify B2B buyers browsing your ecommerce site and convert them with personalized outreach and direct mail. Turn anonymous wholesale visitors into customers.',
  keywords: ['B2B ecommerce lead generation', 'wholesale buyer identification', 'ecommerce visitor identification', 'B2B buyer intent', 'ecommerce outreach'],
  canonical: 'https://www.meetcursive.com/industries/ecommerce',
})

const ecommerceFAQs = [
  {
    question: 'How does Cursive help B2B ecommerce companies identify buyers?',
    answer: 'Cursive identifies up to 70% of the anonymous companies and contacts visiting your B2B ecommerce site, revealing which buyers are browsing your product catalog, wholesale pricing pages, and bulk order flows. This identification enables your sales team to proactively reach out to high-intent prospects with personalized offers before they abandon the site.',
  },
  {
    question: 'What visitor identification rate can ecommerce companies expect?',
    answer: 'B2B ecommerce companies using Cursive typically identify up to 70% of their anonymous website visitors, a dramatic improvement over the 1-3% conversion rate of standard contact forms. This high identification rate ensures your team has a continuous stream of warm wholesale buyer leads without relying solely on inbound form submissions.',
  },
  {
    question: "How does Cursive's direct mail work for ecommerce retargeting?",
    answer: "Cursive can trigger personalized direct mail to identified B2B visitors who don't convert online, sending physical mailers with 95%+ deliverability to the identified business addresses. This omnichannel approach — combining email, digital, and direct mail — significantly increases conversion rates for B2B ecommerce companies by reaching buyers through multiple touchpoints.",
  },
  {
    question: 'Can Cursive integrate with ecommerce platforms like Shopify?',
    answer: 'Cursive integrates with major ecommerce platforms and CRMs, and its lightweight JavaScript pixel can be installed on any ecommerce site including Shopify, WooCommerce, and custom-built platforms. Identified visitor data flows directly into your CRM or can be accessed via webhook for seamless integration into your existing B2B sales workflows.',
  },
  {
    question: 'How do ecommerce teams use intent data for B2B buyer targeting?',
    answer: "Cursive's 450 billion+ intent signal database surfaces companies that are actively researching wholesale purchasing or bulk ordering in your product category, even before they visit your ecommerce site. B2B ecommerce teams use this intent data to proactively reach out to high-fit accounts at the exact moment they are in a buying cycle.",
  },
  {
    question: 'What is the ROI of visitor identification for B2B ecommerce?',
    answer: 'B2B ecommerce companies using Cursive typically see a strong return by converting previously invisible website traffic into wholesale accounts, with many customers recouping their $1,000/month investment from a single new bulk buyer. By identifying and engaging the 70% of visitors who never fill out a form, ecommerce brands unlock a major untapped revenue channel from their existing traffic.',
  },
]

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
          { name: 'Ecommerce', url: 'https://www.meetcursive.com/industries/ecommerce' },
        ]),
        generateFAQSchema(ecommerceFAQs),
      ]} />
      {children}
    </>
  )
}
