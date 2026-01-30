// CRM Contacts Page - Twenty CRM Inspired
// Professional three-column layout with view switching

import { QueryProvider } from '@/components/providers/query-provider'
import { ContactsPageClient } from './components/ContactsPageClient'

export const metadata = {
  title: 'Contacts - CRM',
  description: 'Manage your contacts and people',
}

export default async function CRMContactsPage() {
  return (
    <QueryProvider>
      <ContactsPageClient />
    </QueryProvider>
  )
}
