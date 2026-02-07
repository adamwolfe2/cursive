/**
 * Schema Markup Components
 *
 * Server-side components that render JSON-LD structured data for SEO.
 * Each component outputs a <script type="application/ld+json"> tag.
 *
 * These are server components (no "use client" directive) since they
 * render static JSON-LD. They can also be used inside client components
 * for SSR since script tags are fine in that context.
 */

const BASE_URL = "https://meetcursive.com"

// ---------- Organization Schema ----------

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cursive",
    url: BASE_URL,
    logo: `${BASE_URL}/cursive-logo.png`,
    email: "hello@meetcursive.com",
    foundingDate: "2024",
    description:
      "Cursive is an AI-powered B2B data and outbound platform that helps companies identify website visitors, build targeted audiences, and automate multi-channel outreach.",
    sameAs: [
      "https://twitter.com/meetcursive",
      "https://linkedin.com/company/cursive",
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ---------- Software Application Schema ----------

export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Cursive",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: BASE_URL,
    offers: {
      "@type": "Offer",
      price: "1000",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "1000",
        priceCurrency: "USD",
        unitText: "MONTH",
      },
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
    description:
      "AI-powered B2B data and outbound platform for visitor identification, audience building, and multi-channel campaign automation.",
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ---------- Article Schema ----------

interface ArticleSchemaProps {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  image?: string
  author?: string
}

export function ArticleSchema({
  title,
  description,
  publishedAt,
  updatedAt,
  image,
  author,
}: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: publishedAt,
    ...(updatedAt && { dateModified: updatedAt }),
    ...(image && { image }),
    author: {
      "@type": "Person",
      name: author || "Cursive Team",
    },
    publisher: {
      "@type": "Organization",
      name: "Cursive",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/cursive-logo.png`,
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ---------- FAQ Schema ----------

interface FAQItem {
  question: string
  answer: string
}

interface FAQSchemaProps {
  items: FAQItem[]
}

export function FAQSchema({ items }: FAQSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ---------- Breadcrumb Schema ----------

interface BreadcrumbItem {
  name: string
  href: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href.startsWith("http")
        ? item.href
        : `${BASE_URL}${item.href}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ---------- Product Schema ----------

interface ProductSchemaProps {
  name: string
  description: string
  price?: string
}

export function ProductSchema({ name, description, price }: ProductSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    brand: {
      "@type": "Brand",
      name: "Cursive",
    },
    ...(price && {
      offers: {
        "@type": "Offer",
        price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
