'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { passwordUpdateSchema, type PasswordUpdateFormData } from '@/lib/validation/schemas'
import { FormField, FormLabel, FormInput } from '@/components/ui/form'
import { useToast } from '@/lib/hooks/use-toast'

function SettingsNav({ currentPath }: { currentPath: string }) {
  const tabs = [
    { name: 'Profile', href: '/settings' },
    { name: 'Billing', href: '/settings/billing' },
    { name: 'Security', href: '/settings/security' },
    { name: 'Notifications', href: '/settings/notifications' },
  ]

  return (
    <div className="border-b border-zinc-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.href
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
              }`}
            >
              {tab.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

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
        <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse" />
        <div className="h-96 bg-zinc-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Security Settings</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Manage your password, sessions, and authentication settings
        </p>
      </div>

      {/* Navigation Tabs */}
      <SettingsNav currentPath="/settings/security" />

      {/* Change Password */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Change Password</h2>

          <div className="space-y-4">
            <FormField error={errors.current_password}>
              <FormLabel htmlFor="current_password" required>
                Current Password
              </FormLabel>
              <FormInput
                id="current_password"
                type="password"
                disabled={changePasswordMutation.isPending}
                error={errors.current_password}
                {...register('current_password')}
              />
            </FormField>

            <FormField error={errors.new_password}>
              <FormLabel htmlFor="new_password" required>
                New Password
              </FormLabel>
              <FormInput
                id="new_password"
                type="password"
                disabled={changePasswordMutation.isPending}
                error={errors.new_password}
                {...register('new_password')}
              />
              <p className="mt-1 text-xs text-zinc-500">
                Must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </FormField>

            <FormField error={errors.confirm_password}>
              <FormLabel htmlFor="confirm_password" required>
                Confirm New Password
              </FormLabel>
              <FormInput
                id="confirm_password"
                type="password"
                disabled={changePasswordMutation.isPending}
                error={errors.confirm_password}
                {...register('confirm_password')}
              />
            </FormField>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending || Object.keys(errors).length > 0}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </form>

      {/* Two-Factor Authentication (Placeholder) */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-sm text-zinc-600 mb-4">
              Add an extra layer of security to your account by requiring a second form
              of authentication.
            </p>

            <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-zinc-400 flex-shrink-0 mt-0.5"
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
                  <p className="text-sm font-medium text-zinc-900">Coming Soon</p>
                  <p className="text-sm text-zinc-600 mt-1">
                    Two-factor authentication will be available in a future update. We
                    recommend using a strong, unique password in the meantime.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            disabled
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-400 cursor-not-allowed ml-6"
          >
            Enable 2FA
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Active Sessions</h2>

        <div className="space-y-4">
          <div className="flex items-start justify-between py-4 border-b border-zinc-200 last:border-0">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-zinc-900">Current Session</p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-sm text-zinc-500">Last activity: Just now</p>
              <p className="text-sm text-zinc-500">Email: {user?.email}</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
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

          <p className="text-sm text-zinc-500 mt-4">
            This is the only active session for your account. Sign out other sessions to
            revoke access from other devices.
          </p>
        </div>
      </div>

      {/* Sign Out */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">Sign Out</h2>

        <p className="text-sm text-zinc-600 mb-4">
          Sign out of your account on this device. You&apos;ll need to sign in again to
          access your account.
        </p>

        <button
          onClick={handleSignOut}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Security Recommendations */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          Security Recommendations
        </h2>

        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-blue-800">
            <svg
              className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
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
            <span>Use a strong, unique password that you don&apos;t use anywhere else</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-blue-800">
            <svg
              className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
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
            <span>Change your password regularly (every 90 days recommended)</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-blue-800">
            <svg
              className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
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
            <span>Never share your password with anyone, including support staff</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-blue-800">
            <svg
              className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
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
            <span>Sign out when using shared or public computers</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
