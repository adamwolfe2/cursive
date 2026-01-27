/**
 * Email Template Renderer
 * Server-only utility for rendering React email templates to HTML
 */

import * as React from 'react'

/**
 * Render email template to HTML string
 * Uses dynamic import to avoid bundling issues with react-dom/server
 */
export async function renderEmail(component: React.ReactElement): Promise<string> {
  const { renderToStaticMarkup } = await import('react-dom/server')
  return '<!DOCTYPE html>' + renderToStaticMarkup(component)
}
