// Email Templates Browser Page

import { TemplateBrowser } from '@/components/templates/template-browser'
import { TemplatesWrapper } from '@/components/templates/templates-wrapper'

export default async function TemplatesPage() {
  // Layout already verified auth
  return (
    <TemplatesWrapper>
      <TemplateBrowser />
    </TemplatesWrapper>
  )
}
