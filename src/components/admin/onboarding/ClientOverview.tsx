'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PACKAGES } from '@/types/onboarding'
import { updateAdminNotes, updateDomainsApprovalUrl } from '@/app/admin/onboarding/actions'
import type { OnboardingClient } from '@/types/onboarding'
import {
  User,
  Mail,
  Phone,
  Building2,
  CreditCard,
  DollarSign,
  Target,
  MessageSquare,
  Save,
  RefreshCw,
  AlertTriangle,
  Copy,
  Check,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react'

interface ClientOverviewProps {
  client: OnboardingClient
}

export default function ClientOverview({ client }: ClientOverviewProps) {
  const [adminNotes, setAdminNotes] = useState(client.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [domainsUrl, setDomainsUrl] = useState(client.domains_approval_url ?? '')
  const [savingUrl, setSavingUrl] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [urlSaved, setUrlSaved] = useState(false)

  async function handleSaveNotes() {
    setSaving(true)
    try {
      await updateAdminNotes(client.id, adminNotes)
    } catch {
      // error is non-fatal for UI
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDomainsUrl() {
    setSavingUrl(true)
    setUrlError(null)
    setUrlSaved(false)
    try {
      await updateDomainsApprovalUrl(client.id, domainsUrl)
      setUrlSaved(true)
      setTimeout(() => setUrlSaved(false), 2000)
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : 'Failed to save link')
    } finally {
      setSavingUrl(false)
    }
  }

  const brief = client.enriched_icp_brief

  return (
    <div className="space-y-6">
      {/* Top row: Contact + Packages + Financial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Contact Info */}
        <Card padding="default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Contact Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 mt-3">
            <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Primary Contact" value={client.primary_contact_name} />
            <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={client.primary_contact_email} copyable />
            <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={client.primary_contact_phone} copyable />
            {client.billing_contact_name && (
              <InfoRow icon={<CreditCard className="h-3.5 w-3.5" />} label="Billing Contact" value={`${client.billing_contact_name} (${client.billing_contact_email ?? ''})`} />
            )}
            {client.team_members && (
              <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Team" value={client.team_members} />
            )}
            <InfoRow icon={<MessageSquare className="h-3.5 w-3.5" />} label="Communication" value={client.communication_channel} />
            {client.slack_url && (
              <InfoRow icon={<MessageSquare className="h-3.5 w-3.5" />} label="Slack" value={client.slack_url} />
            )}
          </CardContent>
        </Card>

        {/* Packages */}
        <Card padding="default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" /> Packages
            </CardTitle>
          </CardHeader>
          <CardContent className="mt-3">
            <div className="flex flex-wrap gap-2">
              {client.packages_selected.map((pkg) => (
                <Badge key={pkg} variant="default" size="lg">
                  {PACKAGES[pkg]?.label ?? pkg}
                </Badge>
              ))}
            </div>
            {client.referral_source && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Referral Source</p>
                <p className="text-sm font-medium">{client.referral_source}{client.referral_detail ? ` - ${client.referral_detail}` : ''}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial */}
        <Card padding="default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" /> Financial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 mt-3">
            {client.setup_fee !== null && (
              <InfoRow icon={<DollarSign className="h-3.5 w-3.5" />} label="Setup Fee" value={`$${client.setup_fee.toLocaleString()}`} />
            )}
            {client.recurring_fee !== null && (
              <InfoRow icon={<DollarSign className="h-3.5 w-3.5" />} label="Recurring Fee" value={`$${client.recurring_fee.toLocaleString()}${client.billing_cadence ? ` / ${client.billing_cadence}` : ''}`} />
            )}
            {client.outbound_tier && (
              <InfoRow icon={<Target className="h-3.5 w-3.5" />} label="Outbound Tier" value={client.outbound_tier} />
            )}
            {client.custom_tier_details && (
              <InfoRow icon={<Target className="h-3.5 w-3.5" />} label="Custom Tier" value={client.custom_tier_details} />
            )}
            {client.payment_method && (
              <InfoRow icon={<CreditCard className="h-3.5 w-3.5" />} label="Payment Method" value={client.payment_method} />
            )}
            {client.invoice_email && (
              <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Invoice Email" value={client.invoice_email} copyable />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Domains & Sender Approval Link */}
      <Card padding="default">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LinkIcon className="h-4 w-4" /> Domains & Sender Approval Link
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Paste a Google Sheet or shared doc listing the sending domains and sender names for this client.
            It will appear on their portal (Step 3) as a &ldquo;View Domains &amp; Sender Names&rdquo; button.
          </p>
          <div className="flex items-stretch gap-2">
            <input
              type="url"
              value={domainsUrl}
              onChange={(e) => setDomainsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveDomainsUrl}
              loading={savingUrl}
              leftIcon={urlSaved ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Save className="h-3.5 w-3.5" />}
            >
              {urlSaved ? 'Saved' : 'Save Link'}
            </Button>
            {domainsUrl && /^https?:\/\//i.test(domainsUrl) && (
              <a
                href={domainsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                title="Open link in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open
              </a>
            )}
          </div>
          {urlError && <p className="text-xs text-destructive">{urlError}</p>}
        </CardContent>
      </Card>

      {/* Admin Notes */}
      <Card padding="default">
        <CardHeader>
          <CardTitle className="text-base">Admin Notes</CardTitle>
        </CardHeader>
        <CardContent className="mt-3">
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Internal notes about this client..."
            rows={3}
            resize="vertical"
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveNotes}
              loading={saving}
              leftIcon={<Save className="h-3.5 w-3.5" />}
            >
              Save Notes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ICP Brief Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Enriched ICP Brief</h3>

        {client.enrichment_status === 'pending' || client.enrichment_status === 'processing' ? (
          <div className="space-y-4 animate-pulse">
            {/* Company Summary skeleton — 3 lines */}
            <Card padding="default">
              <CardHeader>
                <div className="h-5 w-40 rounded bg-blue-50" />
              </CardHeader>
              <CardContent className="space-y-3 mt-3">
                <div className="flex items-center gap-2 mb-4">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-muted-foreground">
                    {client.enrichment_status === 'pending' ? 'Enrichment pending...' : 'Enrichment in progress...'}
                  </span>
                </div>
                <div className="h-3.5 w-full rounded bg-blue-50" />
                <div className="h-3.5 w-5/6 rounded bg-blue-50" />
                <div className="h-3.5 w-3/4 rounded bg-blue-50" />
              </CardContent>
            </Card>

            {/* Buyer Personas skeleton — 2 cards side-by-side */}
            <div>
              <div className="h-4 w-32 rounded bg-blue-50 mb-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map((i) => (
                  <Card key={i} padding="sm">
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-5 w-16 rounded-full bg-blue-50" />
                        <div className="h-5 w-20 rounded-full bg-blue-50" />
                      </div>
                      <div className="h-4 w-3/4 rounded bg-blue-50 mb-2" />
                      <div className="space-y-1.5">
                        <div className="h-2.5 w-full rounded bg-blue-50" />
                        <div className="h-2.5 w-5/6 rounded bg-blue-50" />
                        <div className="h-2.5 w-2/3 rounded bg-blue-50" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Messaging Angles skeleton — 3 cards in grid */}
            <div>
              <div className="h-4 w-36 rounded bg-blue-50 mb-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <Card key={i} padding="sm">
                    <CardContent className="space-y-2">
                      <div className="h-4 w-3/4 rounded bg-blue-50" />
                      <div className="h-2.5 w-full rounded bg-blue-50 mt-2" />
                      <div className="h-2.5 w-5/6 rounded bg-blue-50" />
                      <div className="h-2.5 w-2/3 rounded bg-blue-50" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : client.enrichment_status === 'failed' ? (
          <Card padding="default" className="border-destructive/50">
            <CardContent className="flex items-center gap-3 py-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Enrichment Failed</p>
                <p className="text-xs text-muted-foreground">The ICP enrichment step encountered an error. Use the Automation tab to retry.</p>
              </div>
            </CardContent>
          </Card>
        ) : brief ? (
          <div className="space-y-6">
            {/* Service Offering, drives the copy engine. Optional for older briefs. */}
            {brief.service_offering ? (
              <Card padding="default">
                <CardHeader>
                  <CardTitle className="text-base">Service Offering (drives copy)</CardTitle>
                </CardHeader>
                <CardContent className="mt-2">
                  <p className="text-sm font-medium leading-relaxed">{brief.service_offering}</p>
                </CardContent>
              </Card>
            ) : null}

            {/* Company Summary */}
            <Card padding="default">
              <CardHeader>
                <CardTitle className="text-base">Company Summary</CardTitle>
              </CardHeader>
              <CardContent className="mt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">{brief.company_summary}</p>
              </CardContent>
            </Card>

            {/* Ideal Buyer Profile */}
            <Card padding="default">
              <CardHeader>
                <CardTitle className="text-base">Ideal Buyer Profile</CardTitle>
              </CardHeader>
              <CardContent className="mt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">{brief.ideal_buyer_profile}</p>
              </CardContent>
            </Card>

            {/* Primary Verticals */}
            <Card padding="default">
              <CardHeader>
                <CardTitle className="text-base">Primary Verticals</CardTitle>
              </CardHeader>
              <CardContent className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {brief.primary_verticals.map((v) => (
                    <Badge key={v} variant="info" size="lg">{v}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Buyer Personas */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Buyer Personas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {brief.buyer_personas.map((persona, idx) => (
                  <Card key={idx} padding="sm">
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default" size="sm">{persona.seniority}</Badge>
                        <Badge variant="muted" size="sm">{persona.department}</Badge>
                      </div>
                      <h5 className="text-sm font-semibold mb-2">{persona.title}</h5>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Pain Points</p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {persona.pain_points.map((p, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-destructive mt-0.5">-</span> {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Buying Triggers</p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {persona.buying_triggers.map((t, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-success mt-0.5">-</span> {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Company Filters */}
            <Card padding="default">
              <CardHeader>
                <CardTitle className="text-base">Company Filters</CardTitle>
              </CardHeader>
              <CardContent className="mt-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FilterCell label="Size Range" value={brief.company_filters.size_range} />
                  <FilterCell label="Revenue Range" value={brief.company_filters.revenue_range} />
                  <FilterCell label="Geography" value={brief.company_filters.geography.join(', ')} />
                  <FilterCell label="Tech Signals" value={brief.company_filters.tech_signals.join(', ')} />
                  <FilterCell label="Exclusions" value={brief.company_filters.exclusions.join(', ')} />
                </div>
              </CardContent>
            </Card>

            {/* Competitive Landscape */}
            {brief.competitive_landscape.length > 0 && (
              <Card padding="default">
                <CardHeader>
                  <CardTitle className="text-base">Competitive Landscape</CardTitle>
                </CardHeader>
                <CardContent className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    {brief.competitive_landscape.map((c) => (
                      <Badge key={c} variant="warning" size="default">{c}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messaging Angles */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Messaging Angles</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brief.messaging_angles.map((angle, idx) => (
                  <Card key={idx} padding="sm">
                    <CardContent className="space-y-2">
                      <h5 className="text-sm font-semibold text-foreground">{angle.angle_name}</h5>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Hook</p>
                        <p className="text-xs text-foreground">{angle.hook}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Value Prop</p>
                        <p className="text-xs text-foreground">{angle.value_prop}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Proof Point</p>
                        <p className="text-xs text-foreground">{angle.proof_point}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Audience Labs Strategy */}
            <Card padding="default" className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Audience Labs Search Strategy</CardTitle>
              </CardHeader>
              <CardContent className="mt-2 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Recommended Taxonomy Paths</p>
                  <ul className="text-xs text-foreground space-y-0.5">
                    {brief.audience_labs_search_strategy.recommended_taxonomy_paths.map((p, i) => (
                      <li key={i}>- {p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Keyword Combinations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brief.audience_labs_search_strategy.keyword_combinations.map((k, i) => (
                      <Badge key={i} variant="muted" size="sm">{k}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Filters to Apply</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brief.audience_labs_search_strategy.filters_to_apply.map((f, i) => (
                      <Badge key={i} variant="outline" size="sm">{f}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Est. Audience Size</p>
                    <p className="text-sm font-semibold text-foreground">{brief.audience_labs_search_strategy.estimated_audience_size}</p>
                  </div>
                </div>
                {brief.audience_labs_search_strategy.notes_for_builder && (
                  <div className="pt-2 border-t border-border/40">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Notes for Builder</p>
                    <p className="text-xs text-foreground">{brief.audience_labs_search_strategy.notes_for_builder}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card padding="default">
            <CardContent className="py-2">
              <p className="text-sm text-muted-foreground">No enriched ICP brief available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  copyable,
}: {
  icon: React.ReactNode
  label: string
  value: string
  copyable?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API may be unavailable in insecure contexts; silently no-op
    }
  }

  return (
    <div className="group flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-foreground break-words">{value}</p>
          {copyable && value && (
            <button
              type="button"
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              aria-label={`Copy ${label.toLowerCase()}`}
              title={copied ? 'Copied' : `Copy ${label.toLowerCase()}`}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">{label}</p>
      <p className="text-sm text-foreground">{value || '-'}</p>
    </div>
  )
}
