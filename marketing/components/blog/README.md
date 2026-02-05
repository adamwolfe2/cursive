# Blog Template System Documentation

A comprehensive, AEO-optimized blog template system for Next.js with full schema markup, mobile responsiveness, and print-friendly styling.

## Overview

This blog template system is built with:

- **Next.js 14+** App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Schema.org JSON-LD** for SEO
- **AEO optimization** for featured snippets and AI citations
- **Mobile-first** responsive design
- **Print-friendly** CSS

## Components

### 1. BlogPostLayout (Main Layout)

**Location**: `components/blog/blog-post-layout.tsx`

The main layout component that orchestrates all blog post elements.

**Features**:
- BlogPosting schema markup
- Responsive layout with sidebar TOC
- Reading time calculation
- Social sharing
- Author information
- FAQ section
- Related posts
- Multiple CTA placements
- Print-optimized styling

**Usage**:
```tsx
import { BlogPostLayout } from '@/components/blog/blog-post-layout'

export default function BlogPostPage() {
  return <BlogPostLayout post={post} relatedPosts={relatedPosts} />
}
```

### 2. Breadcrumbs

**Location**: `components/blog/breadcrumbs.tsx`

Navigation breadcrumbs with BreadcrumbList schema.

**Features**:
- Automatic schema generation
- Accessible navigation
- Print-friendly
- Mobile responsive

**Usage**:
```tsx
<Breadcrumbs
  items={[
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: 'Category', href: '/blog/category' },
    { name: 'Post Title', href: '/blog/category/post-slug' },
  ]}
/>
```

### 3. TableOfContents

**Location**: `components/blog/table-of-contents.tsx`

Auto-scrolling table of contents with active section highlighting.

**Features**:
- Intersection Observer for active sections
- Smooth scroll navigation
- Sticky positioning on desktop
- Mobile accordion view
- H2 and H3 support
- Print hidden

**Usage**:
```tsx
import { extractHeadings } from '@/lib/blog-utils'

const headings = extractHeadings(post.content)

<TableOfContents headings={headings} />
```

### 4. AuthorBox

**Location**: `components/blog/author-box.tsx`

Author information with social links.

**Features**:
- Avatar image
- Bio text
- Social links (Twitter, LinkedIn, Website)
- Accessible social buttons
- Print-friendly

**Usage**:
```tsx
<AuthorBox
  author={{
    name: 'Sarah Chen',
    role: 'Head of Growth',
    avatar: '/images/authors/sarah.jpg',
    bio: 'Sarah leads growth at Cursive...',
    social: {
      twitter: 'https://twitter.com/sarah',
      linkedin: 'https://linkedin.com/in/sarah',
    },
  }}
/>
```

### 5. CTABox

**Location**: `components/blog/cta-box.tsx`

Benefit-focused call-to-action boxes with multiple variants.

**Variants**:
- `demo` - Book a demo
- `trial` - Start free trial
- `pricing` - View pricing
- `newsletter` - Subscribe to newsletter

**Features**:
- Icon differentiation
- Custom titles and descriptions
- Accent color borders
- Mobile responsive
- Print hidden

**Usage**:
```tsx
// Pre-configured variant
<CTABox variant="demo" />

// Custom CTA
<CTABox
  variant="demo"
  customTitle="Ready to identify your visitors?"
  customDescription="See exactly which companies are visiting your site."
  customButtonText="Start Free Trial"
  customButtonHref="/signup"
/>
```

### 6. FAQSection

**Location**: `components/blog/faq-section.tsx`

Expandable FAQ section with FAQ schema markup.

**Features**:
- FAQPage schema generation
- Accordion UI
- Keyboard accessible
- Auto-expanded first question
- Print shows all answers
- Mobile responsive

**Usage**:
```tsx
<FAQSection
  faqs={[
    {
      question: 'How accurate is visitor identification?',
      answer: 'For B2B traffic, visitor identification typically achieves 60-70% accuracy...',
    },
    // More FAQs...
  ]}
  pageUrl="https://meetcursive.com/blog/category/post"
/>
```

### 7. RelatedPosts

**Location**: `components/blog/related-posts.tsx`

