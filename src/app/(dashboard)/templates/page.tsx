// Email Templates Browser Page

import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { TemplateBrowser } from '@/components/templates/template-browser'

export default async function TemplatesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <TemplateBrowser />
}
