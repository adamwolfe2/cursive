'use client'

import { useToast } from '@/lib/contexts/toast-context'

export default function ToastDemoPage() {
  const toast = useToast()

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">
          Toast Notification System
        </h1>
        <p className="text-zinc-600 text-[15px]">
          Professional toast notifications with auto-dismiss, animations, and action buttons.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Basic Toasts */}
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Basic Toasts
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => toast.success('Changes saved successfully!')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-[13px] font-medium"
            >
              Success Toast
            </button>
            <button
              onClick={() => toast.error('Failed to save changes. Please try again.')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-[13px] font-medium"
            >
              Error Toast
            </button>
            <button
              onClick={() => toast.warning('This action cannot be undone.')}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-[13px] font-medium"
            >
              Warning Toast
            </button>
            <button
              onClick={() => toast.info('New updates are available.')}
              className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 transition-colors text-[13px] font-medium"
            >
              Info Toast
            </button>
          </div>
        </div>

        {/* Toasts with Titles */}
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            With Titles
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                toast.success('Your workspace has been updated with the latest settings.', {
                  title: 'Workspace Updated',
                })
              }
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-[13px] font-medium"
            >
              Success with Title
            </button>
            <button
              onClick={() =>
                toast.error('The server is currently unavailable. Please try again later.', {
                  title: 'Connection Failed',
                })
              }
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-[13px] font-medium"
            >
              Error with Title
            </button>
          </div>
        </div>

        {/* With Action Buttons */}
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            With Action Buttons
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                toast.success('Lead deleted successfully.', {
                  action: {
                    label: 'Undo',
                    onClick: () => toast.info('Lead restored!'),
                  },
                })
              }
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-[13px] font-medium"
            >
              With Undo Action
            </button>
            <button
              onClick={() =>
                toast.warning('Your session will expire in 5 minutes.', {
                  title: 'Session Expiring',
                  action: {
                    label: 'Extend Session',
                    onClick: () => toast.success('Session extended!'),
                  },
                })
              }
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-[13px] font-medium"
            >
              With Extend Action
            </button>
          </div>
        </div>

        {/* Custom Durations */}
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Custom Durations
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                toast.info('This will dismiss in 2 seconds.', {
                  duration: 2000,
                })
              }
              className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 transition-colors text-[13px] font-medium"
            >
              2 Second Toast
            </button>
            <button
              onClick={() =>
                toast.info('This will dismiss in 10 seconds.', {
                  duration: 10000,
                })
              }
              className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 transition-colors text-[13px] font-medium"
            >
              10 Second Toast
            </button>
            <button
              onClick={() =>
                toast.info('This toast stays until you close it.', {
                  duration: 0,
                })
              }
              className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 transition-colors text-[13px] font-medium"
            >
              Persistent Toast
            </button>
          </div>
        </div>

        {/* Multiple Toasts */}
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Multiple Toasts (Queue Management)
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                toast.success('First notification')
                setTimeout(() => toast.info('Second notification'), 300)
                setTimeout(() => toast.warning('Third notification'), 600)
                setTimeout(() => toast.error('Fourth notification'), 900)
                setTimeout(() => toast.success('Fifth notification'), 1200)
              }}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-[13px] font-medium"
            >
              Show 5 Toasts
            </button>
            <button
              onClick={() => {
                for (let i = 1; i <= 8; i++) {
                  setTimeout(() => {
                    toast.info(`Toast ${i} of 8`)
                  }, i * 200)
                }
              }}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-[13px] font-medium"
            >
              Show 8 Toasts (Max 5 visible)
            </button>
          </div>
        </div>

        {/* Custom API */}
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Custom API
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                toast.toast({
                  type: 'success',
                  title: 'Custom Toast',
                  message: 'Using the custom toast API',
                  duration: 3000,
                })
              }
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-[13px] font-medium"
            >
              Custom Toast
            </button>
          </div>
        </div>

        {/* Real-World Examples */}
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Real-World Examples
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                // Simulate form submission
                setTimeout(() => {
                  toast.success('Your profile has been updated successfully.')
                }, 500)
              }}
              className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 transition-colors text-[13px] font-medium"
            >
              Simulate Form Save
            </button>
            <button
              onClick={() => {
                // Simulate API error
                setTimeout(() => {
                  toast.error('Unable to connect to the server. Please check your internet connection.', {
                    title: 'Connection Error',
                  })
                }, 500)
              }}
              className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 transition-colors text-[13px] font-medium"
            >
              Simulate API Error
            </button>
            <button
              onClick={() => {
                // Simulate deletion with undo
                toast.warning('3 leads have been deleted.', {
                  title: 'Leads Deleted',
                  action: {
                    label: 'Undo',
                    onClick: () => {
                      toast.success('Leads restored successfully.')
                    },
                  },
                })
              }}
              className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 transition-colors text-[13px] font-medium"
            >
              Simulate Deletion
            </button>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="mt-8 bg-zinc-50 rounded-lg border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Features</h2>
        <ul className="space-y-2 text-[13px] text-zinc-700">
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>4 toast types: success, error, warning, info</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>Auto-dismiss after 5 seconds (configurable)</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>Pause on hover to read longer messages</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>Manual dismiss with X button</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>Stack up to 5 toasts (older ones hidden)</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>Smooth slide in/out animations</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>Optional action buttons (e.g., Undo)</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>Progress bar showing time remaining</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>Professional zinc/emerald/red/amber design</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
