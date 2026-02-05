'use client'

/**
 * Popup Manager
 * Central control for all popup components
 * Handles conflict resolution and routing logic
 */

import { usePathname } from 'next/navigation'
import { ExitIntentPopup } from './exit-intent-popup'
import { BlogScrollPopup } from './blog-scroll-popup'
import { handlePopupSubmission } from '@/lib/popup-submission'

interface PopupManagerProps {
  // Global settings
  enableExitIntent?: boolean
  enableBlogScroll?: boolean

  // Custom submission handlers
  onExitIntentSubmit?: (data: { email: string; company?: string }) => Promise<void>
  onBlogScrollSubmit?: (data: { email: string }) => Promise<void>
}

export function PopupManager({
  enableExitIntent = true,
  enableBlogScroll = true,
  onExitIntentSubmit,
  onBlogScrollSubmit,
}: PopupManagerProps) {
  const pathname = usePathname()

  // Determine which popups to show based on current page
  const isBlogPost = pathname?.startsWith('/blog/') && pathname.split('/').length >= 4
  const isExcludedPage = pathname === '/checkout' || pathname === '/thank-you'

  // Exit Intent: Show on all pages EXCEPT blog posts and excluded pages
  const showExitIntent = enableExitIntent && !isBlogPost && !isExcludedPage

  // Blog Scroll: Show ONLY on blog posts
  const showBlogScroll = enableBlogScroll && isBlogPost

  return (
    <>
      {/* Exit Intent Popup (All pages except blog posts) */}
      <ExitIntentPopup
        enabled={showExitIntent}
        onSubmit={onExitIntentSubmit || handlePopupSubmission}
      />

      {/* Blog Scroll Popup (Blog posts only) */}
      <BlogScrollPopup
        enabled={showBlogScroll}
        scrollThreshold={50}
        onSubmit={onBlogScrollSubmit || handlePopupSubmission}
      />
    </>
  )
}
