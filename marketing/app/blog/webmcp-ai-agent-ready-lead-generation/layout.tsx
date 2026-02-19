import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'First AI-Agent-Ready Lead Gen Platform | Cursive',
  description: 'Google shipped WebMCP in Chrome 146 — AI agents now interact with websites through structured tools. Here\'s why we implemented it and what it means for B2B.',
  keywords: ['WebMCP', 'AI agent website', 'agentic web', 'AI-powered lead generation', 'browser AI agents', 'WebMCP implementation', 'visitor identification AI'],
  canonical: 'https://www.meetcursive.com/blog/webmcp-ai-agent-ready-lead-generation',
})

export default function WebMcpBlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'First AI-Agent-Ready Lead Gen Platform', url: 'https://www.meetcursive.com/blog/webmcp-ai-agent-ready-lead-generation' },
        ]),
        generateBlogPostSchema({
          title: 'Why We Made Cursive the First AI-Agent-Ready Lead Gen Platform (And What WebMCP Means for B2B)',
          description: 'Google shipped WebMCP in Chrome 146 — a new standard that lets AI agents interact with websites through structured tools instead of guessing at buttons. Here\'s why we implemented it on day one.',
          url: 'https://www.meetcursive.com/blog/webmcp-ai-agent-ready-lead-generation',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