Grid of related blog posts with images.

**Features**:
- Image hover effects
- Category badges
- Truncated descriptions
- Responsive grid (1/2/3 columns)
- Print hidden

**Usage**:
```tsx
<RelatedPosts
  posts={[
    {
      title: 'Intent Data Guide',
      description: 'Learn how to use intent data...',
      category: 'lead-generation',
      slug: 'intent-data-guide',
      image: '/images/blog/intent-data.jpg',
      imageAlt: 'Intent data dashboard',
      publishedAt: '2024-01-15T08:00:00Z',
    },
    // More posts...
  ]}
/>
```

### 8. SocialShare

**Location**: `components/blog/social-share.tsx`

Social sharing buttons with copy link functionality.

**Features**:
- Twitter, LinkedIn, Facebook, Email
- Copy to clipboard with visual feedback
- Icon-based buttons
- Mobile responsive
- Print hidden

**Usage**:
```tsx
<SocialShare
  url="https://meetcursive.com/blog/category/post"
  title="The Complete Guide to Visitor Identification"
/>
```

## Utility Functions

### Location: `lib/blog-utils.ts`

**calculateReadingTime(content: string): number**
- Calculates reading time based on 225 words per minute
- Returns minutes (rounded up)

**formatDate(date: string): string**
- Formats ISO date to readable format
- Example: "February 1, 2024"

**extractHeadings(content: string): Heading[]**
- Extracts H2 and H3 headings from HTML/markdown
- Generates URL-friendly IDs
- Returns array with id, text, level

**generateShareUrls(url: string, title: string)**
- Creates share URLs for social platforms
- Returns object with Twitter, LinkedIn, Facebook, Email URLs

**createSlug(title: string): string**
- Converts title to URL-friendly slug
- Lowercase, hyphens, removes special chars

## Content Management

### Location: `lib/blog-content-loader.ts`

Provides multiple options for loading blog content:

**Option 1: Static TypeScript/JavaScript**
- Simple, type-safe
- No external dependencies
- Requires rebuild for changes

**Option 2: Markdown Files**
- Version controlled content
- Easy for developers
- Use gray-matter + remark

**Option 3: Headless CMS**
- Non-technical editing
- Real-time updates
- Contentful, Sanity, Strapi

**Option 4: Database**
- Full control
- Supabase, PostgreSQL
- Dynamic content

## Dynamic Route

### Location: `app/blog/[category]/[slug]/page.tsx`

Next.js dynamic route for blog posts.

**Features**:
- Dynamic metadata generation
- Open Graph tags
- Twitter Card tags
- Canonical URLs
- Schema markup
- 404 handling
- Static generation support (optional)

**Metadata Generated**:
- Page title
- Meta description
- Open Graph (title, description, image, type, dates, authors)
- Twitter Card
- Canonical URL
- Robots directives

## Schema Markup

All schema markup is JSON-LD format, following Google's recommendations.

### BlogPosting Schema
- Headline, description, images
- Author (Person schema)
- Publisher (Organization schema)
- Dates (published, modified)
- Main entity reference

### BreadcrumbList Schema
- Auto-generated from breadcrumb items
- Position-based ordering
- Full URLs

### FAQPage Schema
- Question/Answer pairs
- Only added when FAQs present

## AEO Optimization

This template follows AEO best practices:

### Content Structure
- Clear heading hierarchy (H1 → H2 → H3)
- Question-based headings
- Direct answers in first paragraph
- Natural Q&A format

### Table of Contents
- Jump links to sections
- Improves featured snippet eligibility
- Better user experience

### FAQ Section
- Matches "People Also Ask" format
- FAQ schema for rich results
- Natural language questions

### Featured Snippet Optimization
- Concise definitions (40-60 words)
- Bulleted/numbered lists
- Step-by-step instructions
- Comparison tables (add as needed)

## Styling

### Prose Classes
The template uses Tailwind's prose plugin with customizations:

```css
prose-headings:font-semibold
prose-h2:text-3xl prose-h2:mt-12
prose-h3:text-2xl prose-h3:mt-8
prose-a:text-[#007AFF]
prose-code:text-[#007AFF] prose-code:bg-gray-100
prose-blockquote:border-l-4 prose-blockquote:border-[#007AFF]
```

