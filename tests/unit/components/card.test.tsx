/**
 * Card Component Tests
 * OpenInfo Platform
 *
 * Tests for Card component and its sub-components.
 * Updated to match actual component implementation.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

describe('Card', () => {
  describe('Card', () => {
    it('renders with default variant', () => {
      render(<Card>Card content</Card>)

      const card = screen.getByText('Card content')
      expect(card).toBeInTheDocument()
    })

    it('applies default styles', () => {
      render(<Card data-testid="card">Card content</Card>)

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card')
    })

    it('applies elevated variant styles', () => {
      render(
        <Card variant="elevated" data-testid="card">
          Card content
        </Card>
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-enterprise-md')
    })

    it('applies interactive variant styles', () => {
      render(
        <Card variant="interactive" data-testid="card">
          Card content
        </Card>
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('cursor-pointer')
    })

    it('accepts custom className', () => {
      render(
        <Card className="custom-class" data-testid="card">
          Card content
        </Card>
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-class')
    })

    it('handles onClick when interactive', async () => {
      const handleClick = vi.fn()
      const { user } = render(
        <Card variant="interactive" onClick={handleClick}>
          Click me
        </Card>
      )

      await user.click(screen.getByText('Click me'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('CardHeader', () => {
    it('renders children', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      )

      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('applies correct spacing', () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header</CardHeader>
        </Card>
      )

      const header = screen.getByTestId('header')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5')
    })
  })

  describe('CardTitle', () => {
    it('renders as h3', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      )

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title')
    })

    it('applies correct text styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle data-testid="title">Title</CardTitle>
          </CardHeader>
        </Card>
      )

      const title = screen.getByTestId('title')
      expect(title).toHaveClass('font-semibold')
    })
  })

  describe('CardDescription', () => {
    it('renders description text', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description text</CardDescription>
          </CardHeader>
        </Card>
      )

      expect(screen.getByText('Description text')).toBeInTheDocument()
    })

    it('applies correct text styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="description">Description</CardDescription>
          </CardHeader>
        </Card>
      )

      const description = screen.getByTestId('description')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })
  })

  describe('CardContent', () => {
    it('renders content', () => {
      render(
        <Card>
          <CardContent>Content goes here</CardContent>
        </Card>
      )

      expect(screen.getByText('Content goes here')).toBeInTheDocument()
    })
  })

  describe('CardFooter', () => {
    it('renders footer content', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      )

      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('applies correct layout styles', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      )

      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('flex', 'items-center', 'pt-4')
    })
  })

  describe('Composition', () => {
    it('renders complete card with all parts', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>Main content area</CardContent>
          <CardFooter>
            <button>Save</button>
            <button>Cancel</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card description text')).toBeInTheDocument()
      expect(screen.getByText('Main content area')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })
})
