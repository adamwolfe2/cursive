'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { passwordUpdateSchema, type PasswordUpdateFormData } from '@/lib/validation/schemas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Badge } from '@/components/ui/badge'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import Image from 'next/image'
import { useToast } from '@/lib/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

type EnrollStep = 'idle' | 'setup' | 'verify' | 'complete'

interface EnrollData {
  qr_code: string
  secret: string
  id: string
}

export default function SecuritySettingsPage() {
  const router = useRouter()
  const toast = useToast()
  const _queryClient = useQueryClient()

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(true)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [enrollStep, setEnrollStep] = useState<EnrollStep>('idle')
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaWorking, setMfaWorking] = useState(false)

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

  // Password change form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordUpdateFormData>({
    resolver: zodResolver(passwordUpdateSchema),
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordUpdateFormData) => {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: data.current_password,
          new_password: data.new_password,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change password')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Password changed successfully!')
      reset()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change password')
    },
  })

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      })
      if (response.ok) {
        toast.success('Signed out successfully')
        router.push('/login')
      } else {
        toast.error('Failed to sign out — please try again')
      }
    } catch {
      toast.error('Failed to sign out — check your connection')
    }
  }

  const onSubmit = (data: PasswordUpdateFormData) => {
    changePasswordMutation.mutate(data)
  }

  // MFA functions
  const checkMfaStatus = async () => {
    setMfaLoading(true)
    const supabase = createClient()
    const { data } = await supabase.auth.mfa.listFactors()
    if (data) {
      const totp = data.totp.find((f) => f.factor_type === 'totp' && f.status === 'verified')
      if (totp) {
        setMfaEnabled(true)
        setMfaFactorId(totp.id)
      } else {
        setMfaEnabled(false)
        setMfaFactorId(null)
      }
    }
    setMfaLoading(false)
  }

  useEffect(() => {
    checkMfaStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startEnrollment = async () => {
    setMfaError(null)
    setMfaWorking(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error || !data) {
      setMfaError(error?.message || 'Failed to start enrollment. Please try again.')
      setMfaWorking(false)
      return
    }
    setEnrollData({
      qr_code: data.totp.qr_code,
      secret: data.totp.secret,
      id: data.id,
    })
    setEnrollStep('setup')
    setMfaWorking(false)
  }

  const verifyEnrollment = async () => {
    if (!enrollData) return
    setMfaError(null)
    setMfaWorking(true)
    const supabase = createClient()

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: enrollData.id,
    })

    if (challengeError || !challengeData) {
      setMfaError(challengeError?.message || 'Failed to initiate challenge. Please try again.')
      setMfaWorking(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enrollData.id,
      challengeId: challengeData.id,
      code: totpCode,
    })

    if (verifyError) {
      setMfaError(verifyError.message || 'Invalid code. Please check your authenticator and try again.')
      setMfaWorking(false)
      return
    }

    setMfaEnabled(true)
    setMfaFactorId(enrollData.id)
    setEnrollStep('complete')
    setTotpCode('')
    setMfaWorking(false)
    toast.success('2FA enabled successfully')
  }

  const disableMfa = async () => {
    if (!mfaFactorId) return
    setMfaError(null)
    setMfaWorking(true)
    const supabase = createClient()

    const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId })

    if (error) {
      setMfaError(error.message || 'Failed to disable 2FA. Please try again.')
      setMfaWorking(false)
      return
    }

    setMfaEnabled(false)
    setMfaFactorId(null)
    setEnrollStep('idle')
    setEnrollData(null)
    setMfaWorking(false)
    toast.success('2FA disabled')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 max-w-md">
              <FormField
                label="Current Password"
                htmlFor="current_password"
                required
                error={errors.current_password?.message}
              >
                <Input
                  id="current_password"
                  type="password"
                  disabled={changePasswordMutation.isPending}
                  {...register('current_password')}
                />
              </FormField>

              <FormField
                label="New Password"
                htmlFor="new_password"
                required
                error={errors.new_password?.message}
                description="Must be at least 8 characters with uppercase, lowercase, and numbers"
              >
                <Input
                  id="new_password"
                  type="password"
                  disabled={changePasswordMutation.isPending}
                  {...register('new_password')}
                />
              </FormField>

              <FormField
                label="Confirm New Password"
                htmlFor="confirm_password"
                required
                error={errors.confirm_password?.message}
              >
                <Input
                  id="confirm_password"
                  type="password"
                  disabled={changePasswordMutation.isPending}
                  {...register('confirm_password')}
                />
              </FormField>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending || Object.keys(errors).length > 0}
              >
                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Add an extra layer of security with a time-based one-time password (TOTP).
              </p>
            </div>
            <Badge variant={mfaEnabled ? 'success' : 'secondary'} dot={mfaEnabled}>
              {mfaEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {mfaLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-9 w-28" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Error display */}
              {mfaError && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{mfaError}</p>
                </div>
              )}

              {/* MFA enabled state */}
              {mfaEnabled && enrollStep !== 'setup' && enrollStep !== 'verify' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <svg
                      className="h-5 w-5 text-success flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span>2FA is active on your account. Your account is protected with an authenticator app.</span>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      onClick={disableMfa}
                      disabled={mfaWorking}
                      className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                    >
                      {mfaWorking ? 'Disabling...' : 'Disable 2FA'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Idle — not enabled */}
              {!mfaEnabled && enrollStep === 'idle' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use an authenticator app like Google Authenticator, Authy, or 1Password to generate time-based codes.
                  </p>
                  <Button onClick={startEnrollment} disabled={mfaWorking}>
                    {mfaWorking ? 'Starting...' : 'Enable 2FA'}
                  </Button>
                </div>
              )}

              {/* Setup step — show QR code */}
              {enrollStep === 'setup' && enrollData && (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      Step 1: Scan this QR code with your authenticator app
                    </p>
                    <div className="inline-block border border-border rounded-lg p-3 bg-white">
                      <Image
                        src={enrollData.qr_code}
                        alt="QR code for authenticator app"
                        width={192}
                        height={192}
                        unoptimized
                        className="w-48 h-48"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Or enter this key manually:
                    </p>
                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                      {enrollData.secret}
                    </code>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      Step 2: Enter the 6-digit code from your app to verify
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      autoComplete="one-time-code"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      disabled={mfaWorking}
                      placeholder="000000"
                      className="block w-40 rounded-md border-0 px-3 py-2 text-center text-lg tracking-widest text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={verifyEnrollment}
                        disabled={mfaWorking || totpCode.length !== 6}
                      >
                        {mfaWorking ? 'Verifying...' : 'Verify & Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEnrollStep('idle')
                          setEnrollData(null)
                          setTotpCode('')
                          setMfaError(null)
                        }}
                        disabled={mfaWorking}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete state */}
              {enrollStep === 'complete' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <svg
                      className="h-5 w-5 text-success flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">2FA is now active on your account.</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You will be prompted for a code from your authenticator app each time you sign in.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Session */}
      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between py-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground">Signed in as</p>
                <Badge variant="default">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span>This device</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card>
        <CardHeader>
          <CardTitle>Sign Out</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your account on this device. You&apos;ll need to sign in again to
            access your account.
          </p>

          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {[
              "Use a strong, unique password that you don't use anywhere else",
              'Change your password regularly (every 90 days recommended)',
              'Never share your password with anyone, including support staff',
              'Sign out when using shared or public computers',
            ].map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <svg
                  className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
