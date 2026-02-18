'use client'

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
import { useToast } from '@/lib/hooks/use-toast'

export default function SecuritySettingsPage() {
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()

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
      }
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const onSubmit = (data: PasswordUpdateFormData) => {
    changePasswordMutation.mutate(data)
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

      {/* Two-Factor Authentication (Placeholder) */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Add an extra layer of security to your account by requiring a second form
                of authentication.
              </p>
            </div>
            <Button variant="outline" disabled>
              Enable 2FA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-foreground">Coming Soon</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Two-factor authentication will be available in a future update. We
                  recommend using a strong, unique password in the meantime.
                </p>
              </div>
            </div>
          </div>
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
