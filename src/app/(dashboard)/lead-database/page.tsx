import { redirect } from 'next/navigation'

/**
 * Lead Database — redirects to the marketplace where leads are browsed and purchased.
 */
export default function LeadDatabasePage() {
  redirect('/marketplace')
}
