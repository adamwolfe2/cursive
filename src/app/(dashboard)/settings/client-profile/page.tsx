'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField } from '@/components/ui/form-field'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { useToast } from '@/lib/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

const settingsTabs = [
  { value: 'profile', label: 'Profile', href: '/settings' },
  { value: 'client-profile', label: 'Client Profile', href: '/settings/client-profile' },
  { value: 'notifications', label: 'Notifications', href: '/settings/notifications' },
  { value: 'security', label: 'Security', href: '/settings/security' },
  { value: 'billing', label: 'Billing', href: '/settings/billing' },
]

interface ValueProposition {
  id: string
  name: string
  description: string
  target_segments?: string[]
}

interface TrustSignal {
  id: string
  type: 'metric' | 'case_study' | 'testimonial' | 'logo'
  title?: string
  content: string
}

interface ClientProfile {
  id: string
  company_name: string
  company_website?: string
  company_industry?: string
  company_description?: string
  target_personas?: string[]
  value_propositions: ValueProposition[]
  trust_signals: TrustSignal[]
  brand_voice?: {
    tone?: string
    style_notes?: string
  }
  is_active: boolean
}

export default function ClientProfileSettingsPage() {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const toast = useToast()

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [companyIndustry, setCompanyIndustry] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [targetPersonas, setTargetPersonas] = useState<string[]>([])
  const [newPersona, setNewPersona] = useState('')
  const [valuePropositions, setValuePropositions] = useState<ValueProposition[]>([])
  const [trustSignals, setTrustSignals] = useState<TrustSignal[]>([])
  const [brandTone, setBrandTone] = useState('')
  const [brandStyleNotes, setBrandStyleNotes] = useState('')

  // New value prop form
  const [showAddValueProp, setShowAddValueProp] = useState(false)
  const [newVpName, setNewVpName] = useState('')
  const [newVpDescription, setNewVpDescription] = useState('')

  // New trust signal form
  const [showAddTrustSignal, setShowAddTrustSignal] = useState(false)
  const [newTsType, setNewTsType] = useState<TrustSignal['type']>('metric')
  const [newTsContent, setNewTsContent] = useState('')

  // Fetch existing profile
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['client-profile'],
    queryFn: async () => {
      const response = await fetch('/api/client-profiles')
      if (!response.ok) throw new Error('Failed to fetch client profile')
      return response.json()
    },
  })

  const profile: ClientProfile | null = profileData?.data?.[0] || null

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || '')
      setCompanyWebsite(profile.company_website || '')
      setCompanyIndustry(profile.company_industry || '')
      setCompanyDescription(profile.company_description || '')
      setTargetPersonas(profile.target_personas || [])
      setValuePropositions(profile.value_propositions || [])
      setTrustSignals(profile.trust_signals || [])
      setBrandTone(profile.brand_voice?.tone || '')
      setBrandStyleNotes(profile.brand_voice?.style_notes || '')
    }
  }, [profile])

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        company_name: companyName,
        company_website: companyWebsite || null,
        company_industry: companyIndustry || null,
        company_description: companyDescription || null,
        target_personas: targetPersonas,
        value_propositions: valuePropositions,
        trust_signals: trustSignals,
        brand_voice: {
          tone: brandTone || null,
          style_notes: brandStyleNotes || null,
        },
        is_active: true,
      }

      const method = profile ? 'PATCH' : 'POST'
      const url = profile ? `/api/client-profiles/${profile.id}` : '/api/client-profiles'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save profile')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile'] })
      toast.success('Client profile saved successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save profile')
    },
  })

  // Value proposition handlers
  const addValueProposition = () => {
    if (!newVpName.trim() || !newVpDescription.trim()) return

    setValuePropositions([
      ...valuePropositions,
      {
        id: `vp-${Date.now()}`,
        name: newVpName.trim(),
        description: newVpDescription.trim(),
        target_segments: [],
      },
    ])
    setNewVpName('')
    setNewVpDescription('')
    setShowAddValueProp(false)
  }

  const removeValueProposition = (id: string) => {
    setValuePropositions(valuePropositions.filter((vp) => vp.id !== id))
  }

  // Trust signal handlers
  const addTrustSignal = () => {
    if (!newTsContent.trim()) return

    setTrustSignals([
      ...trustSignals,
      {
        id: `ts-${Date.now()}`,
        type: newTsType,
        content: newTsContent.trim(),
      },
    ])
    setNewTsContent('')
    setNewTsType('metric')
    setShowAddTrustSignal(false)
  }

  const removeTrustSignal = (id: string) => {
    setTrustSignals(trustSignals.filter((ts) => ts.id !== id))
  }

  // Target persona handlers
  const addPersona = () => {
    if (!newPersona.trim()) return
    setTargetPersonas([...targetPersonas, newPersona.trim()])
    setNewPersona('')
  }

  const removePersona = (index: number) => {
    setTargetPersonas(targetPersonas.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-full max-w-md" />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings', href: '/settings' },
          { label: 'Client Profile' },
        ]}
      />

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-border">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {settingsTabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.value}
                href={tab.href}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-lg">
              <FormField label="Company Name" htmlFor="company_name" required>
                <Input
                  id="company_name"
                  placeholder="Acme Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </FormField>

              <FormField label="Website" htmlFor="company_website">
                <Input
                  id="company_website"
                  placeholder="https://acme.com"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
              </FormField>

              <FormField label="Industry" htmlFor="company_industry">
                <Input
                  id="company_industry"
                  placeholder="e.g., SaaS, FinTech, Healthcare"
                  value={companyIndustry}
                  onChange={(e) => setCompanyIndustry(e.target.value)}
                />
              </FormField>

              <FormField
                label="Company Description"
                htmlFor="company_description"
                description="Brief description of what your company does"
              >
                <Textarea
                  id="company_description"
                  placeholder="We help businesses..."
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  rows={3}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Target Personas */}
        <Card>
          <CardHeader>
            <CardTitle>Target Personas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Define the types of people you want to reach (e.g., "VP of Sales at SaaS companies")
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {targetPersonas.map((persona, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 py-1.5 px-3"
                >
                  {persona}
                  <button
                    type="button"
                    onClick={() => removePersona(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="Add a target persona..."
                value={newPersona}
                onChange={(e) => setNewPersona(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPersona())}
              />
              <Button type="button" variant="outline" onClick={addPersona}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Value Propositions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Value Propositions</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddValueProp(true)}
              >
                Add Value Prop
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Key benefits and value you offer to prospects. These will be used in email templates.
            </p>

            {showAddValueProp && (
              <div className="mb-4 p-4 rounded-lg border border-dashed border-border">
                <div className="space-y-3">
                  <FormField label="Name" htmlFor="vp-name">
                    <Input
                      id="vp-name"
                      placeholder="e.g., Cost Reduction"
                      value={newVpName}
                      onChange={(e) => setNewVpName(e.target.value)}
                    />
                  </FormField>
                  <FormField label="Description" htmlFor="vp-desc">
                    <Textarea
                      id="vp-desc"
                      placeholder="Describe how this benefits the prospect..."
                      value={newVpDescription}
                      onChange={(e) => setNewVpDescription(e.target.value)}
                      rows={2}
                    />
                  </FormField>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddValueProp(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={addValueProposition}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {valuePropositions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No value propositions yet. Add your first one to use in campaigns.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {valuePropositions.map((vp) => (
                  <div
                    key={vp.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{vp.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{vp.description}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeValueProposition(vp.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trust Signals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Trust Signals</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddTrustSignal(true)}
              >
                Add Trust Signal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Social proof, metrics, and credibility indicators to include in emails.
            </p>

            {showAddTrustSignal && (
              <div className="mb-4 p-4 rounded-lg border border-dashed border-border">
                <div className="space-y-3">
                  <FormField label="Type" htmlFor="ts-type">
                    <select
                      id="ts-type"
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={newTsType}
                      onChange={(e) => setNewTsType(e.target.value as TrustSignal['type'])}
                    >
                      <option value="metric">Metric</option>
                      <option value="case_study">Case Study</option>
                      <option value="testimonial">Testimonial</option>
                      <option value="logo">Logo/Client Name</option>
                    </select>
                  </FormField>
                  <FormField label="Content" htmlFor="ts-content">
                    <Textarea
                      id="ts-content"
                      placeholder="e.g., Helped 500+ companies reduce costs by 40%"
                      value={newTsContent}
                      onChange={(e) => setNewTsContent(e.target.value)}
                      rows={2}
                    />
                  </FormField>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddTrustSignal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={addTrustSignal}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {trustSignals.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No trust signals yet. Add metrics, case studies, or testimonials.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {trustSignals.map((ts) => (
                  <div
                    key={ts.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-muted"
                  >
                    <div>
                      <Badge variant="outline" className="text-xs mb-1">
                        {ts.type.replace('_', ' ')}
                      </Badge>
                      <p className="text-sm text-foreground">{ts.content}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTrustSignal(ts.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Voice */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Voice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-lg">
              <FormField
                label="Tone"
                htmlFor="brand_tone"
                description="How should your emails sound? (e.g., Professional, Casual, Friendly)"
              >
                <Input
                  id="brand_tone"
                  placeholder="e.g., Professional but approachable"
                  value={brandTone}
                  onChange={(e) => setBrandTone(e.target.value)}
                />
              </FormField>

              <FormField
                label="Style Notes"
                htmlFor="brand_style"
                description="Any specific writing guidelines or preferences"
              >
                <Textarea
                  id="brand_style"
                  placeholder="e.g., Avoid jargon, use short sentences, always personalize..."
                  value={brandStyleNotes}
                  onChange={(e) => setBrandStyleNotes(e.target.value)}
                  rows={3}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => saveProfileMutation.mutate()}
            disabled={!companyName.trim() || saveProfileMutation.isPending}
          >
            {saveProfileMutation.isPending ? 'Saving...' : 'Save Client Profile'}
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}
