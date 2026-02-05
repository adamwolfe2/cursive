"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const integrations = [
  { name: "Slack", logo: "/integrations/slack.svg" },
  { name: "Gmail", logo: "/integrations/gmail.svg" },
  { name: "HubSpot", logo: "/integrations/hubspot-svgrepo-com.svg" },
  { name: "Salesforce", logo: "/integrations/salesforce.svg" },
  { name: "Notion", logo: "/integrations/notion.svg" },
  { name: "Linear", logo: "/integrations/linear.svg" },
  { name: "Shopify", logo: "/integrations/shopify.svg" },
  { name: "Google Ads", logo: "/integrations/google-ads-svgrepo-com.svg" },
  { name: "Google Calendar", logo: "/integrations/google-calendar.svg" },
  { name: "Google Docs", logo: "/integrations/google-docs-svgrepo-com.svg" },
  { name: "Google Drive", logo: "/integrations/google-drive-svgrepo-com.svg" },
  { name: "Google Sheets", logo: "/integrations/gsheet-document-svgrepo-com.svg" },
  { name: "Meta", logo: "/integrations/meta-color.svg" },
  { name: "LinkedIn", logo: "/integrations/linkedin.svg" },
  { name: "Instagram", logo: "/integrations/icons8-instagram.svg" },
  { name: "Pinterest", logo: "/integrations/icons8-pinterest.svg" },
  { name: "Reddit", logo: "/integrations/reddit-4.svg" },
  { name: "TikTok", logo: "/integrations/tiktok.svg" },
  { name: "X (Twitter)", logo: "/integrations/X_idJxGuURW1_0.svg" },
  { name: "GitHub", logo: "/integrations/github.svg" },
  { name: "Zoom", logo: "/integrations/icons8-zoom.svg" },
  { name: "Microsoft Teams", logo: "/integrations/icons8-microsoft-teams.svg" },
  { name: "Outlook", logo: "/integrations/icons8-microsoft-outlook-2019.svg" },
  { name: "Airtable", logo: "/integrations/airtable-svgrepo-com.svg" },
  { name: "Apollo", logo: "/integrations/apollo.svg" },
  { name: "Asana", logo: "/integrations/asana.svg" },
  { name: "Attentive", logo: "/integrations/attentive.webp" },
  { name: "Calendly", logo: "/integrations/calendly.svg" },
  { name: "Firecrawl", logo: "/integrations/firecrawl-logo.webp" },
  { name: "Instantly", logo: "/integrations/instantly.webp" },
  { name: "Klaviyo", logo: "/integrations/klaviyo.svg" },
  { name: "OpenAI", logo: "/integrations/openai-svgrepo-com.svg" },
  { name: "Search Console", logo: "/integrations/search-console-icon-2025-1.svg" },
  { name: "Sentry", logo: "/integrations/Sentry_idovIhtf_y_0.svg" },
  { name: "Telegram", logo: "/integrations/telegram-communication-chat-interaction-network-connection-svgrepo-com.svg" },
  { name: "Typeform", logo: "/integrations/typeform.svg" },
  { name: "Webflow", logo: "/integrations/Webflow_id2IyfqSKv_0.svg" },
  { name: "WordPress", logo: "/integrations/icons8-wordpress.svg" },
]

interface IntegrationsShowcaseProps {
  title?: string
  subtitle?: string
  className?: string
}

export function IntegrationsShowcase({
  title = "Integrates With Everything You Use",
  subtitle,
  className = "",
}: IntegrationsShowcaseProps) {
  return (
    <section className={className}>
      <div className="text-center mb-12">
        {title && (
          <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
        {integrations.map((integration, i) => (
          <motion.div
            key={integration.name}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.5,
              delay: i * 0.03,
              ease: [0.25, 0.4, 0.25, 1],
            }}
            whileHover={{ scale: 1.1, y: -5 }}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center aspect-square"
          >
            <Image
              src={integration.logo}
              alt={integration.name}
              width={64}
              height={64}
              className="w-12 h-12 object-contain"
            />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
        className="text-center mt-12"
      >
        <p className="text-gray-600">
          And 200+ more integrations through webhooks and custom APIs
        </p>
      </motion.div>
    </section>
  )
}
