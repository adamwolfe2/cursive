/**
 * Toast Component Tests
 *
 * Tests for the toast notification system.
 *
 * Note: The Toast component uses requestAnimationFrame for progress updates.
 * RAF is mocked globally in tests/setup.ts to use setTimeout, allowing
 * fake timers to work correctly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Toast, ToastProps } from '../toast'

describe('Toast', () => {
  let mockOnClose: ReturnType<typeof vi.fn>
  let defaultProps: ToastProps

  beforeEach(() => {
    mockOnClose = vi.fn()
    defaultProps = {
      id: 'test-toast',
      type: 'success',
      message: 'Test message',
      onClose: mockOnClose,
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('renders success toast with correct styling', () => {
    render(<Toast {...defaultProps} />)

    const toast = screen.getByRole('alert')
    expect(toast).toBeInTheDocument()
    expect(toast).toHaveClass('bg-emerald-50', 'border-emerald-200')
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('renders error toast with correct styling', () => {
    render(<Toast {...defaultProps} type="error" />)

    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-red-50', 'border-red-200')
  })

  it('renders warning toast with correct styling', () => {
    render(<Toast {...defaultProps} type="warning" />)

    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-amber-50', 'border-amber-200')
  })

  it('renders info toast with correct styling', () => {
    render(<Toast {...defaultProps} type="info" />)

    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-zinc-50', 'border-zinc-200')
  })

  it('renders title when provided', () => {
    render(<Toast {...defaultProps} title="Test Title" />)

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('does not render title when not provided', () => {
    render(<Toast {...defaultProps} />)

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
  })

  it('renders action button and calls onClick when clicked', () => {
    vi.useFakeTimers()
    const mockAction = vi.fn()

    render(
      <Toast
        {...defaultProps}
        action={{ label: 'Undo', onClick: mockAction }}
      />
    )

    const button = screen.getByText('Undo')
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(mockAction).toHaveBeenCalledTimes(1)

    // handleClose uses setTimeout(300ms) before calling onClose
    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(mockOnClose).toHaveBeenCalledWith('test-toast')
  })

  it('calls onClose when close button is clicked after animation', () => {
    vi.useFakeTimers()

    render(<Toast {...defaultProps} />)

    const closeButton = screen.getByLabelText('Close notification')
    fireEvent.click(closeButton)

    // onClose is called after 300ms animation delay
    expect(mockOnClose).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(mockOnClose).toHaveBeenCalledWith('test-toast')
  })

  it('auto-dismisses after duration', () => {
    vi.useFakeTimers()

    render(<Toast {...defaultProps} duration={1000} />)

    // Advance through the duration + RAF cycles (16ms per frame)
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    // After duration, handleClose is called which adds 300ms delay
    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(mockOnClose).toHaveBeenCalledWith('test-toast')
  })

  it('does not auto-dismiss when duration is 0', () => {
    vi.useFakeTimers()

    render(<Toast {...defaultProps} duration={0} />)

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('pauses auto-dismiss on hover', () => {
    vi.useFakeTimers()

    render(<Toast {...defaultProps} duration={2000} />)

    const toast = screen.getByRole('alert')

    // Advance partway through duration
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Hover to pause
    fireEvent.mouseEnter(toast)

    // Advance time while hovering - should not dismiss
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(mockOnClose).not.toHaveBeenCalled()

    // Mouse leave to resume
    fireEvent.mouseLeave(toast)

    // Advance to complete the remaining duration + animation
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(mockOnClose).toHaveBeenCalledWith('test-toast')
  })

  it('applies exit animation class when closing', () => {
    vi.useFakeTimers()

    render(<Toast {...defaultProps} />)

    const closeButton = screen.getByLabelText('Close notification')
    fireEvent.click(closeButton)

    const toast = screen.getByRole('alert')

    // Should have exit animation class immediately after click
    expect(toast).toHaveClass('translate-x-[400px]', 'opacity-0')

    // onClose called after animation duration
    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(mockOnClose).toHaveBeenCalledWith('test-toast')
  })

  it('renders with correct accessibility attributes', () => {
    render(<Toast {...defaultProps} />)

    const toast = screen.getByRole('alert')
    expect(toast).toHaveAttribute('aria-live', 'polite')

    const closeButton = screen.getByLabelText('Close notification')
    expect(closeButton).toBeInTheDocument()
  })

  it('handles long messages gracefully', () => {
    const longMessage = 'This is a very long message that should be displayed properly without breaking the layout or causing any visual issues in the toast notification component.'

    render(<Toast {...defaultProps} message={longMessage} />)

    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })
})
