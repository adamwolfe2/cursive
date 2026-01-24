'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface PartnerStats {
  total_leads: number
  this_month_leads: number
  total_earnings: number
  this_month_earnings: number
}

interface UploadHistory {
  id: string
  file_name: string
  total_leads: number
  successful: number
  failed: number
  created_at: string
}

export default function PartnerPortalPage() {
  const [apiKey, setApiKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [partnerName, setPartnerName] = useState('')
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Authenticate with API key
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/partner/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsAuthenticated(true)
        setPartnerName(data.partner_name)
        setStats(data.stats)
        localStorage.setItem('partner_api_key', apiKey)
        fetchUploadHistory()
      } else {
        setError(data.error || 'Invalid API key')
      }
    } catch (err) {
      setError('Authentication failed')
    }
  }

  // Check for stored API key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('partner_api_key')
    if (storedKey) {
      setApiKey(storedKey)
      // Auto-authenticate
      fetch('/api/partner/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: storedKey }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIsAuthenticated(true)
            setPartnerName(data.partner_name)
            setStats(data.stats)
            fetchUploadHistory()
          }
        })
        .catch(() => {})
    }
  }, [])

  const fetchUploadHistory = async () => {
    // For now, return empty - would fetch from API
    setUploadHistory([])
  }

  // Handle file upload
  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/partner/upload', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
        body: formData,
      })

      const result = await response.json()
      setUploadResult(result)

      if (result.success) {
        // Refresh stats
        const authRes = await fetch('/api/partner/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: apiKey }),
        })
        const authData = await authRes.json()
        if (authData.success) {
          setStats(authData.stats)
        }
      }
    } catch (err) {
      setUploadResult({ success: false, errors: ['Upload failed'] })
    }

    setUploading(false)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setApiKey('')
    setStats(null)
    localStorage.removeItem('partner_api_key')
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-medium text-zinc-900">Cursive Partner Portal</h1>
            <p className="text-[13px] text-zinc-600 mt-2">Enter your API key to access the portal</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white border border-zinc-200 rounded-lg p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-[13px] font-medium text-zinc-700 mb-2">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="pk_..."
                className="w-full h-10 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-violet-500"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 text-[13px] font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700"
            >
              Sign In
            </button>

            <p className="mt-4 text-[12px] text-zinc-500 text-center">
              Don&apos;t have an API key?{' '}
              <a href="mailto:adam@meetcursive.com" className="text-violet-600 hover:underline">
                Contact us
              </a>
            </p>
          </form>
        </div>
      </div>
    )
  }

  // Partner dashboard
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-medium text-zinc-900">Cursive Partner Portal</div>
              <div className="text-[12px] text-zinc-500">{partnerName}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/partner/payouts" className="text-[13px] text-violet-600 hover:text-violet-700">
              Payouts
            </Link>
            <button
              onClick={handleLogout}
              className="text-[13px] text-zinc-600 hover:text-zinc-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="text-[12px] text-zinc-600">Total Leads</div>
            <div className="text-2xl font-medium text-zinc-900 mt-1">{stats?.total_leads || 0}</div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="text-[12px] text-zinc-600">This Month</div>
            <div className="text-2xl font-medium text-violet-600 mt-1">{stats?.this_month_leads || 0}</div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="text-[12px] text-zinc-600">Total Earnings</div>
            <div className="text-2xl font-medium text-emerald-600 mt-1">${stats?.total_earnings?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="text-[12px] text-zinc-600">This Month</div>
            <div className="text-2xl font-medium text-emerald-600 mt-1">${stats?.this_month_earnings?.toFixed(2) || '0.00'}</div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-8">
          <h2 className="text-[15px] font-medium text-zinc-900 mb-4">Upload Leads</h2>

          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-6">
            <h3 className="text-[13px] font-medium text-violet-900 mb-2">CSV Format</h3>
            <p className="text-[12px] text-violet-700">
              Required: first_name, last_name, email, phone, city, state, industry, intent_signal
            </p>
          </div>

          <div
            className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center hover:border-violet-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              className="hidden"
            />

            {uploading ? (
              <p className="text-[13px] text-zinc-600">Uploading...</p>
            ) : (
              <>
                <p className="text-[13px] font-medium text-zinc-900">Click to upload CSV</p>
                <p className="text-[12px] text-zinc-500 mt-1">or drag and drop</p>
              </>
            )}
          </div>

          {uploadResult && (
            <div className={`mt-4 p-4 rounded-lg ${uploadResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className={`text-[13px] font-medium ${uploadResult.success ? 'text-emerald-900' : 'text-red-900'}`}>
                {uploadResult.success ? 'Upload Complete' : 'Upload Failed'}
              </h3>
              {uploadResult.successful !== undefined && (
                <p className="text-[12px] mt-1 text-zinc-600">
                  {uploadResult.successful} of {uploadResult.total} leads uploaded successfully
                </p>
              )}
              {uploadResult.errors?.length > 0 && (
                <ul className="text-[12px] mt-2 text-red-700">
                  {uploadResult.errors.slice(0, 5).map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* API Documentation */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <h2 className="text-[15px] font-medium text-zinc-900 mb-4">API Upload</h2>
          <p className="text-[13px] text-zinc-600 mb-4">
            You can also upload leads programmatically using our API.
          </p>

          <div className="bg-zinc-900 text-zinc-100 rounded-lg p-4 text-[12px] font-mono overflow-x-auto">
            <pre>{`curl -X POST "https://meetcursive.com/api/partner/upload" \\
  -H "X-API-Key: ${apiKey.slice(0, 12)}..." \\
  -F "file=@leads.csv"`}</pre>
          </div>
        </div>
      </main>
    </div>
  )
}
