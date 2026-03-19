/**
 * Toast Integration Tests
 *
 * Tests for the toast context and integration.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider, useToast } from '@/lib/contexts/toast-context'

// Test component that uses the toast hook
function TestComponent() {
  const toast = useToast()

  return (
    <div>
      <button onClick={() => toast.success('Success!')}>Success</button>
      <button onClick={() => toast.error('Error!')}>Error</button>
      <button onClick={() => toast.warning('Warning!')}>Warning</button>
      <button onClick={() => toast.info('Info!')}>Info</button>
      <button
        onClick={() =>
          toast.success('With action', {
            action: {
              label: 'Undo',
              onClick: () => { /* no-op for test */ },
            },
          })
        }
      >
        With Action
      </button>
    </div>
  )
}

describe('Toast Integration', () => {
  it('renders toast provider without errors', () => {
    render(
      <ToastProvider>
        <div>Test Content</div>
      </ToastProvider>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('provides toast context to children', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    expect(screen.getByText('Success')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('shows success toast when button clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Success')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument()
    })
  })

  it('shows error toast when button clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Error')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Error!')).toBeInTheDocument()
    })
  })

  it('shows warning toast when button clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Warning')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Warning!')).toBeInTheDocument()
    })
  })

  it('shows info toast when button clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Info')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Info!')).toBeInTheDocument()
    })
  })

  it('shows toast with action button', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('With Action')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('With action')).toBeInTheDocument()
      expect(screen.getByText('Undo')).toBeInTheDocument()
    })
  })

  it('can show multiple toasts', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Show multiple toasts
    fireEvent.click(screen.getByText('Success'))
    fireEvent.click(screen.getByText('Error'))
    fireEvent.click(screen.getByText('Warning'))

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument()
      expect(screen.getByText('Error!')).toBeInTheDocument()
      expect(screen.getByText('Warning!')).toBeInTheDocument()
    })
  })

  it('closes toast when close button clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Success')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument()
    })

    const closeButton = screen.getByLabelText('Close notification')
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Success!')).not.toBeInTheDocument()
    })
  })

  it('throws error when useToast used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useToast must be used within a ToastProvider')

    consoleSpy.mockRestore()
  })
})
