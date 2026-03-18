"use client"

import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import Image from "next/image"

const companies = [
  { name: "Salesforce", logo: "/integrations/salesforce.svg" },
  { name: "HubSpot", logo: "/integrations/hubspot-svgrepo-com.svg" },
  { name: "Klaviyo", logo: "/integrations/klaviyo.svg" },
  { name: "Slack", logo: "/integrations/slack-svgrepo-com.svg" },
  { name: "Zoom", logo: "/integrations/icons8-zoom.svg" },
  { name: "Shopify", logo: "/integrations/shopify.svg" },
  { name: "Notion", logo: "/integrations/notion.svg" },
  { name: "Linear", logo: "/integrations/linear.svg" },
]

export function CustomerLogos() {
  return (
    <section className="py-16 bg-gray-100">
      <Container>
        <motion.div
          initial={false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <h2 className="text-2xl lg:text-3xl font-light text-gray-900 mb-4">
            Integrates with your existing stack
          </h2>
          <p className="text-gray-500 text-base mb-12">
            Push enriched leads directly into the tools you already use
          </p>

          {/* Desktop: 2x4 Grid, Mobile: 2x2 Grid - Fixed height to prevent layout shifts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-5xl mx-auto">
            {companies.map((company, index) => (
              <div
                key={company.name}
                className="flex items-center justify-center h-16"
              >
                <div className="hover:scale-110 transition-all duration-300">
                  <Image
                    src={company.logo}
                    alt={`${company.name} logo`}
                    width={48}
                    height={48}
                    className="object-contain w-12 h-12"
                    priority={index < 4}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
