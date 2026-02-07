'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react'

interface Subscription {
  id: string
  status: string
  workspace_id: string
  onboarding_completed: boolean
  onboarding_data: any
  workspaces: { name: string } | null
  service_tiers: { name: string; slug: string } | null
  users: Array<{ email: string; full_name: string | null }>
}

interface DeliveryCreateFormProps {
  subscriptions: Subscription[]
}

const DELIVERY_TYPES = [
  { value: 'lead_list', label: 'Lead List' },
  { value: 'campaign_setup', label: 'Campaign Report' },
  { value: 'monthly_report', label: 'Monthly Report' },
  { value: 'optimization_session', label: 'Optimization Report' },
]

export function DeliveryCreateForm({ subscriptions }: DeliveryCreateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [selectedSubscription, setSelectedSubscription] = useState('')
  const [deliveryType, setDeliveryType] = useState('lead_list')
  const [periodStart, setPeriodStart] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [periodEnd, setPeriodEnd] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [file, setFile] = useState<File | null>(null)
  const [sendEmail, setSendEmail] = useState(true)

  const selectedSub = subscriptions.find(s => s.id === selectedSubscription)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSubscription) {
      setError('Please select a subscription')
      return
    }

    if (!file) {
      setError('Please select a file to upload')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('subscription_id', selectedSubscription)
      formData.append('delivery_type', deliveryType)
      formData.append('period_start', periodStart)
      formData.append('period_end', periodEnd)
      formData.append('send_email', sendEmail.toString())

      const response = await fetch('/api/admin/deliveries/create', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create delivery')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/services/deliveries')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-900 mb-2">
          Delivery Created Successfully!
        </h2>
        <p className="text-green-700">
          {sendEmail && 'Notification email has been sent to the customer.'}
        </p>
        <p className="text-sm text-green-600 mt-4">
          Redirecting to deliveries list...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-6">
        {/* Subscription Selection */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-2">
            Select Subscription
          </label>
          <select
            value={selectedSubscription}
            onChange={e => setSelectedSubscription(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">Choose a subscription...</option>
            {subscriptions.map(sub => {
              const workspace = sub.workspaces
              const tier = sub.service_tiers
              const user = Array.isArray(sub.users) ? sub.users[0] : sub.users

              return (
                <option key={sub.id} value={sub.id}>
                  {workspace?.name || 'Unknown'} - {tier?.name || 'Unknown Tier'} ({user?.email})
                  {!sub.onboarding_completed && ' - ⚠️ Onboarding Incomplete'}
                </option>
              )
            })}
          </select>

          {selectedSub && !selectedSub.onboarding_completed && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Warning: Onboarding not completed</p>
                <p>Customer hasn't provided targeting criteria yet. Consider reaching out to complete onboarding first.</p>
              </div>
            </div>
          )}

          {selectedSub && selectedSub.onboarding_completed && selectedSub.onboarding_data && (
            <div className="mt-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium text-primary mb-2">Customer ICP:</p>
              <div className="text-sm text-primary space-y-1">
                {selectedSub.onboarding_data.industries && (
                  <p><strong>Industries:</strong> {selectedSub.onboarding_data.industries.join(', ')}</p>
                )}
                {selectedSub.onboarding_data.company_size && (
                  <p><strong>Company Size:</strong> {selectedSub.onboarding_data.company_size}</p>
                )}
                {selectedSub.onboarding_data.target_titles && (
                  <p><strong>Titles:</strong> {selectedSub.onboarding_data.target_titles}</p>
                )}
                {selectedSub.onboarding_data.geographic_focus && (
                  <p><strong>Geo:</strong> {selectedSub.onboarding_data.geographic_focus.join(', ')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delivery Type */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-2">
            Delivery Type
          </label>
          <select
            value={deliveryType}
            onChange={e => setDeliveryType(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {DELIVERY_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Period Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Period Start
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={e => setPeriodStart(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Period End
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={e => setPeriodEnd(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-2">
            Upload File (CSV)
          </label>
          <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              required
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {file ? (
                <>
                  <FileText className="h-12 w-12 text-green-600" />
                  <p className="text-sm font-medium text-zinc-900">{file.name}</p>
                  <p className="text-xs text-zinc-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-xs text-primary mt-2">Click to change file</p>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-900">
                    Click to upload CSV file
                  </p>
                  <p className="text-xs text-zinc-500">
                    Lead list or report in CSV format
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Send Email Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="send-email"
            checked={sendEmail}
            onChange={e => setSendEmail(e.target.checked)}
            className="w-4 h-4 text-primary border-zinc-300 rounded focus:ring-primary"
          />
          <label htmlFor="send-email" className="text-sm text-zinc-700">
            Send delivery notification email to customer
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedSubscription || !file}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Delivery...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Create Delivery
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
