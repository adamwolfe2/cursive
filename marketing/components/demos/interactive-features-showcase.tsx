"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { DemoVisitorTracking } from "./demo-visitor-tracking"
import { DemoPipelineDashboard } from "./demo-pipeline-dashboard"
import { DemoLeadSequence } from "./demo-lead-sequence"
import { DemoAIStudio } from "./demo-ai-studio"
import { DemoPeopleSearch } from "./demo-people-search"
import { DemoMarketplace } from "./demo-marketplace"
import { DemoIntentHeatmap } from "./demo-intent-heatmap"
import { DemoAudienceBuilder } from "./demo-audience-builder"
import { DemoEnrichmentWaterfall } from "./demo-enrichment-waterfall"
import { DemoEmailValidator } from "./demo-email-validator"
import { DemoAttributionFlow } from "./demo-attribution-flow"
import { DemoAccountIntelligence } from "./demo-account-intelligence"

interface FeatureTab {
  id: string
  label: string
  component: React.ReactNode
  category?: string
}

const features: FeatureTab[] = [
  // Core Features
  {
    id: "visitor-tracking",
    label: "Visitor Tracking",
    component: <DemoVisitorTracking />,
    category: "core"
  },
  {
    id: "intent-heatmap",
    label: "Intent Heatmap",
    component: <DemoIntentHeatmap />,
    category: "core"
  },
  {
    id: "audience-builder",
    label: "Audience Builder",
    component: <DemoAudienceBuilder />,
    category: "core"
  },
  {
    id: "enrichment",
    label: "Data Enrichment",
    component: <DemoEnrichmentWaterfall />,
    category: "core"
  },
  // Engagement Tools
  {
    id: "sequences",
    label: "Lead Sequences",
    component: <DemoLeadSequence />,
    category: "engagement"
  },
  {
    id: "ai-studio",
    label: "AI Studio",
    component: <DemoAIStudio />,
    category: "engagement"
  },
  {
    id: "email-validator",
    label: "Email Validator",
    component: <DemoEmailValidator />,
    category: "engagement"
  },
  // Analytics
  {
    id: "pipeline",
    label: "Pipeline Dashboard",
    component: <DemoPipelineDashboard />,
    category: "analytics"
  },
  {
    id: "attribution",
    label: "Attribution Flow",
    component: <DemoAttributionFlow />,
    category: "analytics"
  },
  {
    id: "account-intel",
    label: "Account Intelligence",
    component: <DemoAccountIntelligence />,
    category: "analytics"
  },
  // Data & Tools
  {
    id: "people-search",
    label: "People Search",
    component: <DemoPeopleSearch />,
    category: "data"
  },
  {
    id: "marketplace",
    label: "Marketplace",
    component: <DemoMarketplace />,
    category: "data"
  },
]

export function InteractiveFeaturesShowcase() {
  const [activeTab, setActiveTab] = useState(features[0].id)

  const activeFeature = features.find(f => f.id === activeTab)

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setActiveTab(feature.id)}
            className={`
              px-4 py-3 rounded-lg text-sm transition-all
              ${activeTab === feature.id
                ? 'bg-white text-gray-900 border-2 border-gray-900 shadow-sm font-medium'
                : 'bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 border border-gray-200'
              }
            `}
          >
            {feature.label}
          </button>
        ))}
      </div>

      {/* Demo Container with Browser Chrome */}
      <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Browser Dots */}
          <div className="bg-gray-100 px-4 py-3 flex items-center gap-1.5 border-b border-gray-200">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <div className="w-3 h-3 rounded-full bg-gray-300" />
          </div>

          {/* Demo Content */}
          <div className="p-6 md:p-8 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeFeature?.component}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
