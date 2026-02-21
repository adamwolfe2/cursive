'use client'

import { type ReactNode, useRef, useCallback } from 'react'
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
  saving?: boolean
}

function ToggleSwitch({ enabled, onChange, disabled, saving }: ToggleSwitchProps) {
  const isDisabled = disabled || saving
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => !isDisabled && onChange(!enabled)}
      disabled={isDisabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        enabled ? 'bg-primary' : 'bg-muted'
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

interface NotificationRowProps {
  title: string
  description: ReactNode
  settingKey: string
  defaultValue: boolean
  prefs: Record<string, boolean | string>
  isSaving: boolean
  masterDisabled?: boolean
  onToggle: (key: string, value: boolean) => void
}

function NotificationRow({
  title,
  description,
  settingKey,
  defaultValue,
  prefs,
  isSaving,
  masterDisabled,
  onToggle,
}: NotificationRowProps) {
  const enabled = (prefs[settingKey] as boolean) ?? defaultValue
  const isDisabled = masterDisabled || isSaving

  return (
    <div className={`flex items-center justify-between py-3 border-b border-border last:border-0 ${isDisabled && masterDisabled ? 'opacity-60' : ''}`}>
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <div className="text-sm text-muted-foreground mt-0.5">{description}</div>
      </div>
      <ToggleSwitch
        enabled={enabled}
        onChange={(value) => onToggle(settingKey, value)}
        disabled={isDisabled}
        saving={isSaving}
      />
    </div>
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
      toast.success('Notification preferences saved.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update notifications')
    },
  })

  const { mutate: mutateNotifications, isPending: isSaving } = updateNotificationsMutation

  // Debounce pref changes so rapid toggles batch into a single API call
  const pendingPrefsRef = useRef<Record<string, boolean | string> | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleToggle = useCallback((setting: string, value: boolean | string) => {
    const currentPrefs = user?.notification_preferences || {}
    // Merge this change into pending changes
    pendingPrefsRef.current = {
      ...currentPrefs,
      ...(pendingPrefsRef.current || {}),
      [setting]: value,
    }
    // Clear any existing timer and set a new one
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      if (pendingPrefsRef.current) {
        mutateNotifications(pendingPrefsRef.current)
        pendingPrefsRef.current = null
      }
    }, 600)
  }, [user?.notification_preferences, mutateNotifications])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const prefs: Record<string, boolean | string> = user?.notification_preferences || {}
  const emailMasterEnabled = (prefs.email_notifications as boolean) ?? true
  const dailyDigestEnabled = (prefs.daily_digest as boolean) ?? false

  return (
    <div className="space-y-6">
      {/* Master Email Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Email Notifications</CardTitle>
            {isSaving && (
              <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {/* Master toggle — always at top */}
            <div className="flex items-center justify-between py-3 border-b border-border mb-2">
              <div className="flex-1 pr-4">
                <p className="text-sm font-semibold text-foreground">All Email Notifications</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {emailMasterEnabled
                    ? 'You are receiving email notifications'
                    : 'All email notifications are paused'}
                </p>
              </div>
              <ToggleSwitch
                enabled={emailMasterEnabled}
                onChange={(value) => handleToggle('email_notifications', value)}
                saving={isSaving}
              />
            </div>

            {/* Sub-toggles — disabled when master is off */}
            <NotificationRow
              title="New Lead Alerts"
              description="Get notified immediately when new leads match your queries"
              settingKey="new_leads"
              defaultValue={true}
              prefs={prefs}
              isSaving={isSaving}
              masterDisabled={!emailMasterEnabled}
              onToggle={handleToggle}
            />

            <NotificationRow
              title="Daily Digest"
              description="Receive a daily summary of lead generation activity"
              settingKey="daily_digest"
              defaultValue={false}
              prefs={prefs}
              isSaving={isSaving}
              masterDisabled={!emailMasterEnabled}
              onToggle={handleToggle}
            />

            <NotificationRow
              title="Weekly Report"
              description="Get a weekly performance report with insights and statistics"
              settingKey="weekly_report"
              defaultValue={true}
              prefs={prefs}
              isSaving={isSaving}
              masterDisabled={!emailMasterEnabled}
              onToggle={handleToggle}
            />

            <NotificationRow
              title="Credit Alerts"
              description="Get notified when you're running low on daily credits"
              settingKey="credit_alerts"
              defaultValue={true}
              prefs={prefs}
              isSaving={isSaving}
              masterDisabled={!emailMasterEnabled}
              onToggle={handleToggle}
            />
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

          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Email Delivery</p>
                  <Badge variant="muted">Free</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Receive leads directly in your inbox
                </p>
              </div>
              <ToggleSwitch
                enabled={(prefs.lead_delivery_email as boolean) ?? true}
                onChange={(value) => handleToggle('lead_delivery_email', value)}
                saving={isSaving}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex-1 pr-4">
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
                enabled={(prefs.slack_notifications as boolean) ?? false}
                onChange={(value) => handleToggle('slack_notifications', value)}
                disabled={!user?.slack_webhook_url}
                saving={isSaving}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex-1 pr-4">
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
                enabled={(prefs.webhook_delivery as boolean) ?? false}
                onChange={(value) => handleToggle('webhook_delivery', value)}
                disabled={!user?.zapier_webhook_url && !user?.custom_webhook_url}
                saving={isSaving}
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
          <div className="space-y-6 max-w-md">
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
              <label
                htmlFor="digest-time"
                className={`block text-sm font-medium mb-2 ${
                  !dailyDigestEnabled || !emailMasterEnabled
                    ? 'text-muted-foreground'
                    : 'text-foreground'
                }`}
              >
                Preferred Time for Daily Digest
                {!dailyDigestEnabled && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (enable Daily Digest above)
                  </span>
                )}
              </label>
              <select
                id="digest-time"
                value={(prefs.digest_time as string) || '09:00'}
                onChange={(e) => handleToggle('digest_time', e.target.value)}
                disabled={!dailyDigestEnabled || !emailMasterEnabled || isSaving}
                className="flex h-10 w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted"
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
                Time zone: CT (Central Time)
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
