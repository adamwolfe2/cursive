"use client"

import { motion } from "framer-motion"
import Image from "next/image"

// Exactly 36 items = 3 rows of 12 on desktop
const integrations = [
  { name: "Stripe", logo: "/integrations/stripe logo.png" },
  { name: "Mailchimp", logo: "/integrations/mailchimp logo.jpg" },
  { name: "Slack", logo: "/integrations/slack-svgrepo-com.svg" },
  { name: "Gmail", logo: "/integrations/gmail.svg" },
  { name: "HubSpot", logo: "/integrations/hubspot-svgrepo-com.svg" },
  { name: "Salesforce", logo: "/integrations/salesforce.svg" },
  { name: "Notion", logo: "/integrations/notion.svg" },
  { name: "Linear", logo: "/integrations/linear.svg" },
  { name: "Shopify", logo: "/integrations/shopify.svg" },
  { name: "Google Ads", logo: "/integrations/google-ads-svgrepo-com.svg" },
  { name: "Google Calendar", logo: "/integrations/Google_Calendar_icon_(2020).svg.png" },
  { name: "Google Docs", logo: "/integrations/google-docs-svgrepo-com.svg" },
  { name: "Google Drive", logo: "/integrations/google-drive-svgrepo-com.svg" },
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
  { name: "Calendly", logo: "/integrations/calendly.svg" },
  { name: "Instantly", logo: "/integrations/instantly.webp" },
  { name: "Klaviyo", logo: "/integrations/klaviyo.svg" },
  { name: "OpenAI", logo: "/integrations/openai-svgrepo-com.svg" },
  { name: "Typeform", logo: "/integrations/typeform.svg" },
  { name: "Webflow", logo: "/integrations/Webflow_id2IyfqSKv_0.svg" },
  { name: "WordPress", logo: "/integrations/icons8-wordpress.svg" },
  { name: "Zapier", logo: "/integrations/zapier.png" },
  { name: "Telegram", logo: "/integrations/telegram-communication-chat-interaction-network-connection-svgrepo-com.svg" },
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
          <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-3 max-w-6xl mx-auto">
        {integrations.map((integration, i) => (
          <motion.div
            key={integration.name}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.4,
              delay: i * 0.015,
              ease: [0.25, 0.4, 0.25, 1],
            }}
            whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
            className="bg-white rounded-lg p-2.5 border border-gray-200 hover:border-[#007AFF] hover:shadow-md transition-all duration-150 cursor-pointer flex items-center justify-center aspect-square"
          >
            <Image
              src={integration.logo}
              alt={`${integration.name} integration`}
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
              loading="lazy"
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
