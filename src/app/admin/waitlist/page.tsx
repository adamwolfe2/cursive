'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WaitlistRepository, type WaitlistSignup } from '@/lib/repositories/waitlist.repository'
import { useToast } from '@/lib/hooks/use-toast'
import { Download, Mail, Calendar, Building, Linkedin, MapPin } from 'lucide-react'

export default function AdminWaitlistPage() {
  const [signups, setSignups] = useState<WaitlistSignup[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    converted: 0,
    industries: {} as Record<string, number>
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const toast = useToast()
  const supabase = createClient()

  // Admin role check - prevent non-admins from accessing
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        window.location.href = '/login'
        return
      }
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
        window.location.href = '/dashboard'
        return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    fetchSignups()
  }, [])

  const fetchSignups = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/waitlist')
      if (!response.ok) throw new Error('Failed to fetch waitlist')

      const data = await response.json()
      setSignups(data.signups)

      // Calculate stats
      const total = data.signups.length
      const converted = data.signups.filter((s: WaitlistSignup) => s.converted_to_user).length
      const industries: Record<string, number> = {}

      data.signups.forEach((s: WaitlistSignup) => {
        if (s.industry) {
          industries[s.industry] = (industries[s.industry] || 0) + 1
        }
      })

      setStats({ total, converted, industries })
    } catch (error) {
      toast.error('Failed to load waitlist signups')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Email', 'First Name', 'Last Name', 'Industry', 'LinkedIn', 'Source', 'Converted', 'Created At']
    const rows = signups.map(s => [
      s.email,
      s.first_name,
      s.last_name,
      s.industry || '',
      s.linkedin_url || '',
      s.source,
      s.converted_to_user ? 'Yes' : 'No',
      new Date(s.created_at).toLocaleDateString()
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`
    a.click()

    toast.success('Waitlist exported to CSV')
  }

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen"><p>Checking access...</p></div>
  }
  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-200 border-t-zinc-900" />
          <p className="text-sm text-zinc-500">Loading waitlist...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Waitlist Signups</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage and export waitlist signups
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={signups.length === 0}
          className="flex items-center gap-2 h-9 px-4 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Total Signups</p>
              <p className="text-3xl font-semibold text-zinc-900 mt-1">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Converted to Users</p>
              <p className="text-3xl font-semibold text-zinc-900 mt-1">{stats.converted}</p>
              <p className="text-xs text-zinc-400 mt-1">
                {stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : 0}% conversion rate
              </p>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div>
            <p className="text-sm text-zinc-500 mb-2">Top Industries</p>
            {Object.entries(stats.industries)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([industry, count]) => (
                <div key={industry} className="flex items-center justify-between text-sm mb-1">
                  <span className="text-zinc-700">{industry}</span>
                  <span className="text-zinc-500">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Signups Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase">Industry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase">Signed Up</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {signups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Mail className="h-12 w-12 text-zinc-300" />
                      <p className="text-sm text-zinc-500">No waitlist signups yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                signups.map((signup) => (
                  <tr key={signup.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-zinc-900">
                        {signup.first_name} {signup.last_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-zinc-400" />
                        <a
                          href={`mailto:${signup.email}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {signup.email}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {signup.industry && <Building className="h-3 w-3 text-zinc-400" />}
                        <span className="text-sm text-zinc-600">{signup.industry || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-zinc-600 bg-zinc-100 rounded">
                        {signup.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {signup.converted_to_user ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded">
                          Converted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-zinc-600 bg-zinc-50 rounded">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-zinc-400" />
                        <span className="text-sm text-zinc-600">
                          {new Date(signup.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {signup.linkedin_url && (
                        <a
                          href={signup.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                          title="View LinkedIn"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
