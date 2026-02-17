'use client'

/**
 * Daily Leads View Component
 * Displays daily delivered leads with stats and upgrade prompts
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendingUp, Mail, Phone, Building, MapPin, Calendar, Crown, Zap } from 'lucide-react'

interface Lead {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  job_title: string | null
  delivered_at: string | null
  metadata: Record<string, any>
}

interface DailyLeadsViewProps {
  leads: Lead[]
  todayCount: number
  weekCount: number
  monthCount: number
  dailyLimit: number
  plan: string
  industrySegment?: string | null
  locationSegment?: string | null
}

export function DailyLeadsView({
  leads,
  todayCount,
  weekCount,
  monthCount,
  dailyLimit,
  plan,
  industrySegment,
  locationSegment,
}: DailyLeadsViewProps) {
  const [search, setSearch] = useState('')

  const filteredLeads = leads.filter(lead => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      lead.full_name?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.company_name?.toLowerCase().includes(searchLower)
    )
  })

  const isFree = plan === 'free'
  const progressPercent = (todayCount / dailyLimit) * 100

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Daily Leads</h1>
        <p className="text-muted-foreground mt-2">
          Fresh leads delivered every morning at 8am CT
          {industrySegment && locationSegment && (
            <span className="ml-2">
              • <Badge variant="outline" className="ml-1">{industrySegment}</Badge>
              <Badge variant="outline" className="ml-1">{locationSegment}</Badge>
            </span>
          )}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Leads</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayCount} of {dailyLimit} delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{Math.round((weekCount / 7) * 10) / 10} avg/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isFree ? `${dailyLimit * 30}/mo limit` : 'Unlimited'}
            </p>
          </CardContent>
        </Card>

        <Card className={isFree ? 'border-primary/50 bg-primary/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Plan</CardTitle>
            <Crown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{plan}</div>
            {isFree ? (
              <Button size="sm" className="mt-2 w-full" asChild>
                <a href="/pricing">
                  <Zap className="h-3 w-3 mr-1" />
                  Upgrade to Pro
                </a>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                {dailyLimit} leads/day
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Banner (Free tier only) */}
      {isFree && todayCount >= dailyLimit * 0.8 && (
        <Card className="border-primary bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-semibold mb-1">Running low on daily leads?</h3>
              <p className="text-sm text-muted-foreground">
                Upgrade to Lead Boost and get 100 leads per day instead of {dailyLimit}
              </p>
            </div>
            <Button asChild>
              <a href="/pricing">Upgrade Now</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Badge variant="secondary">{filteredLeads.length} leads</Badge>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Leads</CardTitle>
          <CardDescription>
            Delivered {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">
                {todayCount === 0 ? "Today's leads will arrive soon!" : 'No leads match your search'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {todayCount === 0
                  ? `Your daily batch of ${dailyLimit} leads is delivered every morning at 8am CT. Check back then!`
                  : 'Try adjusting your search terms'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.full_name || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {lead.company_name || '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.job_title || '—'}
                      </TableCell>
                      <TableCell>
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <Mail className="h-4 w-4" />
                            {lead.email}
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <Phone className="h-4 w-4" />
                            {lead.phone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.metadata?.city || lead.metadata?.state ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {[lead.metadata?.city, lead.metadata?.state]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Upsells */}
      {isFree && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">🎯 Pixel Tracking</CardTitle>
              <CardDescription>
                Track YOUR website visitors in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Identify companies visiting your site and get their contact info automatically.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/features/pixel">Learn More</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">📧 Email Campaigns</CardTitle>
              <CardDescription>
                Automated outreach sequences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Send personalized email campaigns to your leads with high deliverability.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/features/email">Learn More</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">🎨 Custom Audiences</CardTitle>
              <CardDescription>
                Target your exact ICP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Get leads matching your specific criteria beyond industry and location.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/features/audiences">Learn More</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
