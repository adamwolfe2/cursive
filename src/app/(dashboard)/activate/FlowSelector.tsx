'use client'

import {
  Sparkles, Target, Mail, CheckCircle2,
  ChevronRight, Eye, Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { FlowType } from './types'

export function FlowSelector({ onSelect, stats }: { onSelect: (f: FlowType) => void; stats: any }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Premium Activation</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Activate Your Audience</h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Turn your leads into revenue. Build a lookalike audience or launch managed outbound.
        </p>
        {stats && (stats.pixel_visitors > 0 || stats.enriched > 0) && (
          <div className="flex items-center justify-center gap-4 mt-5">
            {stats.pixel_visitors > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-primary/5 text-primary border border-primary/20 rounded-full px-3 py-1">
                <Eye className="h-3.5 w-3.5" />
                {stats.pixel_visitors} website visitors
              </span>
            )}
            {stats.enriched > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-primary/5 text-primary border border-primary/20 rounded-full px-3 py-1">
                <Zap className="h-3.5 w-3.5" />
                {stats.enriched} enriched leads
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Audience */}
        <button
          onClick={() => onSelect('audience')}
          className="group text-left bg-white rounded-2xl border-2 border-gray-200 p-7 hover:border-primary hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="p-3 rounded-xl bg-primary/10 transition-colors">
              <Target className="h-7 w-7 text-primary transition-colors" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lookalike Audience</h2>
          <p className="text-gray-500 text-sm mb-5">
            Define your ideal customer profile and we&apos;ll build a targeted list of thousands of matching prospects from our 280M+ database.
          </p>
          <div className="space-y-2">
            {[
              'Define ICP by industry, title, location',
              '25-lead sample in 48 hours',
              'Full list of 500\u20135,000+ verified contacts',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100">
            <Badge className="bg-primary/5 text-primary border border-primary/20 text-xs">
              From $0.10 / contact
            </Badge>
          </div>
        </button>

        {/* Campaign */}
        <button
          onClick={() => onSelect('campaign')}
          className="group text-left bg-white rounded-2xl border-2 border-gray-200 p-7 hover:border-primary hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="p-3 rounded-xl bg-primary/10 transition-colors">
              <Mail className="h-7 w-7 text-primary transition-colors" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Outbound Campaign</h2>
          <p className="text-gray-500 text-sm mb-5">
            We run personalised cold email campaigns to your website visitors or custom audience — you just close the deals that come in.
          </p>
          <div className="space-y-2">
            {[
              'We write the copy and manage sends',
              'Targets your pixel visitors or custom list',
              'Full reply handling and warm handoffs',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100">
            <Badge className="bg-primary/5 text-primary border border-primary/20 text-xs">
              Starting at $500 / mo
            </Badge>
          </div>
        </button>
      </div>
    </div>
  )
}
