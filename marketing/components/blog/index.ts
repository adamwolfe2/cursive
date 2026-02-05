/**
 * Blog Components Export Index
 *
 * Central export point for all blog-related components.
 * Import from this file for cleaner imports throughout your app.
 *
 * @example
 * import { BlogPostLayout, CTABox, FAQSection } from '@/components/blog'
 */

export { BlogPostLayout } from './blog-post-layout'
export { Breadcrumbs } from './breadcrumbs'
export { TableOfContents } from './table-of-contents'
export { AuthorBox } from './author-box'
export { CTABox } from './cta-box'
export { FAQSection } from './faq-section'
export { RelatedPosts } from './related-posts'
export { SocialShare } from './social-share'

// Re-export types and utilities for convenience
export type { BlogPost } from '@/lib/blog-utils'
export {
  calculateReadingTime,
  formatDate,
  extractHeadings,
  generateShareUrls,
  createSlug,
} from '@/lib/blog-utils'
