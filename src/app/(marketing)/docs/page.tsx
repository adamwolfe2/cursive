'use client'

/**
 * Documentation Landing Page
 * OpenInfo Platform Marketing Site
 *
 * Entry point for documentation and help resources.
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
} from '@/components/marketing'

// ============================================
// DOCS DATA
// ============================================

const quickLinks = [
  {
    title: 'Getting Started',
    description: 'Set up your workspace and invite your team in minutes.',
    href: '/docs/getting-started',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'bg-emerald-500',
  },
  {
    title: 'Tasks & Workflows',
    description: 'Learn how to create tasks, assign team members, and track progress.',
    href: '/docs/tasks',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    color: 'bg-blue-500',
  },
  {
    title: 'Reports & Analytics',
    description: 'Generate insights and track team performance.',
    href: '/docs/reports',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'bg-purple-500',
  },
  {
    title: 'AI Features',
    description: 'Discover how AI powers insights and automation.',
    href: '/docs/ai',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'bg-amber-500',
  },
]

const docSections = [
  {
    title: 'Guides',
    description: 'Step-by-step tutorials and how-to guides.',
    articles: [
      { title: 'Quick Start Guide', href: '/docs/guides/quick-start' },
      { title: 'Setting Up Your Workspace', href: '/docs/guides/workspace-setup' },
      { title: 'Inviting Team Members', href: '/docs/guides/inviting-team' },
      { title: 'Creating Your First Task', href: '/docs/guides/first-task' },
      { title: 'Understanding Reports', href: '/docs/guides/reports' },
    ],
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation for developers.',
    articles: [
      { title: 'Authentication', href: '/docs/api/authentication' },
      { title: 'Tasks API', href: '/docs/api/tasks' },
      { title: 'Users API', href: '/docs/api/users' },
      { title: 'Workspaces API', href: '/docs/api/workspaces' },
      { title: 'Webhooks', href: '/docs/api/webhooks' },
    ],
  },
  {
    title: 'Integrations',
    description: 'Connect with your favorite tools.',
    articles: [
      { title: 'Slack Integration', href: '/docs/integrations/slack' },
      { title: 'GitHub Integration', href: '/docs/integrations/github' },
      { title: 'Jira Integration', href: '/docs/integrations/jira' },
      { title: 'Zapier Integration', href: '/docs/integrations/zapier' },
      { title: 'Custom Integrations', href: '/docs/integrations/custom' },
    ],
  },
  {
    title: 'Administration',
    description: 'Manage your organization and settings.',
    articles: [
      { title: 'User Management', href: '/docs/admin/users' },
      { title: 'Billing & Subscription', href: '/docs/admin/billing' },
      { title: 'Security Settings', href: '/docs/admin/security' },
      { title: 'SSO & SAML', href: '/docs/admin/sso' },
      { title: 'Audit Logs', href: '/docs/admin/audit-logs' },
    ],
  },
]

const popularArticles = [
  { title: 'How to create an End-of-Day report', views: '12.5k' },
  { title: 'Setting up team notifications', views: '8.2k' },
  { title: 'Using AI insights effectively', views: '7.8k' },
  { title: 'Managing workspace permissions', views: '6.4k' },
  { title: 'Integrating with Slack', views: '5.9k' },
]

// ============================================
// DOCS PAGE
// ============================================

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = React.useState('')

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <FadeIn>
            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Documentation
            </span>
          </FadeIn>
          <AnimatedHeading
            tag="h1"
            className="text-4xl lg:text-6xl font-bold text-neutral-900 mt-4 mb-6"
          >
            Learn how to use OpenInfo
          </AnimatedHeading>
          <FadeIn delay={0.2}>
            <p className="text-lg lg:text-xl text-neutral-600 max-w-2xl mx-auto mb-8">
              Everything you need to get started and become a power user.
              Guides, tutorials, and API documentation.
            </p>
          </FadeIn>

          {/* Search */}
          <FadeIn delay={0.3}>
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pl-14 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-lg shadow-sm"
              />
              <svg
                className="w-6 h-6 text-neutral-400 absolute left-5 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <kbd className="absolute right-5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-neutral-400 bg-neutral-100 rounded">
                ⌘K
              </kbd>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 lg:py-16 -mt-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link) => (
              <AnimatedItem key={link.title}>
                <Link href={link.href}>
                  <AnimatedCard className="p-6 h-full group hover:border-neutral-300 transition-colors">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4',
                      link.color
                    )}>
                      {link.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {link.description}
                    </p>
                  </AnimatedCard>
                </Link>
              </AnimatedItem>
            ))}
          </AnimatedContainer>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedContainer className="grid md:grid-cols-2 gap-8">
            {docSections.map((section) => (
              <AnimatedItem key={section.title}>
                <AnimatedCard className="p-6">
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {section.title}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    {section.description}
                  </p>
                  <ul className="space-y-2">
                    {section.articles.map((article) => (
                      <li key={article.href}>
                        <Link
                          href={article.href}
                          className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900 transition-colors py-1"
                        >
                          <svg
                            className="w-4 h-4 text-neutral-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="text-sm">{article.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/docs/${section.title.toLowerCase().replace(' ', '-')}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-neutral-900 mt-4 hover:gap-2 transition-all"
                  >
                    View all
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </AnimatedCard>
              </AnimatedItem>
            ))}
          </AnimatedContainer>
        </div>
      </section>

      {/* Popular Articles & Help */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Popular Articles */}
            <FadeIn>
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                  Popular Articles
                </h2>
                <div className="space-y-4">
                  {popularArticles.map((article, index) => (
                    <Link
                      key={article.title}
                      href="#"
                      className="flex items-center gap-4 p-4 rounded-xl border border-neutral-100 hover:border-neutral-300 transition-colors group"
                    >
                      <span className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center text-sm font-semibold text-neutral-500 group-hover:bg-neutral-200 transition-colors">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors">
                          {article.title}
                        </div>
                      </div>
                      <span className="text-sm text-neutral-500">
                        {article.views} views
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Help Section */}
            <FadeIn delay={0.2}>
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                  Need more help?
                </h2>

                <div className="space-y-4">
                  <AnimatedCard className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-700">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          Community Forum
                        </h3>
                        <p className="text-sm text-neutral-600 mb-3">
                          Ask questions and share knowledge with other users.
                        </p>
                        <a href="/community" className="text-sm font-medium text-neutral-900 hover:underline">
                          Visit Forum →
                        </a>
                      </div>
                    </div>
                  </AnimatedCard>

                  <AnimatedCard className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-700">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          Email Support
                        </h3>
                        <p className="text-sm text-neutral-600 mb-3">
                          Get help from our support team within 24 hours.
                        </p>
                        <a href="/contact" className="text-sm font-medium text-neutral-900 hover:underline">
                          Contact Support →
                        </a>
                      </div>
                    </div>
                  </AnimatedCard>

                  <AnimatedCard className="p-6 bg-neutral-900 border-neutral-800">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">
                          Schedule a Demo
                        </h3>
                        <p className="text-sm text-neutral-400 mb-3">
                          Get a personalized walkthrough with our team.
                        </p>
                        <a href="/demo" className="text-sm font-medium text-white hover:underline">
                          Book Demo →
                        </a>
                      </div>
                    </div>
                  </AnimatedCard>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Status & Updates */}
      <section className="py-12 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm text-neutral-600">All systems operational</span>
              </div>
              <a
                href="/status"
                className="text-sm font-medium text-neutral-900 hover:underline"
              >
                View Status Page
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/changelog"
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                Changelog
              </a>
              <a
                href="/roadmap"
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                Roadmap
              </a>
              <a
                href="https://github.com/openinfo"
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
