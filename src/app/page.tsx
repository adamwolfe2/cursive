import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to dashboard - middleware handles auth check
  redirect('/dashboard')
}
