'use client'

/**
 * Integrations Page
 * OpenInfo Platform Marketing Site
 *
 * Showcase available integrations and API capabilities.
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
// INTEGRATIONS DATA
// ============================================

const categories = [
  { id: 'all', name: 'All' },
  { id: 'communication', name: 'Communication' },
  { id: 'project', name: 'Project Management' },
  { id: 'development', name: 'Development' },
  { id: 'crm', name: 'CRM' },
  { id: 'storage', name: 'Storage' },
]

const integrations = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications and submit updates directly from Slack channels.',
    category: 'communication',
    popular: true,
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
      </svg>
    ),
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Sync tasks and receive updates in your Teams workspace.',
    category: 'communication',
    popular: true,
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.796 6.04h-4.148V4.202c0-.659.522-1.196 1.164-1.196h1.82c.643 0 1.164.537 1.164 1.196V6.04zm-2.984 1.003h5.985c.665 0 1.203.553 1.203 1.236v6.323c0 2.046-1.62 3.706-3.62 3.706h-.822c-1.999 0-3.619-1.66-3.619-3.706V7.479c0-.465.394-.436.873-.436zM8.217 3.006c1.89 0 3.424 1.573 3.424 3.515 0 1.941-1.533 3.514-3.424 3.514-1.89 0-3.423-1.573-3.423-3.514 0-1.942 1.532-3.515 3.423-3.515zm5.396 7.03h1.204v7.486c0 2.046-1.62 3.706-3.62 3.706H5.5c-1.999 0-3.619-1.66-3.619-3.706v-5.723c0-.977.772-1.763 1.727-1.763h10.005z" />
      </svg>
    ),
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link commits and PRs to tasks. Track development progress automatically.',
    category: 'development',
    popular: true,
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Integrate with GitLab issues and merge requests.',
    category: 'development',
    popular: false,
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="m23.546 10.93-.963-2.965-1.899-5.831a.476.476 0 0 0-.908 0l-1.9 5.831H6.124l-1.9-5.831a.476.476 0 0 0-.908 0L1.417 7.965.454 10.93a.948.948 0 0 0 .345 1.062l11.185 8.13a.2.2 0 0 0 .232 0l11.185-8.13a.948.948 0 0 0 .345-1.062" />
      </svg>
    ),
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Sync with Jira issues and track sprint progress.',
    category: 'project',
    popular: true,
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z" />
      </svg>
    ),
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Import tasks from Asana and keep everything in sync.',
    category: 'project',
    popular: false,
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.78 12.653c-2.882 0-5.22 2.336-5.22 5.218s2.338 5.22 5.22 5.22c2.881 0 5.22-2.338 5.22-5.22s-2.339-5.218-5.22-5.218zM5.22 12.653C2.338 12.653 0 14.989 0 17.871s2.338 5.22 5.22 5.22 5.22-2.338 5.22-5.22-2.337-5.218-5.22-5.218zM17.218 5.218A5.22 5.22 0 0 0 12 .909a5.218 5.218 0 1 0 5.218 4.309z" />
      </svg>
    ),
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Connect deals to tasks and track team activity in your CRM.',
    category: 'crm',
    popular: true,
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.006 5.415a4.195 4.195 0 0 1 3.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.16 5.22c-.345 0-.69-.045-1.02-.12a3.93 3.93 0 0 1-3.54 2.205c-.6 0-1.17-.135-1.68-.375a4.74 4.74 0 0 1-4.2 2.58 4.79 4.79 0 0 1-4.32-2.73 3.57 3.57 0 0 1-.54.045 3.63 3.63 0 0 1-3.54-3.6c0-1.305.69-2.49 1.8-3.15A4.205 4.205 0 0 1 5.1 6.945a4.18 4.18 0 0 1 4.905-1.53z" />
      </svg>
    ),
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts and deals with HubSpot CRM.',
    category: 'crm',
    popular: false,
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.164 7.93V5.084a2.198 2.198 0 0 0 1.267-1.984v-.066A2.2 2.2 0 0 0 17.23.838h-.066a2.2 2.2 0 0 0-2.199 2.196v.066c0 .87.514 1.617 1.253 1.97v2.862a5.66 5.66 0 0 0-2.756 1.263l-7.27-5.658a2.59 2.59 0 0 0 .073-.588A2.593 2.593 0 1 0 3.674 5.54a2.59 2.59 0 0 0 .442-.038l7.128 5.545a5.693 5.693 0 0 0 .097 6.069l-2.142 2.141a2.085 2.085 0 0 0-.61-.092 2.116 2.116 0 1 0 2.116 2.116c0-.22-.035-.431-.094-.632l2.103-2.103a5.69 5.69 0 1 0 5.45-10.615z" />
      </svg>
    ),
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Attach files from Google Drive to tasks and reports.',
    category: 'storage',
    popular: true,
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="m7.71 3.5-1.42 2.46-4.6 7.96L0 16.38h4.6l6.5-11.25L7.72 3.5Zm1.41 2.46 4.6 7.96H24l-4.6-7.96H9.12Zm7.96 9.12-1.42 2.46-3.18 5.46h4.6l3.19-5.46 1.42-2.46H17.08Zm-4.6 0H7.71L4.53 21h9.12l-1.17-1.96Z" />
      </svg>
    ),
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Link Dropbox files and folders to your workspace.',
    category: 'storage',
    popular: false,
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="m6 2 6 3.75L6 9.5 0 5.75 6 2zm12 0 6 3.75-6 3.75-6-3.75L18 2zM0 13.25 6 9.5l6 3.75L6 17l-6-3.75zm18-3.75 6 3.75L18 17l-6-3.75 6-3.75zM6 18.25l6-3.75 6 3.75L12 22l-6-3.75z" />
      </svg>
    ),
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync pages and databases with Notion workspaces.',
    category: 'project',
    popular: true,
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 2.025c-.42-.326-.98-.7-2.055-.607L3.01 2.871c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.495-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-1.026c1.635-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.933.653.933 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.746-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.448-1.632z" />
      </svg>
    ),
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect to 5,000+ apps with automated workflows.',
    category: 'development',
    popular: true,
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.478 7.544h-2.934L12 4.61l-.544 2.934H8.522l2.39 1.736-.912 2.934L12 10.478l2 1.736-.912-2.934zm8.478 2.39H24l-.544 2.022L24 14l-.044.044-2.978-.044.044 2.978-.044.044-1.978-.544L16.978 18l-1.736-2.39-2.934.912 1.736-2L12.308 12l1.736-2-2.934.912 1.736-2.39-1.978-1.544 2.022-.544L13.434.522l1.544 2.434 1.978-.544-.044.044.044 2.978 2.978-.044.044.044-.544 1.978L21.434 9l-2.39 1.736.912 2.934-2-1.736zm-11.912 4.588-1.736 2.39.912-2.934-2-1.736 2.934.912 1.736-2 .544 2.934h2.934l-2.39 1.736.912 2.934-2-1.736-2 1.736.912-2.934-2.39-1.736h2.934l.544-2.934zM.044 14L0 13.956l2.978.044-.044-2.978.044-.044 1.978.544L7.022 9.5l1.736 2.39 2.934-.912L10 12.714l1.736 2-2.934-.912-1.736 2.39-1.544-2.434L3.5 14.302l.044-.044-.044-2.978-2.978.044L.478 11.28l.544-1.978L-.978 7.5l2.39-1.736-.912-2.934 2 1.736 2-1.736-.912 2.934 2.39 1.736H3.044L2.5 10.434l-1.544-2.434L-.978 9.978 0 10.022v2.934l-.044 1.044z" />
      </svg>
    ),
  },
]

// ============================================
// INTEGRATIONS PAGE
// ============================================

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = React.useState('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <FadeIn>
            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Integrations
            </span>
          </FadeIn>
          <AnimatedHeading
            tag="h1"
            className="text-4xl lg:text-6xl font-bold text-neutral-900 mt-4 mb-6"
          >
            Connect your favorite tools
          </AnimatedHeading>
          <FadeIn delay={0.2}>
            <p className="text-lg lg:text-xl text-neutral-600 max-w-3xl mx-auto mb-8">
              OpenInfo integrates with the tools your team already uses.
              Streamline your workflow with seamless connections.
            </p>
          </FadeIn>

          {/* Search */}
          <FadeIn delay={0.3}>
            <div className="max-w-md mx-auto relative">
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
              <svg
                className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2"
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
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-neutral-100 sticky top-16 bg-white z-30">
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

      {/* Integrations Grid */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {filteredIntegrations.length > 0 ? (
            <AnimatedContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => (
                <AnimatedItem key={integration.id}>
                  <IntegrationCard integration={integration} />
                </AnimatedItem>
              ))}
            </AnimatedContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500">No integrations found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* API Section */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div>
                <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                  Developer API
                </span>
                <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mt-4 mb-6">
                  Build custom integrations
                </h2>
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  Our REST API gives you full access to your workspace data.
                  Build custom integrations, automate workflows, and extend
                  OpenInfo to fit your exact needs.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    'RESTful API with comprehensive documentation',
                    'Webhooks for real-time event notifications',
                    'OAuth 2.0 authentication',
                    'Rate limiting and sandbox environments',
                    'SDKs for popular languages',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-neutral-600">
                      <svg
                        className="w-5 h-5 text-emerald-500 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex gap-4">
                  <AnimatedButton variant="primary">
                    View API Docs
                  </AnimatedButton>
                  <AnimatedButton variant="outline">
                    Get API Key
                  </AnimatedButton>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="bg-neutral-900 rounded-2xl p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <pre className="text-sm text-neutral-300 overflow-x-auto">
                  <code>{`// Get all tasks for a workspace
const response = await fetch(
  'https://api.openinfo.io/v1/tasks',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  }
);

const { tasks } = await response.json();

// Create a new task
await fetch('https://api.openinfo.io/v1/tasks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'New feature implementation',
    assignee: 'user_123',
    status: 'in_progress'
  })
});`}</code>
                </pre>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Request Integration CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <FadeIn>
            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Missing an Integration?
            </span>
          </FadeIn>
          <AnimatedHeading
            tag="h2"
            className="text-3xl lg:text-4xl font-bold text-neutral-900 mt-4 mb-6"
          >
            Let us know what you need
          </AnimatedHeading>
          <FadeIn delay={0.2}>
            <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
              We're always adding new integrations based on customer requests.
              Tell us which tools you'd like to connect with OpenInfo.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <AnimatedButton variant="primary" size="lg">
              Request an Integration
            </AnimatedButton>
          </FadeIn>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterCTA />
    </div>
  )
}

// ============================================
// INTEGRATION CARD
// ============================================

interface IntegrationCardProps {
  integration: typeof integrations[0]
}

function IntegrationCard({ integration }: IntegrationCardProps) {
  return (
    <AnimatedCard className="p-6 group hover:border-neutral-300 transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-700">
          {integration.logo}
        </div>
        {integration.popular && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            Popular
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        {integration.name}
      </h3>
      <p className="text-sm text-neutral-600 mb-4">
        {integration.description}
      </p>

      <div className="flex items-center gap-1 text-sm font-medium text-neutral-900 group-hover:gap-2 transition-all">
        Learn more
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </AnimatedCard>
  )
}
