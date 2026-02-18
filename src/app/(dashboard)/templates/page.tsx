// Email Templates Browser Page

import type { Metadata } from 'next'
import { TemplateBrowser } from '@/components/templates/template-browser'
import { TemplatesWrapper } from '@/components/templates/templates-wrapper'

export const metadata: Metadata = { title: 'Email Templates | Cursive' }

export default async function TemplatesPage() {
  // Layout already verified auth
  return (
    <TemplatesWrapper>
      <TemplateBrowser />
    </TemplatesWrapper>
  )
}
