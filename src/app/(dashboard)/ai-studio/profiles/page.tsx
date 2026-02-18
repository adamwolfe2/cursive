/**
 * AI Studio - Customer Profiles Page
 * Display AI-generated buyer personas (ICPs)
 */

'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GradientCard, GradientBadge } from '@/components/ui/gradient-card'
import { PageContainer, PageHeader, PageSection } from '@/components/layout/page-container'
import { PageLoading } from '@/components/ui/loading-states'
import { EmptyState } from '@/components/ui/empty-states'
import { ArrowLeft, ArrowRight, User, MapPin, DollarSign, GraduationCap, Target, TrendingUp, Radio, Users } from 'lucide-react'

interface CustomerProfile {
  id: string
  name: string
  title: string
  description: string
  demographics: {
    age_range: string
    income_range: string
    location: string
    education: string
  }
  pain_points: string[]
  goals: string[]
  preferred_channels: string[]
}

function ProfilesPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace')

  const [profiles, setProfiles] = useState<CustomerProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<CustomerProfile | null>(null)

  useEffect(() => {
    if (!workspaceId) {
      router.push('/ai-studio')
      return
    }
    fetchProfiles()
  }, [workspaceId])

  async function fetchProfiles() {
    try {
      const response = await fetch(`/api/ai-studio/profiles?workspace=${workspaceId}`)
      const data = await response.json()
      setProfiles(data.profiles || [])
      if (data.profiles?.length > 0) {
        setSelectedProfile(data.profiles[0])
      }
    } catch (error) {
      console.error('Failed to load profiles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading customer profiles..." />
  }

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6">
        <Button
          onClick={() => router.push(`/ai-studio/knowledge?workspace=${workspaceId}`)}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Knowledge Base
        </Button>
      </div>

      {/* Header */}
      <GradientCard variant="primary" className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Customer Profiles</h1>
              <p className="text-sm text-muted-foreground">AI-generated ideal customer personas</p>
            </div>
          </div>

          <Button
            onClick={() => router.push(`/ai-studio/offers?workspace=${workspaceId}`)}
            size="lg"
          >
            Next: Offers
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </GradientCard>

      {profiles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customer profiles yet"
          description="Profiles are generated automatically during brand extraction. Try extracting a new brand to see customer personas."
        />
      ) : (
        <>
          {/* Profile Selector */}
          <PageSection
            title="Select a Profile"
            description={`${profiles.length} customer persona${profiles.length !== 1 ? 's' : ''} identified`}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <GradientCard
                  key={profile.id}
                  variant={selectedProfile?.id === profile.id ? 'primary' : 'subtle'}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedProfile?.id === profile.id ? 'shadow-md' : 'hover:shadow-md'
                  }`}
                  noPadding
                >
                  <div onClick={() => setSelectedProfile(profile)} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full p-3 ${
                        selectedProfile?.id === profile.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        <User className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate ${
                          selectedProfile?.id === profile.id ? 'text-foreground' : 'text-foreground'
                        }`}>
                          {profile.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{profile.title}</p>
                      </div>
                    </div>
                  </div>
                </GradientCard>
              ))}
            </div>
          </PageSection>

          {/* Selected Profile Details */}
          {selectedProfile && (
            <>
              {/* Profile Header */}
              <PageSection
                title={selectedProfile.name}
                description={selectedProfile.title}
              >
                <GradientCard variant="accent">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary p-6 flex-shrink-0">
                      <User className="h-12 w-12 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground leading-relaxed">{selectedProfile.description}</p>
                    </div>
                  </div>
                </GradientCard>
              </PageSection>

              {/* Demographics */}
              <PageSection
                title="Demographics"
                description="Key demographic information"
              >
                <GradientCard variant="subtle">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Age Range
                        </p>
                        <p className="text-sm text-foreground font-medium">
                          {selectedProfile.demographics.age_range}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Income Range
                        </p>
                        <p className="text-sm text-foreground font-medium">
                          {selectedProfile.demographics.income_range}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Location
                        </p>
                        <p className="text-sm text-foreground font-medium">
                          {selectedProfile.demographics.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Education
                        </p>
                        <p className="text-sm text-foreground font-medium">
                          {selectedProfile.demographics.education}
                        </p>
                      </div>
                    </div>
                  </div>
                </GradientCard>
              </PageSection>

              {/* Three Column Layout */}
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Pain Points */}
                <PageSection
                  title="Pain Points"
                  description="Challenges they face"
                >
                  <GradientCard variant="subtle">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-destructive/10">
                        <Target className="h-5 w-5 text-destructive" />
                      </div>
                      <h3 className="font-semibold text-foreground">Frustrations</h3>
                    </div>
                    <ul className="space-y-3">
                      {selectedProfile.pain_points.map((pain, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-destructive mt-1 text-sm">•</span>
                          <p className="text-sm text-foreground flex-1">{pain}</p>
                        </li>
                      ))}
                    </ul>
                  </GradientCard>
                </PageSection>

                {/* Goals */}
                <PageSection
                  title="Goals"
                  description="What they want to achieve"
                >
                  <GradientCard variant="subtle">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-foreground">Objectives</h3>
                    </div>
                    <ul className="space-y-3">
                      {selectedProfile.goals.map((goal, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1 text-sm">•</span>
                          <p className="text-sm text-foreground flex-1">{goal}</p>
                        </li>
                      ))}
                    </ul>
                  </GradientCard>
                </PageSection>

                {/* Preferred Channels */}
                <PageSection
                  title="Channels"
                  description="Where to reach them"
                >
                  <GradientCard variant="subtle">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Radio className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Communication</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.preferred_channels.map((channel, index) => (
                        <GradientBadge key={index}>
                          {channel}
                        </GradientBadge>
                      ))}
                    </div>
                  </GradientCard>
                </PageSection>
              </div>
            </>
          )}
        </>
      )}
    </PageContainer>
  )
}

export default function ProfilesPage() {
  return (
    <Suspense fallback={<div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>}>
      <ProfilesPageInner />
    </Suspense>
  )
}
