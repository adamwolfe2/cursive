'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useToast } from '@/lib/hooks/use-toast'

function SettingsNav({ currentPath }: { currentPath: string }) {
  const tabs = [
    { name: 'Profile', href: '/settings' },
    { name: 'Billing', href: '/settings/billing' },
    { name: 'Security', href: '/settings/security' },
    { name: 'Notifications', href: '/settings/notifications' },
  ]

  return (
    <div className="border-b border-zinc-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.href
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
              }`}
            >
              {tab.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ enabled, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-emerald-600' : 'bg-zinc-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function NotificationsSettingsPage() {
  const queryClient = useQueryClient()
  const toast = useToast()

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
    mutationFn: async (data: Record<string, boolean>) => {
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
      toast.success('Notification preferences updated!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update notifications')
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
        <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse" />
        <div className="h-96 bg-zinc-200 rounded animate-pulse" />
      </div>
    )
  }

  const prefs = user?.notification_preferences || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Notification Settings</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Manage how and when you receive notifications about leads and account activity
        </p>
      </div>

      {/* Navigation Tabs */}
      <SettingsNav currentPath="/settings/notifications" />

      {/* Email Notifications */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Email Notifications</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900">New Lead Alerts</p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Get notified immediately when new leads match your queries
              </p>
            </div>
            <ToggleSwitch
              enabled={prefs.new_leads ?? true}
              onChange={(value) => handleToggle('new_leads', value)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900">Daily Digest</p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Receive a daily summary of lead generation activity
              </p>
            </div>
            <ToggleSwitch
              enabled={prefs.daily_digest ?? false}
              onChange={(value) => handleToggle('daily_digest', value)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900">Weekly Report</p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Get a weekly performance report with insights and statistics
              </p>
            </div>
            <ToggleSwitch
              enabled={prefs.weekly_report ?? true}
              onChange={(value) => handleToggle('weekly_report', value)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900">Query Updates</p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Notifications about query status changes and errors
              </p>
            </div>
            <ToggleSwitch
              enabled={prefs.query_updates ?? true}
              onChange={(value) => handleToggle('query_updates', value)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900">Credit Alerts</p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Get notified when you&apos;re running low on daily credits
              </p>
            </div>
            <ToggleSwitch
              enabled={prefs.credit_alerts ?? true}
              onChange={(value) => handleToggle('credit_alerts', value)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900">
                All Email Notifications
              </p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Master toggle for all email notifications
              </p>
            </div>
            <ToggleSwitch
              enabled={prefs.email_notifications ?? true}
              onChange={(value) => handleToggle('email_notifications', value)}
            />
          </div>
        </div>
      </div>

      {/* Delivery Channels */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">
          Lead Delivery Channels
        </h2>
        <p className="text-sm text-zinc-600 mb-4">
          Choose how you want to receive new leads from your active queries
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-900">Email Delivery</p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-800">
                  Free
                </span>
              </div>
              <p className="text-sm text-zinc-500 mt-0.5">
                Receive leads directly in your inbox
              </p>
            </div>
            <ToggleSwitch
              enabled={prefs.lead_delivery_email ?? true}
              onChange={(value) => handleToggle('lead_delivery_email', value)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-900">Slack Notifications</p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
                  Pro
                </span>
              </div>
              <p className="text-sm text-zinc-500 mt-0.5">
                Send leads to your Slack workspace
                {!user?.slack_webhook_url && (
                  <Link
                    href="/integrations"
                    className="text-emerald-600 hover:text-emerald-700 ml-1"
                  >
                    (Connect Slack →)
                  </Link>
                )}
              </p>
            </div>
            <ToggleSwitch
              enabled={prefs.slack_notifications ?? false}
              onChange={(value) => handleToggle('slack_notifications', value)}
              disabled={!user?.slack_webhook_url}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-900">Webhook Delivery</p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
                  Pro
                </span>
              </div>
              <p className="text-sm text-zinc-500 mt-0.5">
                Send leads to your webhook endpoints
                {!user?.zapier_webhook_url && !user?.custom_webhook_url && (
                  <Link
                    href="/integrations"
                    className="text-emerald-600 hover:text-emerald-700 ml-1"
                  >
                    (Set up webhooks →)
                  </Link>
                )}
              </p>
            </div>
            <ToggleSwitch
              enabled={prefs.webhook_delivery ?? false}
              onChange={(value) => handleToggle('webhook_delivery', value)}
              disabled={!user?.zapier_webhook_url && !user?.custom_webhook_url}
            />
          </div>
        </div>
      </div>

      {/* Notification Email Address */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Notification Preferences
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Notification Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="block w-full rounded-lg border-zinc-300 bg-zinc-50 text-zinc-500 shadow-sm cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-zinc-500">
              All notifications are sent to your registered email address
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Preferred Time for Daily Digest
            </label>
            <select
              value={prefs.digest_time || '09:00'}
              onChange={(e) => handleToggle('digest_time', e.target.value as any)}
              className="block w-full max-w-xs rounded-lg border-zinc-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            >
              <option value="06:00">6:00 AM</option>
              <option value="07:00">7:00 AM</option>
              <option value="08:00">8:00 AM</option>
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="18:00">6:00 PM</option>
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              Time zone: UTC (adjust for your local time zone)
            </p>
          </div>
        </div>
      </div>

      {/* Pro Features Banner */}
      {user?.plan !== 'pro' && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-emerald-900">
                Upgrade to Pro for Multi-Channel Delivery
              </h3>
              <p className="text-sm text-emerald-800 mt-1">
                Get leads delivered to Slack, webhooks, and custom integrations. Perfect
                for teams and advanced workflows.
              </p>
              <Link
                href="/settings/billing"
                className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 mt-3"
              >
                Upgrade to Pro →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
