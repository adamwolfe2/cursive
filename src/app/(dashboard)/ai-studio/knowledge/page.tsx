/**
 * AI Studio - Knowledge Base Page
 * Display AI-generated company intelligence
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, ArrowRight, BookOpen, Target, Megaphone, MessageSquare } from 'lucide-react'

interface KnowledgeBase {
  company_overview: string
  products_services: {
    name: string
    description: string
    target_audience: string
  }[]
  target_audience: string
  value_proposition: string[]
  brand_voice: {
    tone: string
    energy_level: string
    communication_style: string
  }
  key_messages: string[]
}

interface BrandWorkspace {
  id: string
  name: string
  url: string
  logo_url: string | null
  knowledge_base: KnowledgeBase | null
  extraction_status: string
}

export default function KnowledgePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace')

  const [workspace, setWorkspace] = useState<BrandWorkspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) {
      router.push('/ai-studio')
      return
    }
    fetchWorkspace()
  }, [workspaceId])

  async function fetchWorkspace() {
    try {
      const response = await fetch('/api/ai-studio/workspaces')
      const data = await response.json()
      const found = data.workspaces?.find((w: BrandWorkspace) => w.id === workspaceId)
      setWorkspace(found || null)
    } catch (error) {
      console.error('Failed to load workspace:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!workspace || !workspace.knowledge_base) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Knowledge base not found</p>
          <Button onClick={() => router.push('/ai-studio')} className="mt-4">
            Back to AI Studio
          </Button>
        </div>
      </div>
    )
  }

  const kb = workspace.knowledge_base

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Button
                onClick={() => router.push(`/ai-studio/branding?workspace=${workspaceId}`)}
                variant="ghost"
                size="sm"
                className="mb-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Branding
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
              <p className="text-sm text-gray-500">{workspace.name}</p>
            </div>

            <Button
              onClick={() => router.push(`/ai-studio/profiles?workspace=${workspaceId}`)}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              Next: Customer Profiles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Company Overview */}
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Company Overview
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {kb.company_overview}
            </p>
          </Card>

          {/* Products & Services */}
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Products & Services
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {kb.products_services.map((product, index) => (
                <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1">Target Audience</p>
                    <p className="text-sm text-gray-700">{product.target_audience}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Target Audience */}
            <Card className="p-6 bg-white shadow-sm border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Target Audience
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {kb.target_audience}
              </p>
            </Card>

            {/* Brand Voice */}
            <Card className="p-6 bg-white shadow-sm border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Brand Voice
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Tone</p>
                  <p className="text-sm text-gray-900">{kb.brand_voice.tone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Energy Level</p>
                  <p className="text-sm text-gray-900">{kb.brand_voice.energy_level}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Communication Style</p>
                  <p className="text-sm text-gray-900">{kb.brand_voice.communication_style}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Value Propositions */}
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Value Propositions
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {kb.value_proposition.map((prop, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-600 text-white w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{prop}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Key Messages */}
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Key Messages
            </h2>
            <ul className="space-y-2">
              {kb.key_messages.map((message, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">•</span>
                  <p className="text-gray-700 flex-1">{message}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
