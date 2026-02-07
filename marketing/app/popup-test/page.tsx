/**
 * Popup Test Page
 * For testing popup functionality in development
 */

'use client'

import { useState } from 'react'
import { ExitIntentPopup, BlogScrollPopup } from '@/components/popups'
import { clearPopupData } from '@/lib/popup-storage'

export default function PopupTestPage() {
  const [exitIntentEnabled, setExitIntentEnabled] = useState(true)
  const [blogScrollEnabled, setBlogScrollEnabled] = useState(true)

  const handleReset = () => {
    clearPopupData()
    alert('All popup data cleared. Refresh to see popups again.')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Popup Test Page</h1>

          <div className="flex flex-wrap gap-4">
            {/* Exit Intent Toggle */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={exitIntentEnabled}
                onChange={(e) => setExitIntentEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Exit Intent Popup</span>
            </label>

            {/* Blog Scroll Toggle */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={blogScrollEnabled}
                onChange={(e) => setBlogScrollEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Blog Scroll Popup</span>
            </label>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0066DD] transition-colors text-sm font-medium"
            >
              Reset All Popups
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Testing Instructions</h2>

          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">Exit Intent Popup:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Move your cursor toward the top of the browser (like you're closing the tab)</li>
                <li>Wait 5 seconds after page load before testing</li>
                <li>Should only show once per session</li>
                <li>On mobile: scroll up quickly by 100px+</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Blog Scroll Popup:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Scroll down to 50% of page content</li>
                <li>Slides in from bottom-right corner</li>
                <li>Can be minimized and expanded</li>
                <li>Should only show once per session</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Reset Popups:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Click "Reset All Popups" button above</li>
                <li>Or clear localStorage in DevTools</li>
                <li>Refresh page to see popups again</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Analytics Events:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Open browser console to see tracked events</li>
                <li>Events: impression, interaction, submission, dismiss</li>
                <li>Check Google Analytics debug view for live events</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Fake Content for Scrolling */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sample Blog Post Content</h2>
          <div className="prose prose-lg max-w-none">
            <p>
              This is sample content to enable scrolling and test the scroll-based popup.
              Keep scrolling to reach 50% depth and trigger the blog scroll popup.
            </p>

            <h3>Section 1: Introduction</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
              nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>

            <h3>Section 2: Main Content</h3>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
              eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
              in culpa qui officia deserunt mollit anim id est laborum.
            </p>

            <h3>Section 3: More Details</h3>
            <p>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
              doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
              veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>

            <h3>Section 4: Key Points</h3>
            <ul>
              <li>First important point about the topic</li>
              <li>Second crucial detail to consider</li>
              <li>Third essential insight</li>
              <li>Fourth valuable takeaway</li>
            </ul>

            <h3>Section 5: Conclusion</h3>
            <p>
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit,
              sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
              Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.
            </p>

            <p>
              At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
              praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias
              excepturi sint occaecati cupiditate non provident.
            </p>

            <h3>Section 6: Final Thoughts</h3>
            <p>
              Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum
              et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.
              Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.
            </p>

            <p>
              Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus
              saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.
              Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis.
            </p>

            <p>
              Keep scrolling... Almost at 50%...
            </p>

            <p style={{ marginTop: '400px' }}>
              You should have seen the blog scroll popup by now if it's enabled!
            </p>
          </div>
        </div>

        {/* More content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Information</h2>
          <p className="text-gray-700">
            This test page helps you verify that both popups are working correctly.
            Try moving your cursor to the top of the browser to trigger the exit intent,
            and scroll to see the blog popup appear.
          </p>
        </div>
      </div>

      {/* Popups */}
      <ExitIntentPopup
        enabled={exitIntentEnabled}
        onSubmit={async (data) => {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }}
      />

      <BlogScrollPopup
        enabled={blogScrollEnabled}
        scrollThreshold={50}
        onSubmit={async (data) => {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }}
      />
    </div>
  )
}