### Print Styles
- Removes navigation, share buttons, CTAs
- Expands all accordions
- Optimized margins and spacing
- Black and white friendly

### Mobile Responsive
- Collapsible TOC on mobile
- Stacked layout
- Touch-friendly buttons
- Optimized images

## Brand Voice Integration

The template follows Cursive's brand guidelines:

### Voice Principles
- Clear over clever
- Specific over vague
- Benefits over features
- Conversational over corporate
- Honest over hype

### Writing Style
- Short paragraphs (2-4 sentences)
- Active voice
- Second person ("you")
- Remove qualifiers ("very", "really")

### CTAs
- Action verbs
- Specific benefits
- Multiple placements
- Varied throughout content

## Usage Example

### Complete Blog Post Implementation

```tsx
// app/blog/[category]/[slug]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogPostLayout } from '@/components/blog/blog-post-layout'
import { getPostBySlug, getRelatedPosts } from '@/lib/blog-content-loader'

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPostBySlug(params.category, params.slug)

  if (!post) return { title: 'Post Not Found' }

  return {
    title: `${post.title} | Cursive Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: [post.image],
    },
  }
}

export default async function BlogPostPage({ params }) {
  const post = await getPostBySlug(params.category, params.slug)

  if (!post) notFound()

  const relatedPosts = await getRelatedPosts(params.category, params.slug)

  return <BlogPostLayout post={post} relatedPosts={relatedPosts} />
}
```

## TypeScript Types

### BlogPost Interface

```typescript
interface BlogPost {
  title: string
  description: string
  content: string // HTML string
  category: string
  slug: string
  author: {
    name: string
    role: string
    avatar: string
    bio: string
    social?: {
      twitter?: string
      linkedin?: string
      website?: string
    }
  }
  publishedAt: string // ISO 8601
  updatedAt?: string // ISO 8601
  image: string
  imageAlt: string
  tags?: string[]
  faqs?: Array<{
    question: string
    answer: string
  }>
  relatedPosts?: string[] // slugs
}
```

## Performance Optimization

### Image Optimization
- Next.js Image component
- Lazy loading
- Responsive srcsets
- WebP format (automatic)

### Code Splitting
- Components lazy loaded
- Client components marked
- Dynamic imports where needed

### SEO
- Static generation support
- Metadata generation
- Schema markup
- Canonical URLs

## Accessibility

### ARIA Labels
- Navigation landmarks
- Button labels
- Image alt text
- Expandable content

### Keyboard Navigation
- Tab order
- Enter/Space for accordions
- Skip links (via TOC)

### Screen Readers
- Semantic HTML
- Heading hierarchy
- List structures
- Link context

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Print Support

CSS optimized for printing:
- Removes navigation
- Expands all content
- Black/white friendly
- Page break controls

## Future Enhancements

Potential additions:

1. **Reading progress bar**
2. **Estimated read position**
3. **Inline code highlighting** (Prism/Shiki)
4. **Comments section** (Disqus, utterances)
5. **Newsletter signup** inline
6. **Dark mode** support
7. **Multi-language** support
8. **A/B testing** for CTAs
9. **Analytics tracking** (scroll depth, time on page)
10. **Bookmark/save** functionality

## Troubleshooting

### Images not loading
- Check image paths are correct
- Verify Next.js Image domains configured
- Ensure images exist in public directory

### Schema validation errors
- Test with Google Rich Results Test
- Validate JSON-LD syntax
- Check required properties present

### TOC not highlighting
- Verify heading IDs match extracted IDs
- Check Intersection Observer browser support
- Ensure headings have proper ID attributes

### Mobile layout issues
- Test responsive breakpoints
- Check Tailwind config
- Verify mobile-first classes

## Support

For questions or issues:
- Check Next.js documentation
- Review Tailwind CSS docs
- Test schema with Google tools
- Validate HTML with W3C validator

---

**Version**: 1.0.0
**Last Updated**: 2026-02-04
**License**: MIT
