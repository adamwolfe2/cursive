'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Mail,
  Server,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { safeError } from '@/lib/utils/log-sanitizer'

interface SystemMetrics {
  apiResponseTime: {
    p50: number
    p95: number
    p99: number
  }
  dbQueryTime: {
    p50: number
    p95: number
    p99: number
  }
  errorRate: number
  uptime: number
}

interface PurchaseMetrics {
  purchasesPerHour: number
  successRate: number
  conflictRate: number
  avgValue: number
}

interface EmailMetrics {
  sentPerHour: number
  deliveryRate: number
  failedLast24h: number
}

interface WebhookMetrics {
  processedPerHour: number
  successRate: number
  retryRate: number
  avgProcessingTime: number
}

interface RecentError {
  id: string
  timestamp: string
  message: string
  count: number
  level: 'error' | 'warning' | 'critical'
}

interface Alert {
  id: string
  name: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  triggeredAt: string
  resolved: boolean
}

export default function MonitoringPage() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [purchaseMetrics, setPurchaseMetrics] = useState<PurchaseMetrics | null>(null)
  const [emailMetrics, setEmailMetrics] = useState<EmailMetrics | null>(null)
  const [webhookMetrics, setWebhookMetrics] = useState<WebhookMetrics | null>(null)
  const [recentErrors, setRecentErrors] = useState<RecentError[]>([])
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

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
        .maybeSingle() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
        window.location.href = '/dashboard'
        return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  async function fetchMetrics() {
    try {
      // Fetch all metrics in parallel
      const [system, purchase, email, webhook, errors, alerts] = await Promise.all([
        fetch('/api/admin/monitoring/system').then((r) => r.json()),
        fetch('/api/admin/monitoring/purchases').then((r) => r.json()),
        fetch('/api/admin/monitoring/emails').then((r) => r.json()),
        fetch('/api/admin/monitoring/webhooks').then((r) => r.json()),
        fetch('/api/admin/monitoring/errors').then((r) => r.json()),
        fetch('/api/admin/monitoring/alerts').then((r) => r.json()),
      ])

      setSystemMetrics(system.data)
      setPurchaseMetrics(purchase.data)
      setEmailMetrics(email.data)
      setWebhookMetrics(webhook.data)
      setRecentErrors(errors.data)
      setActiveAlerts(alerts.data)
      setLoading(false)
    } catch (error) {
      safeError('[AdminMonitoring]', 'Failed to fetch metrics:', error)
      setLoading(false)
    }
  }

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen"><p>Checking access...</p></div>
  }
  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <p className="text-muted-foreground">Real-time platform health and performance metrics</p>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Active Alerts ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-lg border bg-white p-3 dark:bg-gray-900"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityVariant(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {new Date(alert.triggeredAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="API P95 Latency"
              value={`${systemMetrics?.apiResponseTime.p95 || 0}ms`}
              icon={<Zap className="h-4 w-4" />}
              status={getLatencyStatus(systemMetrics?.apiResponseTime.p95 || 0)}
            />
            <MetricCard
              title="DB P95 Query Time"
              value={`${systemMetrics?.dbQueryTime.p95 || 0}ms`}
              icon={<Database className="h-4 w-4" />}
              status={getLatencyStatus(systemMetrics?.dbQueryTime.p95 || 0)}
            />
            <MetricCard
              title="Error Rate"
              value={`${((systemMetrics?.errorRate || 0) * 100).toFixed(2)}%`}
              icon={<AlertTriangle className="h-4 w-4" />}
              status={getErrorRateStatus(systemMetrics?.errorRate || 0)}
            />
            <MetricCard
              title="Uptime"
              value={`${((systemMetrics?.uptime || 0) * 100).toFixed(2)}%`}
              icon={<Server className="h-4 w-4" />}
              status="healthy"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Distribution</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">P50 (Median)</span>
                  <span className="font-mono text-sm">{systemMetrics?.apiResponseTime.p50 || 0}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">P95</span>
                  <span className="font-mono text-sm">{systemMetrics?.apiResponseTime.p95 || 0}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">P99</span>
                  <span className="font-mono text-sm">{systemMetrics?.apiResponseTime.p99 || 0}ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Metrics Tab */}
        <TabsContent value="purchases" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Purchases/Hour"
              value={String(purchaseMetrics?.purchasesPerHour || 0)}
              icon={<TrendingUp className="h-4 w-4" />}
              status="healthy"
            />
            <MetricCard
              title="Success Rate"
              value={`${((purchaseMetrics?.successRate || 0) * 100).toFixed(1)}%`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              status={getSuccessRateStatus(purchaseMetrics?.successRate || 0)}
            />
            <MetricCard
              title="Conflict Rate"
              value={`${((purchaseMetrics?.conflictRate || 0) * 100).toFixed(2)}%`}
              icon={<AlertTriangle className="h-4 w-4" />}
              status={getConflictRateStatus(purchaseMetrics?.conflictRate || 0)}
            />
            <MetricCard
              title="Avg Value"
              value={`$${(purchaseMetrics?.avgValue || 0).toFixed(2)}`}
              icon={<Activity className="h-4 w-4" />}
              status="healthy"
            />
          </div>
        </TabsContent>

        {/* Email Metrics Tab */}
        <TabsContent value="emails" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Sent/Hour"
              value={String(emailMetrics?.sentPerHour || 0)}
              icon={<Mail className="h-4 w-4" />}
              status="healthy"
            />
            <MetricCard
              title="Delivery Rate"
              value={`${((emailMetrics?.deliveryRate || 0) * 100).toFixed(1)}%`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              status={getDeliveryRateStatus(emailMetrics?.deliveryRate || 0)}
            />
            <MetricCard
              title="Failed (24h)"
              value={String(emailMetrics?.failedLast24h || 0)}
              icon={<AlertTriangle className="h-4 w-4" />}
              status={emailMetrics && emailMetrics.failedLast24h > 10 ? 'warning' : 'healthy'}
            />
          </div>
        </TabsContent>

        {/* Webhook Metrics Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Processed/Hour"
              value={String(webhookMetrics?.processedPerHour || 0)}
              icon={<Activity className="h-4 w-4" />}
              status="healthy"
            />
            <MetricCard
              title="Success Rate"
              value={`${((webhookMetrics?.successRate || 0) * 100).toFixed(1)}%`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              status={getSuccessRateStatus(webhookMetrics?.successRate || 0)}
            />
            <MetricCard
              title="Retry Rate"
              value={`${((webhookMetrics?.retryRate || 0) * 100).toFixed(1)}%`}
              icon={<AlertTriangle className="h-4 w-4" />}
              status={getRetryRateStatus(webhookMetrics?.retryRate || 0)}
            />
            <MetricCard
              title="Avg Time"
              value={`${webhookMetrics?.avgProcessingTime || 0}ms`}
              icon={<Clock className="h-4 w-4" />}
              status={getLatencyStatus(webhookMetrics?.avgProcessingTime || 0)}
            />
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors (Last 50)</CardTitle>
              <CardDescription>Most frequent errors in the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              {recentErrors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                  <p className="mt-2">No errors in the last 24 hours</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentErrors.map((error) => (
                    <div
                      key={error.id}
                      className="flex items-start justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getErrorLevelVariant(error.level)}>
                            {error.level}
                          </Badge>
                          <span className="text-sm font-mono">{error.message}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(error.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="outline">{error.count}x</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon,
  status,
}: {
  title: string
  value: string
  icon: React.ReactNode
  status: 'healthy' | 'warning' | 'error'
}) {
  const statusColors = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={statusColors[status]}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function getLatencyStatus(ms: number): 'healthy' | 'warning' | 'error' {
  if (ms < 1000) return 'healthy'
  if (ms < 3000) return 'warning'
  return 'error'
}

function getErrorRateStatus(rate: number): 'healthy' | 'warning' | 'error' {
  if (rate < 0.01) return 'healthy'
  if (rate < 0.05) return 'warning'
  return 'error'
}

function getSuccessRateStatus(rate: number): 'healthy' | 'warning' | 'error' {
  if (rate > 0.95) return 'healthy'
  if (rate > 0.9) return 'warning'
  return 'error'
}

function getDeliveryRateStatus(rate: number): 'healthy' | 'warning' | 'error' {
  if (rate > 0.9) return 'healthy'
  if (rate > 0.8) return 'warning'
  return 'error'
}

function getConflictRateStatus(rate: number): 'healthy' | 'warning' | 'error' {
  if (rate < 0.01) return 'healthy'
  if (rate < 0.05) return 'warning'
  return 'error'
}

function getRetryRateStatus(rate: number): 'healthy' | 'warning' | 'error' {
  if (rate < 0.1) return 'healthy'
  if (rate < 0.2) return 'warning'
  return 'error'
}

function getSeverityVariant(severity: string) {
  switch (severity) {
    case 'critical':
      return 'destructive'
    case 'error':
      return 'destructive'
    case 'warning':
      return 'secondary'
    default:
      return 'default'
  }
}

function getErrorLevelVariant(level: string) {
  switch (level) {
    case 'critical':
      return 'destructive'
    case 'error':
      return 'destructive'
    case 'warning':
      return 'secondary'
    default:
      return 'default'
  }
}
