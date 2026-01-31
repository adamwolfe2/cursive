/**
 * AI Studio - Home Page
 * Clean Cursive-inspired UI with brand extraction
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Loader2,
  Globe,
  Check,
  Image as ImageIcon,
  Palette,
  Type,
  MessageSquare,
  Wand2,
  ArrowUp,
  ChevronRight,
  XCircle,
} from 'lucide-react'

interface BrandWorkspace {
  id: string
  name: string
  url: string
  logo_url: string | null
  extraction_status: 'processing' | 'completed' | 'failed'
  created_at: string
}

interface LoadingStep {
  id: string
  label: string
  icon: any
  status: 'pending' | 'loading' | 'complete'
}

export default function AIStudioPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<BrandWorkspace[]>([])
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true)
  const [userName, setUserName] = useState<string>('there')
  const [extractionError, setExtractionError] = useState<string | null>(null)

  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    { id: '1', label: 'Capturing website', icon: Globe, status: 'pending' },
    { id: '2', label: 'Extracting screenshots', icon: ImageIcon, status: 'pending' },
    { id: '3', label: 'Analyzing brand colors', icon: Palette, status: 'pending' },
    { id: '4', label: 'Identifying typography', icon: Type, status: 'pending' },
    { id: '5', label: 'Understanding brand voice', icon: MessageSquare, status: 'pending' },
    { id: '6', label: 'Generating insights', icon: Wand2, status: 'pending' },
  ])

  useEffect(() => {
    fetchWorkspaces()
    fetchUserName()
  }, [])

  async function fetchUserName() {
    try {
      const response = await fetch('/api/user/me')
      const data = await response.json()
      if (data.user?.full_name) {
        const firstName = data.user.full_name.split(' ')[0]
        setUserName(firstName)
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    }
  }

  async function fetchWorkspaces() {
    try {
      const response = await fetch('/api/ai-studio/workspaces')
      const data = await response.json()
      setWorkspaces(data.workspaces || [])
    } catch (error) {
      console.error('Failed to load workspaces:', error)
    } finally {
      setIsLoadingWorkspaces(false)
    }
  }


  async function handleExtract() {
    if (!url.trim()) return

    setIsExtracting(true)
    setExtractionError(null)
    setLoadingSteps(steps => steps.map(s => ({ ...s, status: 'pending' })))
    setScreenshot(null)

    let pollInterval: NodeJS.Timeout | null = null
    let timeoutId: NodeJS.Timeout | null = null

    try {
      // Start extraction
      const response = await fetch('/api/ai-studio/brand/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract brand DNA')
      }

      // Poll for progress and update loading steps based on actual status
      const workspaceId = data.workspaceId
      let currentStep = 0

      pollInterval = setInterval(async () => {
        try {
          const progressRes = await fetch('/api/ai-studio/workspaces')
          const progressData = await progressRes.json()
          const workspace = progressData.workspaces?.find((w: any) => w.id === workspaceId)

          if (!workspace) return

          // Update screenshot when available
          if (workspace.brand_data?.screenshot && !screenshot) {
            setScreenshot(workspace.brand_data.screenshot)
          }

          // Update loading steps based on actual progress
          if (workspace.extraction_status === 'processing') {
            // Increment steps gradually
            if (currentStep < loadingSteps.length) {
              setLoadingSteps(prev => prev.map((step, idx) =>
                idx < currentStep ? { ...step, status: 'complete' } :
                idx === currentStep ? { ...step, status: 'loading' } :
                step
              ))
              currentStep++
            }
          } else if (workspace.extraction_status === 'completed') {
            // Mark all complete
            setLoadingSteps(prev => prev.map(s => ({ ...s, status: 'complete' })))
            if (pollInterval) clearInterval(pollInterval)
            if (timeoutId) clearTimeout(timeoutId)

            // Navigate to branding page
            setTimeout(() => {
              router.push(`/ai-studio/branding?workspace=${workspaceId}`)
            }, 1000)
          } else if (workspace.extraction_status === 'failed') {
            if (pollInterval) clearInterval(pollInterval)
            if (timeoutId) clearTimeout(timeoutId)
            setIsExtracting(false)
            setExtractionError(workspace.extraction_error || 'Extraction failed')
          }
        } catch (error) {
          console.error('Polling error:', error)
        }
      }, 2000) // Poll every 2 seconds

      // Safety timeout: stop polling after 2 minutes
      timeoutId = setTimeout(() => {
        if (pollInterval) clearInterval(pollInterval)
        setIsExtracting(false)
        setExtractionError('Extraction is taking longer than expected. Please check back in a moment.')
      }, 120000)

    } catch (error: any) {
      if (pollInterval) clearInterval(pollInterval)
      if (timeoutId) clearTimeout(timeoutId)
      setExtractionError(error.message || 'Failed to extract brand DNA')
      setIsExtracting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome back, <span className="italic">{userName}</span>!
          </h1>
          <p className="text-lg text-gray-600">
            Enter your website to create on-brand content, or select a workspace.
          </p>
        </div>

        {/* URL Input */}
        <Card className="p-8 mb-12 bg-white shadow-sm border border-gray-200">
          <div className="flex gap-3 items-center">
            <Input
              type="url"
              placeholder="yourwebsite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && url.trim() && !isExtracting) {
                  handleExtract()
                }
              }}
              className="flex-1 h-12 text-base bg-gray-50 border-gray-300"
              disabled={isExtracting}
            />
            <Button
              onClick={handleExtract}
              disabled={isExtracting || !url.trim()}
              className="bg-blue-600 hover:bg-blue-700 h-12 w-12 p-0"
            >
              {isExtracting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowUp className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            We'll analyze your brand and generate content
          </p>

          {/* Error Message */}
          {extractionError && !isExtracting && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{extractionError}</p>
              </div>
              <button
                onClick={() => setExtractionError(null)}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Loading Progress */}
          {isExtracting && (
            <div className="mt-8 space-y-4">
              {screenshot && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={screenshot}
                    alt="Website preview"
                    className="w-full"
                  />
                </div>
              )}

              <div className="space-y-2">
                {loadingSteps.map((step) => {
                  const Icon = step.icon
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        step.status === 'complete'
                          ? 'bg-green-50 border border-green-200'
                          : step.status === 'loading'
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {step.status === 'complete' ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : step.status === 'loading' ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      ) : (
                        <Icon className="h-5 w-5 text-gray-400" />
                      )}
                      <span className={`text-sm ${
                        step.status === 'complete' ? 'text-green-900' :
                        step.status === 'loading' ? 'text-blue-900' :
                        'text-gray-600'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Workspaces */}
        {!isExtracting && workspaces.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Your Workspaces
              </h2>
              <span className="text-sm text-gray-500">{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {workspaces.map((workspace) => (
                <Card
                  key={workspace.id}
                  className="p-6 cursor-pointer hover:shadow-md transition-shadow bg-white border border-gray-200"
                  onClick={() => {
                    if (workspace.extraction_status === 'completed') {
                      router.push(`/ai-studio/branding?workspace=${workspace.id}`)
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    {workspace.logo_url ? (
                      <img
                        src={workspace.logo_url}
                        alt={workspace.name}
                        className="h-12 w-12 rounded object-contain bg-gray-50 border border-gray-200 p-1"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-blue-100 flex items-center justify-center border border-blue-200">
                        <span className="text-blue-600 font-semibold text-lg">
                          {workspace.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {workspace.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        {workspace.extraction_status === 'processing' && (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Processing...
                          </>
                        )}
                        {workspace.extraction_status === 'completed' && (
                          <>
                            <Check className="h-3 w-3 text-green-600" />
                            Ready
                          </>
                        )}
                        {workspace.extraction_status === 'failed' && (
                          <span className="text-red-600">Failed</span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingWorkspaces && !isExtracting && workspaces.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No workspaces yet. Enter a URL above to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
