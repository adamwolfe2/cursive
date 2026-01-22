'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

export default function NotificationsSettingsPage() {
  const queryClient = useQueryClient()
  const [successMessage, setSuccessMessage] = useState('')

  // Fetch current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/users/me')
      if (!response.ok) throw new Error('Failed to fetch user data')
      return response.json()
    },
  })

  const user = userData?.data

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: {
      email_notifications: boolean
      slack_notifications: boolean
      lead_delivery_email: boolean
      weekly_digest: boolean
    }) => {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preferences: data }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update notifications')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      setSuccessMessage('Notification preferences updated!')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
  })

  const handleToggle = (setting: string, value: boolean) => {
    const currentPrefs = user?.notification_preferences || {}
    updateNotificationsMutation.mutate({
      ...currentPrefs,
      [setting]: value,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  const prefs = user?.notification_preferences || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Notification Settings
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/settings"
            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Profile
          </Link>
          <Link
            href="/settings/notifications"
            className="border-blue-500 text-blue-600 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Notifications
          </Link>
          <Link
            href="/settings/security"
            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Security
          </Link>
          <Link
            href="/settings/billing"
            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Billing
          </Link>
        </nav>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="ml-3 text-sm font-medium text-green-800">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Email Notifications */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Email Notifications
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Lead Delivery Emails
              </p>
              <p className="text-sm text-gray-500">
                Receive an email when new leads are delivered to your inbox
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle('lead_delivery_email', !prefs.lead_delivery_email)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.lead_delivery_email ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs.lead_delivery_email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Weekly Digest
              </p>
              <p className="text-sm text-gray-500">
                Get a weekly summary of your lead generation activity
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle('weekly_digest', !prefs.weekly_digest)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.weekly_digest ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs.weekly_digest ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                All Email Notifications
              </p>
              <p className="text-sm text-gray-500">
                Master toggle for all email notifications
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  'email_notifications',
                  !prefs.email_notifications
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs.email_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Slack Notifications */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Slack Notifications
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Slack Notifications
              </p>
              <p className="text-sm text-gray-500">
                Send lead notifications to your Slack workspace
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  'slack_notifications',
                  !prefs.slack_notifications
                )
              }
              disabled={!user?.slack_webhook_url}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                prefs.slack_notifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs.slack_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {!user?.slack_webhook_url && (
            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                Connect Slack in the{' '}
                <Link
                  href="/integrations"
                  className="font-medium underline hover:text-yellow-900"
                >
                  Integrations
                </Link>{' '}
                page to enable Slack notifications.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Frequency */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Notification Preferences
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 shadow-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Notifications are sent to your registered email address
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
