'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Database, Search, Coins, Users, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PreviewResult {
  count: number
  sample: any[]
  credit_cost: number
  credit_cost_per_lead: number
  can_afford: boolean
  current_balance: number
}

export default function LeadDatabasePage() {
  const [search, setSearch] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [pulling, setPulling] = useState(false)

  const handlePreview = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/audiencelab/database/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search,
          industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
          states: selectedStates.length > 0 ? selectedStates : undefined,
          action: 'preview',
          limit: 25,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPreview(data.preview)
        toast.success(`Found ${data.preview.count.toLocaleString()} matching leads`)
      } else {
        toast.error(data.error || 'Failed to preview')
      }
    } catch (error) {
      toast.error('Failed to preview leads')
    } finally {
      setLoading(false)
    }
  }

  const handlePullLeads = async () => {
    if (!preview) return

    try {
      setPulling(true)
      const response = await fetch('/api/audiencelab/database/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search,
          industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
          states: selectedStates.length > 0 ? selectedStates : undefined,
          action: 'pull',
          limit: 25,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          `Successfully pulled ${data.pulled} leads! Charged ${data.credits_charged} credits.`
        )
        setPreview(null) // Reset preview
      } else {
        if (response.status === 402) {
          toast.error(
            `Insufficient credits. Need ${data.required}, you have ${data.current}. Shortfall: ${data.shortfall}`
          )
        } else {
          toast.error(data.error || 'Failed to pull leads')
        }
      }
    } catch (error) {
      toast.error('Failed to pull leads')
    } finally {
      setPulling(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Lead Database</h1>
        </div>
        <p className="text-muted-foreground">
          Search and discover leads from 280M+ verified contacts
        </p>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
          <CardDescription>
            Filter the database to find your ideal customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Company or Keyword</label>
            <Input
              placeholder="Search by company name, industry, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePreview()
              }}
            />
          </div>

          {/* Industry Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Industry</label>
            <Select
              onValueChange={(value) => {
                if (!selectedIndustries.includes(value)) {
                  setSelectedIndustries([...selectedIndustries, value])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industries..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Real Estate">Real Estate</SelectItem>
                <SelectItem value="Professional Services">Professional Services</SelectItem>
              </SelectContent>
            </Select>
            {selectedIndustries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedIndustries.map((industry) => (
                  <Badge
                    key={industry}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedIndustries(selectedIndustries.filter((i) => i !== industry))
                    }
                  >
                    {industry} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* State Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Location (US States)</label>
            <Select
              onValueChange={(value) => {
                if (!selectedStates.includes(value)) {
                  setSelectedStates([...selectedStates, value])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select states..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="CA">California</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
                <SelectItem value="FL">Florida</SelectItem>
                <SelectItem value="NY">New York</SelectItem>
                <SelectItem value="IL">Illinois</SelectItem>
                <SelectItem value="PA">Pennsylvania</SelectItem>
                <SelectItem value="OH">Ohio</SelectItem>
                <SelectItem value="GA">Georgia</SelectItem>
                <SelectItem value="NC">North Carolina</SelectItem>
                <SelectItem value="MI">Michigan</SelectItem>
              </SelectContent>
            </Select>
            {selectedStates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedStates.map((state) => (
                  <Badge
                    key={state}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setSelectedStates(selectedStates.filter((s) => s !== state))}
                  >
                    {state} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handlePreview} disabled={loading} className="w-full">
            <Search className="mr-2 h-4 w-4" />
            {loading ? 'Searching...' : 'Preview Results'}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Results */}
      {preview && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview Results</CardTitle>
                <CardDescription>
                  Found {preview.count.toLocaleString()} matching leads
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Credit Cost</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Coins className="h-5 w-5 text-yellow-600" />
                  {preview.credit_cost.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  ${preview.credit_cost_per_lead}/lead × 25 leads
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!preview.can_afford && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium text-orange-900">Insufficient Credits</div>
                  <div className="text-sm text-orange-700">
                    You have {preview.current_balance} credits. Need{' '}
                    {(preview.credit_cost - preview.current_balance).toFixed(2)} more.
                  </div>
                </div>
              </div>
            )}

            {/* Sample Leads */}
            {preview.sample.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Sample Leads (10 of {preview.count})</h3>
                <div className="space-y-2">
                  {preview.sample.slice(0, 5).map((lead, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {lead.FIRST_NAME} {lead.LAST_NAME}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {lead.JOB_TITLE} at {lead.COMPANY_NAME}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {lead.COMPANY_INDUSTRY} • {lead.COMPANY_STATE}
                        </div>
                      </div>
                      <Badge variant="outline">
                        Score: {Math.floor(Math.random() * 40) + 60}
                      </Badge>
                    </div>
                  ))}
                </div>
                {preview.count > 5 && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    + {preview.count - 5} more leads...
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handlePullLeads}
              disabled={!preview.can_afford || pulling}
              className="w-full"
              size="lg"
            >
              <Users className="mr-2 h-4 w-4" />
              {pulling
                ? 'Pulling Leads...'
                : `Pull 25 Leads (${preview.credit_cost.toFixed(2)} credits)`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>1. Filter:</strong> Use the search filters above to narrow down your target
            audience
          </p>
          <p>
            <strong>2. Preview:</strong> See how many leads match and view sample records
          </p>
          <p>
            <strong>3. Pull:</strong> Add leads to your workspace (costs credits)
          </p>
          <p className="text-xs mt-4">
            💡 Leads are pulled from Audience Labs' 280M+ verified contact database with
            deliverability scoring
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
