'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSettingsSchema, type ProfileSettingsFormData } from '@/lib/validation/schemas'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField, FormActions } from '@/components/ui/form-field'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

const settingsTabs = [
  { value: 'profile', label: 'Profile', href: '/settings' },
  { value: 'notifications', label: 'Notifications', href: '/settings/notifications' },
  { value: 'security', label: 'Security', href: '/settings/security' },
  { value: 'billing', label: 'Billing', href: '/settings/billing' },
]

export default function ProfileSettingsPage() {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

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

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileSettingsFormData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
    },
  })

  // Workspace form
  const {
    register: registerWorkspace,
    handleSubmit: handleSubmitWorkspace,
    formState: { errors: workspaceErrors },
  } = useForm<WorkspaceSettingsFormData>({
    resolver: zodResolver(workspaceSettingsSchema),
  })

  // Reset profile form when user data loads
  useState(() => {
    if (user) {
      resetProfile({
        full_name: user.full_name || '',
        email: user.email || '',
      })
    }
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileSettingsFormData) => {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: data.full_name }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      toast.success('Profile updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile')
    },
  })

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete account')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('Account deleted successfully. Redirecting...')
      setTimeout(() => {
        router.push('/signup')
      }, 2000)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account')
    },
  })

  const onSubmitProfile = (data: ProfileSettingsFormData) => {
    updateProfileMutation.mutate(data)
  }

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
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
          { label: 'Settings' },
        ]}
      />

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-border">
        <nav className="-mb-px flex space-x-8">
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

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" className="mb-6">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 max-w-md">
                <FormField
                  label="Full Name"
                  htmlFor="full_name"
                  required
                  error={errors.full_name?.message}
                >
                  <Input
                    id="full_name"
                    placeholder="Enter your full name"
                    disabled={updateProfileMutation.isPending}
                    {...register('full_name')}
                  />
                </FormField>

                <FormField
                  label="Email Address"
                  htmlFor="email"
                  description="Email cannot be changed once registered"
                >
                  <Input
                    id="email"
                    type="email"
                    disabled
                    className="bg-muted"
                    {...register('email')}
                  />
                </FormField>
              </div>

              <FormActions>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending || Object.keys(errors).length > 0}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </FormActions>
            </form>
          </CardContent>
        </Card>

        {/* Workspace Info */}
        <Card>
          <CardHeader>
            <CardTitle>Workspace Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {user?.role || 'Member'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={user?.plan === 'pro' ? 'default' : 'muted'}>
                      {user?.plan === 'pro' ? 'Pro' : 'Free'}
                    </Badge>
                    {user?.plan === 'free' && (
                      <Link href="/pricing">
                        <Button variant="link" size="sm" className="px-0">
                          Upgrade
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Daily Credits</p>
                  <p className="text-sm font-medium text-foreground">
                    {user?.credits_remaining || 0} / {user?.daily_credit_limit || 3}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="text-sm font-medium text-foreground">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Program */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Program</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Share OpenInfo with your network and earn bonus credits when they
              sign up using your referral link.
            </p>

            <div className="space-y-4 max-w-md">
              <FormField label="Your Referral Code">
                <div className="flex gap-2">
                  <Input
                    value={user?.referral_code || 'Generating...'}
                    readOnly
                    className="bg-muted"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(user?.referral_code, 'Referral code copied!')
                    }
                  >
                    Copy
                  </Button>
                </div>
              </FormField>

              <FormField label="Your Referral Link">
                <div className="flex gap-2">
                  <Input
                    value={
                      user?.referral_code
                        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${user.referral_code}`
                        : 'Generating...'
                    }
                    readOnly
                    className="bg-muted text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/signup?ref=${user?.referral_code}`,
                        'Referral link copied!'
                      )
                    }
                  >
                    Copy
                  </Button>
                </div>
              </FormField>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
