/**
 * Sitemap Generator
 * OpenInfo Platform Marketing Site
 *
 * Generates dynamic sitemap for SEO.
 */

import type { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://openinfo.io'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Static marketing pages
  const staticPages = [
    '',
    '/about',
    '/pricing',
    '/solutions',
    '/integrations',
    '/blog',
    '/contact',
    '/docs',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Solution pages
  const solutionPages = [
    'engineering',
    'marketing',
    'sales',
    'operations',
    'hr',
    'agencies',
  ].map((slug) => ({
    url: `${baseUrl}/solutions/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Documentation pages
  const docPages = [
    'getting-started',
    'tasks',
    'reports',
    'ai',
    'api/authentication',
    'api/tasks',
    'api/users',
    'integrations/slack',
    'integrations/github',
  ].map((slug) => ({
    url: `${baseUrl}/docs/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // In production, you would fetch blog posts from your CMS/database
  const blogPosts = [
    { slug: 'introducing-ai-insights', date: '2026-01-15' },
    { slug: 'remote-team-productivity', date: '2026-01-10' },
    { slug: 'building-realtime-sync', date: '2026-01-08' },
  ].map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...solutionPages, ...docPages, ...blogPosts]
}
