/**
 * Structured Data Components
 * OpenInfo Platform Marketing Site
 *
 * Components for rendering JSON-LD structured data.
 */

import * as React from 'react'
import {
  generateOrganizationSchema,
  generateSoftwareSchema,
  generateFAQSchema,
  generateBlogPostSchema,
  generateBreadcrumbSchema,
  generatePricingSchema,
} from '@/lib/seo'

// ============================================
// STRUCTURED DATA COMPONENTS
// ============================================

/**
 * Base JSON-LD component
 */
function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  )
}

/**
 * Organization structured data
 */
export function OrganizationJsonLd() {
  return <JsonLd data={generateOrganizationSchema()} />
}

/**
 * Software application structured data
 */
export function SoftwareJsonLd() {
  return <JsonLd data={generateSoftwareSchema()} />
}

/**
 * FAQ page structured data
 */
interface FAQJsonLdProps {
  faqs: { question: string; answer: string }[]
}

export function FAQJsonLd({ faqs }: FAQJsonLdProps) {
  return <JsonLd data={generateFAQSchema(faqs)} />
}

/**
 * Blog post structured data
 */
interface BlogPostJsonLdProps {
  title: string
  description: string
  image?: string
  publishedAt: string
  updatedAt?: string
  author: { name: string; url?: string }
  slug: string
}

export function BlogPostJsonLd(props: BlogPostJsonLdProps) {
  return <JsonLd data={generateBlogPostSchema(props)} />
}

/**
 * Breadcrumb structured data
 */
interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[]
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  return <JsonLd data={generateBreadcrumbSchema(items)} />
}

/**
 * Pricing page structured data
 */
export function PricingJsonLd() {
  return <JsonLd data={generatePricingSchema()} />
}

// ============================================
// COMBINED SCHEMAS FOR PAGES
// ============================================

/**
 * Home page structured data (organization + software)
 */
export function HomePageJsonLd() {
  return (
    <>
      <OrganizationJsonLd />
      <SoftwareJsonLd />
    </>
  )
}

/**
 * Pricing page structured data
 */
export function PricingPageJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[]
}) {
  return (
    <>
      <OrganizationJsonLd />
      <PricingJsonLd />
      <FAQJsonLd faqs={faqs} />
    </>
  )
}
