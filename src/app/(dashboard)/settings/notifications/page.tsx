'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useToast } from '@/lib/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

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
        enabled ? 'bg-primary' : 'bg-muted'
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
    mutationFn: async (data: Record<string, boolean | string>) => {
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

  const handleToggle = (setting: string, value: boolean | string) => {
    const currentPrefs = user?.notification_preferences || {}
    updateNotificationsMutation.mutate({
      ...currentPrefs,
      [setting]: value,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const prefs = user?.notification_preferences || {}

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">New Lead Alerts</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Get notified immediately when new leads match your queries
                </p>
              </div>
              <ToggleSwitch
                enabled={prefs.new_leads ?? true}
                onChange={(value) => handleToggle('new_leads', value)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Daily Digest</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Receive a daily summary of lead generation activity
                </p>
              </div>
              <ToggleSwitch
                enabled={prefs.daily_digest ?? false}
                onChange={(value) => handleToggle('daily_digest', value)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Weekly Report</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Get a weekly performance report with insights and statistics
                </p>
              </div>
              <ToggleSwitch
                enabled={prefs.weekly_report ?? true}
                onChange={(value) => handleToggle('weekly_report', value)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Query Updates</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Notifications about query status changes and errors
                </p>
              </div>
              <ToggleSwitch
                enabled={prefs.query_updates ?? true}
                onChange={(value) => handleToggle('query_updates', value)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Credit Alerts</p>
                <p className="text-sm text-muted-foreground mt-0.5">
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
                <p className="text-sm font-medium text-foreground">
                  All Email Notifications
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Master toggle for all email notifications
                </p>
              </div>
              <ToggleSwitch
                enabled={prefs.email_notifications ?? true}
                onChange={(value) => handleToggle('email_notifications', value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Delivery Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Choose how you want to receive new leads from your active queries
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Email Delivery</p>
                  <Badge variant="muted">Free</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Receive leads directly in your inbox
                </p>
              </div>
              <ToggleSwitch
                enabled={prefs.lead_delivery_email ?? true}
                onChange={(value) => handleToggle('lead_delivery_email', value)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Slack Notifications</p>
                  <Badge variant="default">Pro</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Send leads to your Slack workspace
                  {!user?.slack_webhook_url && (
                    <Link
                      href="/settings/integrations"
                      className="text-primary hover:text-primary/80 ml-1"
                    >
                      (Connect Slack)
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
                  <p className="text-sm font-medium text-foreground">Webhook Delivery</p>
                  <Badge variant="default">Pro</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Send leads to your webhook endpoints
                  {!user?.zapier_webhook_url && !user?.custom_webhook_url && (
                    <Link
                      href="/settings/integrations"
                      className="text-primary hover:text-primary/80 ml-1"
                    >
                      (Set up webhooks)
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
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notification Email Address
              </label>
              <Input
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                All notifications are sent to your registered email address
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Preferred Time for Daily Digest
              </label>
              <select
                value={prefs.digest_time || '09:00'}
                onChange={(e) => handleToggle('digest_time', e.target.value)}
                className="flex h-10 w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="06:00">6:00 AM</option>
                <option value="07:00">7:00 AM</option>
                <option value="08:00">8:00 AM</option>
                <option value="09:00">9:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="18:00">6:00 PM</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Time zone: UTC (adjust for your local time zone)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pro Features Banner */}
      {user?.plan !== 'pro' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
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
                <h3 className="text-sm font-medium text-foreground">
                  Upgrade to Pro for Multi-Channel Delivery
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Get leads delivered to Slack, webhooks, and custom integrations. Perfect
                  for teams and advanced workflows.
                </p>
                <Link
                  href="/settings/billing"
                  className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 mt-3"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
