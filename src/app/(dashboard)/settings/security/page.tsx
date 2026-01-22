'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SecuritySettingsPage() {
  const router = useRouter()
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

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

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      })
      if (response.ok) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get('current_password') as string
    const newPassword = formData.get('new_password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      setSuccessMessage('Password changed successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      ;(e.target as HTMLFormElement).reset()
    } catch (error: any) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Security Settings
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your account security and authentication
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/settings"
            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Profile
          </Link>
          <Link
            href="/settings/notifications"
            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Notifications
          </Link>
          <Link
            href="/settings/security"
            className="border-blue-500 text-blue-600 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Security
          </Link>
          <Link
            href="/settings/billing"
            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Billing
          </Link>
        </nav>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-green-400"
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
            <p className="ml-3 text-sm font-medium text-green-800">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="ml-3 text-sm font-medium text-red-800">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Change Password
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="current_password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Password
              </label>
              <input
                type="password"
                id="current_password"
                name="current_password"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="new_password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <input
                type="password"
                id="new_password"
                name="new_password"
                required
                minLength={8}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                required
                minLength={8}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </form>

      {/* Active Sessions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active Sessions
        </h2>

        <div className="space-y-4">
          <div className="flex items-start justify-between py-4 border-b border-gray-200">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Current Session
              </p>
              <p className="text-sm text-gray-500">
                Last activity: Just now
              </p>
              <p className="text-sm text-gray-500">Email: {user?.email}</p>
            </div>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>

          <p className="text-sm text-gray-500">
            This is the only active session for your account.
          </p>
        </div>
      </div>

      {/* Sign Out */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sign Out</h2>

        <p className="text-sm text-gray-600 mb-4">
          Sign out of your account on this device.
        </p>

        <button
          onClick={handleSignOut}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Sign Out
        </button>
      </div>

      {/* Delete Account */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-2">
          Delete Account
        </h2>
        <p className="text-sm text-red-700 mb-4">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <button
          onClick={() => {
            if (
              confirm(
                'Are you absolutely sure you want to delete your account? All your data will be permanently deleted and cannot be recovered.'
              )
            ) {
              alert('Account deletion will be implemented in a future update.')
            }
          }}
          className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
        >
          Delete Account
        </button>
      </div>
    </div>
  )
}
