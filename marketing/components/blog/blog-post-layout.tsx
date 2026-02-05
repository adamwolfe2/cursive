import Image from 'next/image'
import { Clock, Calendar } from 'lucide-react'
import { Breadcrumbs } from './breadcrumbs'
import { TableOfContents } from './table-of-contents'
import { CTABox } from './cta-box'
import { FAQSection } from './faq-section'
import { RelatedPosts } from './related-posts'
import { SocialShare } from './social-share'
import { BlogPost } from '@/lib/blog-utils'
import { calculateReadingTime, formatDate, extractHeadings } from '@/lib/blog-utils'

interface BlogPostLayoutProps {
  post: BlogPost
  relatedPosts?: Array<{
    title: string
    description: string
    category: string
    slug: string
    image: string
    imageAlt: string
    publishedAt: string
  }>
}

export function BlogPostLayout({ post, relatedPosts = [] }: BlogPostLayoutProps) {
  const readingTime = calculateReadingTime(post.content)
  const headings = extractHeadings(post.content)
  const pageUrl = `https://meetcursive.com/blog/${post.category}/${post.slug}`

  // Generate BlogPosting schema
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.image,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Cursive',
      logo: {
        '@type': 'ImageObject',
        url: 'https://meetcursive.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: post.category, href: `/blog/${post.category}` },
    { name: post.title, href: `/blog/${post.category}/${post.slug}` },
  ]

  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      <article className="bg-white">
        {/* Header Section */}
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>

        {/* Hero Section */}
        <header className="border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Category Badge */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium text-[#007AFF] bg-blue-50 rounded-full uppercase tracking-wide">
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {post.description}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Image
                  src={post.author.avatar}
                  alt={`${post.author.name} profile picture`}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <div className="font-medium text-gray-900">{post.author.name}</div>
                  <div className="text-xs text-gray-500">{post.author.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{readingTime} min read</span>
                </div>
              </div>
            </div>

            {/* Social Share */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <SocialShare url={pageUrl} title={post.title} />
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.image && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-[1fr_280px] gap-12">
            {/* Article Content */}
            <div className="max-w-3xl">
              {/* Table of Contents - Mobile */}
              {headings.length > 0 && (
                <div className="lg:hidden mb-8 p-6 bg-gray-50 rounded-lg">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                    On This Page
                  </h2>
                  <nav>
                    <ul className="space-y-2">
                      {headings.map((heading) => (
                        <li key={heading.id} className={heading.level === 3 ? 'ml-4' : ''}>
                          <a
                            href={`#${heading.id}`}
                            className="text-sm text-gray-600 hover:text-[#007AFF] transition-colors"
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              )}

              {/* Post Content */}
              <div
                className="prose prose-lg max-w-none
                  prose-headings:font-semibold prose-headings:text-gray-900
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                  prose-a:text-[#007AFF] prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-ul:my-6 prose-ol:my-6
                  prose-li:text-gray-700 prose-li:mb-2
                  prose-code:text-[#007AFF] prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']
                  prose-pre:bg-gray-900 prose-pre:text-gray-100
                  prose-img:rounded-lg prose-img:shadow-md
                  prose-blockquote:border-l-4 prose-blockquote:border-[#007AFF] prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-4
                  print:prose-sm"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* First CTA - After first third of content */}
              <CTABox variant="demo" />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}


              {/* FAQ Section */}
              {post.faqs && post.faqs.length > 0 && (
                <FAQSection faqs={post.faqs} pageUrl={pageUrl} />
              )}

              {/* Second CTA - Before related posts */}
              <CTABox variant="trial" />

              {/* Related Posts */}
              {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
            </div>

            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block">
              <TableOfContents headings={headings} />
            </aside>
          </div>
        </div>
      </article>
    </>
  )
}
