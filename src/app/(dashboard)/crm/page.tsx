import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'CRM | Cursive' }

export default function CRMPage() {
  redirect('/crm/leads')
}
