import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PixelInstallTabs } from '@/components/pixel/PixelInstallTabs'

const snippet = '<script src="https://cdn.audiencelab.io/pixel/customer-123.js" defer></script>\n<script>SuperPixel.init({ custom: true });</script>'

describe('PixelInstallTabs', () => {
  it.each(['HTML', 'GTM', 'Shopify'])('renders and copies the exact provisioned snippet for %s', async (tab) => {
    const { container } = render(<PixelInstallTabs snippet={snippet} />)
    fireEvent.click(screen.getByRole('button', { name: tab, exact: true }))
    expect(container.querySelector('pre')?.textContent).toBe(snippet)
    expect(container.querySelector('script')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(snippet))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('only offers installation methods supported by the supplied script', () => {
    render(<PixelInstallTabs snippet={snippet} />)
    expect(screen.queryByRole('button', { name: 'Next.js' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'React' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Shopify' }))
    expect(screen.queryByText(/Customer Events/i)).not.toBeInTheDocument()
  })

  it('shows missing installation data without offering fabricated code', () => {
    const { container } = render(<PixelInstallTabs snippet="" />)
    expect(screen.getByRole('alert')).toHaveTextContent(/installation snippet is unavailable/i)
    expect(container.querySelector('pre')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Copy code' })).not.toBeInTheDocument()
  })

  it('reports clipboard failure without claiming the code was copied', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Clipboard denied'))
    render(<PixelInstallTabs snippet={snippet} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not copy/i)
    expect(screen.queryByRole('button', { name: 'Copied' })).not.toBeInTheDocument()
  })
})
