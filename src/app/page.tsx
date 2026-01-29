import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to waitlist - admin users will bypass via middleware
  redirect('/waitlist')
}
