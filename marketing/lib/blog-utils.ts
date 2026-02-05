/**
 * Blog utility functions for reading time, dates, and content processing
 */

export interface BlogPost {
  title: string
  description: string
  content: string
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
  publishedAt: string
  updatedAt?: string
  image: string
  imageAlt: string
  tags?: string[]
  faqs?: Array<{
    question: string
    answer: string
  }>
  relatedPosts?: string[]
}

/**
 * Calculate reading time based on word count
 * Average reading speed: 200-250 words per minute
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 225
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

/**
 * Format date for display
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Extract headings from markdown/HTML content for table of contents
 */
export function extractHeadings(content: string): Array<{
  id: string
  text: string
  level: number
}> {
  // Match H2 and H3 headings (## and ###)
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const headings: Array<{ id: string; text: string; level: number }> = []

  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')

    headings.push({ id, text, level })
  }

  return headings
}

/**
 * Generate social share URLs
 */
export function generateShareUrls(url: string, title: string) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
  }
}

/**
 * Create slug from title
 */
export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
