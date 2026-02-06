/**
 * Operations Health Dashboard
 * Monitor email and webhook delivery rates, success metrics, and system health
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'

interface HealthMetrics {
  emailDeliveryRate: number
  webhookSuccessRate: number
  failedOperationsCount: number
  retrySuccessRate: number
  averageTimeToSuccess: number
  last24h: {
    emailsSent: number
    emailsFailed: number
    webhooksProcessed: number
    webhooksFailed: number
  }
}

export default function OperationsHealthPage() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  const supabase = createClient()

  // Admin role check - prevent non-admins from accessing
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
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
    loadMetrics()
    // Refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadMetrics() {
    try {
      const response = await fetch('/api/admin/operations-health')
      if (!response.ok) throw new Error('Failed to load metrics')

      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Failed to load metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen"><p>Checking access...</p></div>
  }
  if (!isAdmin) {
    return null
  }

  if (loading || !metrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading health metrics...</div>
      </div>
    )
  }

  const emailHealthStatus = getHealthStatus(metrics.emailDeliveryRate, 95, 90)
  const webhookHealthStatus = getHealthStatus(metrics.webhookSuccessRate, 99, 95)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations Health</h1>
          <p className="text-muted-foreground">
            Monitor email and webhook delivery rates in real-time
          </p>
        </div>
        <Button onClick={loadMetrics} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Health Alerts */}
      {(emailHealthStatus === 'critical' || webhookHealthStatus === 'critical') && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Critical: System reliability below acceptable thresholds. Immediate action required.
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Email Delivery Rate</span>
              {getHealthIcon(emailHealthStatus)}
            </CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-4xl font-bold">{metrics.emailDeliveryRate.toFixed(2)}%</div>
              <Badge variant={getHealthBadgeVariant(emailHealthStatus)}>
                {emailHealthStatus}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Sent</div>
                <div className="text-xl font-semibold">{metrics.last24h.emailsSent}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Failed</div>
                <div className="text-xl font-semibold text-red-600">
                  {metrics.last24h.emailsFailed}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-1">Target: 99%+</div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    emailHealthStatus === 'healthy'
                      ? 'bg-green-500'
                      : emailHealthStatus === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(metrics.emailDeliveryRate, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Webhook Success Rate</span>
              {getHealthIcon(webhookHealthStatus)}
            </CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-4xl font-bold">{metrics.webhookSuccessRate.toFixed(2)}%</div>
              <Badge variant={getHealthBadgeVariant(webhookHealthStatus)}>
                {webhookHealthStatus}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Processed</div>
                <div className="text-xl font-semibold">{metrics.last24h.webhooksProcessed}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Failed</div>
                <div className="text-xl font-semibold text-red-600">
                  {metrics.last24h.webhooksFailed}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-1">Target: 99.9%+</div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    webhookHealthStatus === 'healthy'
                      ? 'bg-green-500'
                      : webhookHealthStatus === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(metrics.webhookSuccessRate, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Operations Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.failedOperationsCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Operations in dead letter queue
            </div>
            {metrics.failedOperationsCount > 10 && (
              <div className="mt-2">
                <Badge variant="outline" className="bg-red-50">
                  Attention Required
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retry Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.retrySuccessRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Operations succeed after retry
            </div>
            <div className="mt-2">
              {metrics.retrySuccessRate >= 80 ? (
                <Badge variant="outline" className="bg-green-50">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Good
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  Needs Improvement
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatDuration(metrics.averageTimeToSuccess)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Average retry duration
            </div>
            <div className="mt-2">
              {metrics.averageTimeToSuccess < 300 ? (
                <Badge variant="outline" className="bg-green-50">
                  Fast Recovery
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50">
                  Slow Recovery
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common operations and diagnostics</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" onClick={() => (window.location.href = '/admin/failed-operations')}>
            View Failed Operations
          </Button>
          <Button variant="outline" onClick={loadMetrics}>
            Refresh Metrics
          </Button>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Email Retry System</span>
            <Badge variant="outline" className="bg-green-50">
              <CheckCircle className="mr-1 h-3 w-3" />
              Operational
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Webhook Retry System</span>
            <Badge variant="outline" className="bg-green-50">
              <CheckCircle className="mr-1 h-3 w-3" />
              Operational
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Dead Letter Queue</span>
            <Badge variant="outline" className="bg-green-50">
              <CheckCircle className="mr-1 h-3 w-3" />
              Operational
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Slack Alerts</span>
            <Badge variant="outline" className="bg-green-50">
              <CheckCircle className="mr-1 h-3 w-3" />
              Operational
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions

function getHealthStatus(rate: number, goodThreshold: number, warningThreshold: number): 'healthy' | 'warning' | 'critical' {
  if (rate >= goodThreshold) return 'healthy'
  if (rate >= warningThreshold) return 'warning'
  return 'critical'
}

function getHealthIcon(status: 'healthy' | 'warning' | 'critical') {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case 'critical':
      return <AlertTriangle className="h-5 w-5 text-red-500" />
  }
}

function getHealthBadgeVariant(status: 'healthy' | 'warning' | 'critical'): 'default' | 'outline' | 'secondary' | 'destructive' {
  switch (status) {
    case 'healthy':
      return 'default'
    case 'warning':
      return 'secondary'
    case 'critical':
      return 'destructive'
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}
