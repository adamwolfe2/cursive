'use client'

/**
 * Analytics Dashboard
 * Comprehensive workspace analytics and metrics
 */

import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Target,
  Activity,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function AnalyticsPage() {
  // Fetch workspace stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'workspace-stats'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/workspace-stats')
      if (!response.ok) throw new Error('Failed to fetch workspace stats')
      return response.json()
    },
    refetchInterval: 60000, // Refetch every minute
  })

  // Fetch credit usage
  const { data: creditData, isLoading: creditLoading } = useQuery({
    queryKey: ['analytics', 'credit-usage'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/credit-usage?days=30')
      if (!response.ok) throw new Error('Failed to fetch credit usage')
      return response.json()
    },
  })

  // Fetch lead quality
  const { data: qualityData, isLoading: qualityLoading } = useQuery({
    queryKey: ['analytics', 'lead-quality'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/lead-quality')
      if (!response.ok) throw new Error('Failed to fetch lead quality')
      return response.json()
    },
  })

  // Fetch segment performance
  const { data: segmentData, isLoading: segmentLoading } = useQuery({
    queryKey: ['analytics', 'segments'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/segments')
      if (!response.ok) throw new Error('Failed to fetch segments')
      return response.json()
    },
  })

  // Fetch pixel performance
  const { data: pixelData, isLoading: pixelLoading } = useQuery({
    queryKey: ['analytics', 'pixels'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/pixels')
      if (!response.ok) throw new Error('Failed to fetch pixels')
      return response.json()
    },
  })

  const stats = statsData?.stats
  const creditUsage = creditData?.usage
  const leadQuality = qualityData?.report
  const segmentPerf = segmentData?.performance || []
  const pixelPerf = pixelData?.performance || []

  const isLoading = statsLoading || creditLoading || qualityLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Prepare chart data
  const dailyUsageData = creditUsage?.daily_usage || []
  const scoreDistributionData = leadQuality?.score_distribution
    ? [
        { name: '90-100', value: leadQuality.score_distribution['90-100'] || 0 },
        { name: '80-89', value: leadQuality.score_distribution['80-89'] || 0 },
        { name: '70-79', value: leadQuality.score_distribution['70-79'] || 0 },
        { name: '60-69', value: leadQuality.score_distribution['60-69'] || 0 },
        { name: '0-59', value: leadQuality.score_distribution['0-59'] || 0 },
      ]
    : []

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280']

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive metrics and insights for your workspace
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="quality">Lead Quality</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="pixels">Pixels</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.total_leads?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.leads_this_week || 0} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Lead Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.avg_lead_score?.toFixed(1) || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.high_quality_leads || 0} high quality (80+)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Credits Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.credits_balance?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {creditUsage?.credits_spent_30d || 0} spent (30d)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.active_campaigns || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.active_pixels || 0} active pixels
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lead Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
              <CardDescription>Where your leads are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.leads_by_source?.pixel || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Pixel</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.leads_by_source?.database || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Database</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.leads_by_source?.marketplace || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Marketplace</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats?.leads_by_source?.upload || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Upload</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credit Usage (30 Days)</CardTitle>
              <CardDescription>Daily credit spending trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="credits"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Credits Used"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Used</p>
                  <p className="text-2xl font-bold">{creditUsage?.total_used || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Daily</p>
                  <p className="text-2xl font-bold">{creditUsage?.avg_daily || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Database Pulls</p>
                  <p className="text-2xl font-bold">
                    {creditUsage?.by_action?.database_pull || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Segment Runs</p>
                  <p className="text-2xl font-bold">
                    {creditUsage?.by_action?.segment_run || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Quality Tab */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Lead quality breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scoreDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {scoreDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Completeness */}
            <Card>
              <CardHeader>
                <CardTitle>Data Completeness</CardTitle>
                <CardDescription>Field completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leadQuality?.completeness && (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Email</span>
                          <span className="font-medium">
                            {leadQuality.completeness.has_email}/{leadQuality.total_leads}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600"
                            style={{
                              width: `${(leadQuality.completeness.has_email / leadQuality.total_leads) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Phone</span>
                          <span className="font-medium">
                            {leadQuality.completeness.has_phone}/{leadQuality.total_leads}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600"
                            style={{
                              width: `${(leadQuality.completeness.has_phone / leadQuality.total_leads) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Company</span>
                          <span className="font-medium">
                            {leadQuality.completeness.has_company}/{leadQuality.total_leads}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600"
                            style={{
                              width: `${(leadQuality.completeness.has_company / leadQuality.total_leads) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Fully Complete</span>
                          <span className="font-medium">
                            {leadQuality.completeness.fully_complete}/{leadQuality.total_leads}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600"
                            style={{
                              width: `${(leadQuality.completeness.fully_complete / leadQuality.total_leads) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Segment Performance</CardTitle>
              <CardDescription>Metrics for your saved segments</CardDescription>
            </CardHeader>
            <CardContent>
              {segmentLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </div>
              ) : segmentPerf.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No active segments yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Segment</th>
                        <th className="text-right py-3 px-4 font-medium">Total Runs</th>
                        <th className="text-right py-3 px-4 font-medium">Last Count</th>
                        <th className="text-right py-3 px-4 font-medium">Avg Count</th>
                        <th className="text-right py-3 px-4 font-medium">Total Pulled</th>
                        <th className="text-left py-3 px-4 font-medium">Last Run</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segmentPerf.map((segment: any) => (
                        <tr key={segment.segment_id} className="border-b">
                          <td className="py-3 px-4 font-medium">{segment.segment_name}</td>
                          <td className="py-3 px-4 text-right">{segment.total_runs}</td>
                          <td className="py-3 px-4 text-right">
                            {segment.last_count?.toLocaleString() || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {segment.avg_count?.toFixed(0) || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {segment.total_leads_pulled?.toLocaleString() || 0}
                          </td>
                          <td className="py-3 px-4">
                            {segment.last_run_at
                              ? new Date(segment.last_run_at).toLocaleDateString()
                              : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pixels Tab */}
        <TabsContent value="pixels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pixel Performance</CardTitle>
              <CardDescription>Tracking analytics and identity resolution</CardDescription>
            </CardHeader>
            <CardContent>
              {pixelLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </div>
              ) : pixelPerf.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No active pixels yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Website</th>
                        <th className="text-right py-3 px-4 font-medium">Total Events</th>
                        <th className="text-right py-3 px-4 font-medium">Events (7d)</th>
                        <th className="text-right py-3 px-4 font-medium">Unique Visitors</th>
                        <th className="text-right py-3 px-4 font-medium">ID Resolution</th>
                        <th className="text-right py-3 px-4 font-medium">Avg Pages/Visit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pixelPerf.map((pixel: any) => (
                        <tr key={pixel.pixel_id} className="border-b">
                          <td className="py-3 px-4 font-medium">{pixel.website_name}</td>
                          <td className="py-3 px-4 text-right">
                            {pixel.total_events?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {pixel.events_7d?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {pixel.unique_visitors?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant={pixel.identity_resolution_rate > 50 ? 'default' : 'secondary'}>
                              {pixel.identity_resolution_rate?.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {pixel.avg_pages_per_visitor?.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
