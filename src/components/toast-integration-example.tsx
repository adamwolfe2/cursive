'use client'

/**
 * Toast Integration Example
 *
 * This file demonstrates how to integrate toast notifications
 * into your components for form submissions, API calls, and user actions.
 */

import { useToast } from '@/lib/contexts/toast-context'
import { useState } from 'react'

// Example 1: Form Submission
export function ExampleFormWithToast() {
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Success toast
      toast.success('Your changes have been saved successfully.')
    } catch (error) {
      // Error toast
      toast.error('Failed to save changes. Please try again.', {
        title: 'Save Failed',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        className="w-full px-4 py-2 border rounded-lg"
        placeholder="Enter something..."
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}

// Example 2: API Call with Loading State
export function ExampleApiCallWithToast() {
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/leads')

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const data = await response.json()

      toast.success(`Successfully loaded ${data.length} leads.`)
    } catch (error) {
      toast.error('Unable to load leads. Please check your connection.', {
        title: 'Load Failed',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={fetchData}
      disabled={isLoading}
      className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50"
    >
      {isLoading ? 'Loading...' : 'Load Data'}
    </button>
  )
}

// Example 3: Delete with Undo Action
export function ExampleDeleteWithUndo() {
  const toast = useToast()
  const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3'])

  const handleDelete = (index: number) => {
    const deletedItem = items[index]
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)

    // Show toast with undo action
    toast.success(`"${deletedItem}" has been deleted.`, {
      action: {
        label: 'Undo',
        onClick: () => {
          // Restore the item
          setItems((current) => {
            const restored = [...current]
            restored.splice(index, 0, deletedItem)
            return restored
          })
          toast.info('Item restored.')
        },
      },
    })
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
          <span>{item}</span>
          <button
            onClick={() => handleDelete(index)}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-[13px]"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}

// Example 4: Async Operation with Progress
export function ExampleAsyncOperation() {
  const toast = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const processData = async () => {
    setIsProcessing(true)

    toast.info('Processing your request...', {
      duration: 0, // Persistent toast
    })

    try {
      // Simulate long operation
      await new Promise((resolve) => setTimeout(resolve, 3000))

      toast.success('Data processed successfully!', {
        title: 'Processing Complete',
      })
    } catch (error) {
      toast.error('An error occurred during processing.', {
        title: 'Processing Failed',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <button
      onClick={processData}
      disabled={isProcessing}
      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
    >
      {isProcessing ? 'Processing...' : 'Process Data'}
    </button>
  )
}

// Example 5: Validation Warnings
export function ExampleValidationWarning() {
  const toast = useToast()
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!email.includes('@')) {
      toast.warning('Please enter a valid email address.', {
        title: 'Invalid Email',
      })
      return
    }

    toast.success('Email saved successfully!')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
        placeholder="Enter email..."
      />
      <button
        type="submit"
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
      >
        Save Email
      </button>
    </form>
  )
}

// Example 6: Copy to Clipboard
export function ExampleCopyToClipboard() {
  const toast = useToast()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!', {
        duration: 2000,
      })
    } catch (error) {
      toast.error('Failed to copy to clipboard.')
    }
  }

  return (
    <button
      onClick={() => copyToClipboard('Hello, Cursive!')}
      className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 text-[13px]"
    >
      Copy Text
    </button>
  )
}

// Example 7: Session Expiration Warning
export function ExampleSessionWarning() {
  const toast = useToast()

  const showSessionWarning = () => {
    toast.warning('Your session will expire in 5 minutes due to inactivity.', {
      title: 'Session Expiring Soon',
      duration: 10000,
      action: {
        label: 'Extend Session',
        onClick: () => {
          // Extend session logic here
          toast.success('Your session has been extended.')
        },
      },
    })
  }

  return (
    <button
      onClick={showSessionWarning}
      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-[13px]"
    >
      Simulate Session Warning
    </button>
  )
}

// Example 8: Multiple Actions (Bulk Operations)
export function ExampleBulkOperation() {
  const toast = useToast()

  const performBulkDelete = async () => {
    const itemCount = 15

    try {
      // Simulate bulk delete
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success(`Successfully deleted ${itemCount} leads.`, {
        title: 'Bulk Delete Complete',
        action: {
          label: 'Undo',
          onClick: () => {
            toast.info(`Restored ${itemCount} leads.`)
          },
        },
      })
    } catch (error) {
      toast.error('Failed to delete leads. Some items may not have been deleted.', {
        title: 'Bulk Delete Failed',
      })
    }
  }

  return (
    <button
      onClick={performBulkDelete}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-[13px]"
    >
      Delete 15 Items
    </button>
  )
}

// Example 9: Info Notifications
export function ExampleInfoNotification() {
  const toast = useToast()

  return (
    <button
      onClick={() =>
        toast.info('A new version of Cursive is available. Refresh to update.', {
          title: 'Update Available',
          duration: 0, // Persistent
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload(),
          },
        })
      }
      className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 text-[13px]"
    >
      Show Update Notice
    </button>
  )
}
