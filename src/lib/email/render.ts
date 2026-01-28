/**
 * Email Rendering Utility
 * Server-only - renders React email components to HTML strings
 */

import 'server-only'
import type { ReactElement } from 'react'

/**
 * Render a React email component to HTML string
 * Uses dynamic import to avoid Next.js SWC static analysis issues
 */
export async function renderEmail(component: ReactElement): Promise<string> {
  // Dynamic import to avoid bundler issues with react-dom/server
  const { renderToStaticMarkup } = await import('react-dom/server')
  return `<!DOCTYPE html>${renderToStaticMarkup(component)}`
}
