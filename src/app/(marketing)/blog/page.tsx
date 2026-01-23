'use client'

/**
 * Blog/Resources Page
 * OpenInfo Platform Marketing Site
 *
 * Blog posts, guides, and resources.
 */

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/design-system'
import {
  FadeIn,
  AnimatedHeading,
  AnimatedCard,
  AnimatedContainer,
  AnimatedItem,
  AnimatedButton,
  NewsletterCTA,
} from '@/components/marketing'

// ============================================
// BLOG DATA
// ============================================

const categories = [
  { id: 'all', name: 'All Posts' },
  { id: 'product', name: 'Product Updates' },
  { id: 'guides', name: 'Guides & Tutorials' },
  { id: 'engineering', name: 'Engineering' },
  { id: 'culture', name: 'Company Culture' },
  { id: 'case-studies', name: 'Case Studies' },
]

const featuredPost = {
  id: 'introducing-ai-insights',
  title: 'Introducing AI-Powered Insights: Transform Your Team Reports',
  excerpt: 'Today we\'re launching our most requested feature: AI that understands your team\'s work and generates actionable insights automatically.',
  category: 'product',
  author: {
    name: 'Sarah Johnson',
    role: 'CTO',
    avatar: '/team/sarah.jpg',
  },
  date: '2026-01-15',
  readTime: '5 min read',
  image: '/blog/ai-insights-hero.jpg',
}

const posts = [
  {
    id: 'remote-team-productivity',
    title: '7 Strategies for Remote Team Productivity',
    excerpt: 'Learn how leading companies are keeping their distributed teams aligned and productive.',
    category: 'guides',
    author: { name: 'Alex Chen', avatar: '/team/alex.jpg' },
    date: '2026-01-10',
    readTime: '8 min read',
  },
  {
    id: 'building-realtime-sync',
    title: 'Building Real-Time Sync at Scale',
    excerpt: 'How we built our real-time collaboration engine to handle millions of concurrent updates.',
    category: 'engineering',
    author: { name: 'Emily Park', avatar: '/team/emily.jpg' },
    date: '2026-01-08',
    readTime: '12 min read',
  },
  {
    id: 'techcorp-case-study',
    title: 'How TechCorp Reduced Meeting Time by 40%',
    excerpt: 'A deep dive into how one engineering team transformed their workflow with OpenInfo.',
    category: 'case-studies',
    author: { name: 'Marcus Williams', avatar: '/team/marcus.jpg' },
    date: '2026-01-05',
    readTime: '6 min read',
  },
  {
    id: 'async-communication',
    title: 'The Art of Async Communication',
    excerpt: 'Why asynchronous communication is the future of work and how to master it.',
    category: 'guides',
    author: { name: 'Alex Chen', avatar: '/team/alex.jpg' },
    date: '2026-01-02',
    readTime: '7 min read',
  },
  {
    id: 'our-remote-culture',
    title: 'Building Culture in a Remote-First Company',
    excerpt: 'Lessons learned from scaling a fully distributed team across 12 time zones.',
    category: 'culture',
    author: { name: 'Sarah Johnson', avatar: '/team/sarah.jpg' },
    date: '2025-12-28',
    readTime: '9 min read',
  },
  {
    id: 'q4-product-updates',
    title: 'Q4 Product Updates: What\'s New',
    excerpt: 'A roundup of all the features and improvements we shipped in Q4 2025.',
    category: 'product',
    author: { name: 'Marcus Williams', avatar: '/team/marcus.jpg' },
    date: '2025-12-20',
    readTime: '4 min read',
  },
]

const resources = [
  {
    type: 'Guide',
    title: 'Getting Started with OpenInfo',
    description: 'A comprehensive guide to setting up your workspace and inviting your team.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    type: 'Template',
    title: 'End-of-Day Report Templates',
    description: 'Pre-built templates to help your team write effective daily updates.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    type: 'Webinar',
    title: 'Mastering Team Analytics',
    description: 'Watch our product team demonstrate advanced reporting features.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    type: 'Ebook',
    title: 'The Future of Work Report 2026',
    description: 'Our annual research on workplace trends and productivity.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
]

// ============================================
// BLOG PAGE
// ============================================

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = React.useState('all')

  const filteredPosts = posts.filter(
    (post) => selectedCategory === 'all' || post.category === selectedCategory
  )

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <FadeIn>
            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Blog & Resources
            </span>
          </FadeIn>
          <AnimatedHeading
            tag="h1"
            className="text-4xl lg:text-6xl font-bold text-neutral-900 mt-4 mb-6"
          >
            Insights for modern teams
          </AnimatedHeading>
          <FadeIn delay={0.2}>
            <p className="text-lg lg:text-xl text-neutral-600 max-w-3xl mx-auto">
              Product updates, guides, engineering deep dives, and lessons learned
              from building the future of team collaboration.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <Link href={`/blog/${featuredPost.id}`}>
              <AnimatedCard className="overflow-hidden group">
                <div className="grid lg:grid-cols-2">
                  <div className="bg-gradient-to-br from-neutral-100 to-neutral-200 aspect-video lg:aspect-auto min-h-[300px] flex items-center justify-center">
                    <span className="text-neutral-400 text-sm">Featured Image</span>
                  </div>
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Featured
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        {categories.find(c => c.id === featuredPost.category)?.name}
                      </span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4 group-hover:text-neutral-600 transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-neutral-600 mb-6">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-neutral-500">
                          {featuredPost.author.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{featuredPost.author.name}</div>
                        <div className="text-sm text-neutral-500">
                          {new Date(featuredPost.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })} · {featuredPost.readTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Categories */}
      <section className="py-4 border-b border-neutral-100 sticky top-16 bg-white z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  selectedCategory === category.id
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <AnimatedItem key={post.id}>
                <BlogPostCard post={post} />
              </AnimatedItem>
            ))}
          </AnimatedContainer>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500">No posts found in this category.</p>
            </div>
          )}

          <FadeIn delay={0.4}>
            <div className="text-center mt-12">
              <AnimatedButton variant="outline" size="lg">
                Load More Posts
              </AnimatedButton>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <FadeIn>
              <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                Resources
              </span>
            </FadeIn>
            <AnimatedHeading
              tag="h2"
              className="text-3xl lg:text-4xl font-bold text-neutral-900 mt-4"
            >
              Learn and grow
            </AnimatedHeading>
          </div>

          <AnimatedContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource) => (
              <AnimatedItem key={resource.title}>
                <AnimatedCard className="p-6 h-full group hover:border-neutral-300 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-700 mb-4 group-hover:bg-neutral-200 transition-colors">
                    {resource.icon}
                  </div>
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                    {resource.type}
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {resource.description}
                  </p>
                </AnimatedCard>
              </AnimatedItem>
            ))}
          </AnimatedContainer>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterCTA />
    </div>
  )
}

// ============================================
// BLOG POST CARD
// ============================================

interface BlogPostCardProps {
  post: typeof posts[0]
}

function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link href={`/blog/${post.id}`}>
      <AnimatedCard className="h-full group hover:border-neutral-300 transition-colors overflow-hidden">
        <div className="bg-gradient-to-br from-neutral-100 to-neutral-200 aspect-video flex items-center justify-center">
          <span className="text-neutral-400 text-xs">Image</span>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              {categories.find(c => c.id === post.category)?.name}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-neutral-500">
                {post.author.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="text-sm text-neutral-500">
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })} · {post.readTime}
            </div>
          </div>
        </div>
      </AnimatedCard>
    </Link>
  )
}
