'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSettingsSchema, type ProfileSettingsFormData } from '@/lib/validation/schemas'
import { GradientCard } from '@/components/ui/gradient-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField, FormActions } from '@/components/ui/form-field'
import { useToast } from '@/lib/hooks/use-toast'
import { useDashboard } from '@/lib/contexts/dashboard-context'

export default function ProfileSettingsPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const toast = useToast()
  const { userProfile: contextProfile } = useDashboard()
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, _setErrorMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const deleteInputRef = useRef<HTMLInputElement>(null)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch supplemental user fields not available in DashboardContext
  // (referral_code, created_at). Core fields come from context for instant render.
  const { data: userData } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/users/me')
      if (!response.ok) {
        const json = await response.json().catch(() => ({}))
        throw Object.assign(new Error(json.error || 'Failed to fetch user data'), { status: response.status })
      }
      return response.json()
    },
    // Don't block rendering — context has the critical fields already
    staleTime: 5 * 60_000,
  })

  // Merge: context data is authoritative for plan/role/credits; API fills in extras
  const user = {
    id: contextProfile.id,
    email: contextProfile.email,
    full_name: contextProfile.fullName,
    role: contextProfile.role,
    plan: contextProfile.plan,
    daily_credit_limit: contextProfile.dailyCreditLimit,
    daily_credits_used: contextProfile.dailyCreditsUsed,
    credits_remaining: Math.max(0, contextProfile.dailyCreditLimit - contextProfile.dailyCreditsUsed),
    // Supplemental fields from API (may be undefined until loaded)
    referral_code: userData?.data?.referral_code ?? null,
    created_at: userData?.data?.created_at ?? null,
  }

  // Profile form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileSettingsFormData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      full_name: '',
      email: '',
    },
  })

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current)
    }
  }, [])

  // Populate form from context on mount (contextProfile is stable from SSR)
  useEffect(() => {
    reset({
      full_name: contextProfile.fullName || '',
      email: contextProfile.email || '',
    })
  }, [contextProfile.id, reset]) // eslint-disable-line react-hooks/exhaustive-deps

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_email: user.email }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete account')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('Account deleted successfully. Redirecting...')
      redirectTimeoutRef.current = setTimeout(() => {
        router.push('/signup')
        redirectTimeoutRef.current = null
      }, 2000)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account')
    },
  })

  const onSubmit = (data: ProfileSettingsFormData) => {
    updateProfileMutation.mutate(data)
  }

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
    setSuccessMessage(message)
    messageTimeoutRef.current = setTimeout(() => {
      setSuccessMessage('')
      messageTimeoutRef.current = null
    }, 3000)
  }

  return (
    <div>

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
        <GradientCard variant="subtle">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
          </div>
          <div>
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
          </div>
        </GradientCard>

        {/* Workspace Info */}
        <GradientCard variant="subtle">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Workspace Information</h2>
          </div>
          <div>
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
                      <Link href="/settings/billing">
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
          </div>
        </GradientCard>

        {/* Referral Program */}
        <GradientCard variant="accent">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Referral Program</h2>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Share Cursive with your network and earn bonus credits when they
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
                    disabled={!user?.referral_code}
                    onClick={() =>
                      copyToClipboard(user?.referral_code ?? '', 'Referral code copied!')
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
                    disabled={!user?.referral_code}
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/signup?ref=${user?.referral_code ?? ''}`,
                        'Referral link copied!'
                      )
                    }
                  >
                    Copy
                  </Button>
                </div>
              </FormField>
            </div>
          </div>
        </GradientCard>

        {/* Danger Zone */}
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteConfirm(true)
                focusTimeoutRef.current = setTimeout(() => {
                  deleteInputRef.current?.focus()
                  focusTimeoutRef.current = null
                }, 100)
              }}
            >
              Delete Account
            </Button>
          ) : (
            <div className="space-y-4 max-w-md">
              <Alert variant="destructive">
                <AlertDescription>
                  This will permanently delete your account, all leads, campaigns, and workspace data.
                  This action is irreversible.
                </AlertDescription>
              </Alert>

              <FormField
                label='Type "delete my account" to confirm'
                htmlFor="delete_confirm"
              >
                <Input
                  id="delete_confirm"
                  ref={deleteInputRef}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="delete my account"
                  className="font-mono"
                />
              </FormField>

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  disabled={deleteConfirmText !== 'delete my account' || deleteAccountMutation.isPending}
                  onClick={() => deleteAccountMutation.mutate()}
                >
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Permanently Delete Account'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
