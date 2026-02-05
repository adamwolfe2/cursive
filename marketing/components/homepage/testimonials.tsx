"use client"

import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"

interface Testimonial {
  quote: string
  name: string
  title: string
  company: string
  initials: string
}

const testimonials: Testimonial[] = [
  {
    quote: "We identified 2,400+ anonymous visitors in our first month. Our CAC dropped by 43% because we stopped relying on cold outbound and started reaching warm prospects already on our site.",
    name: "Michael Chen",
    title: "VP of Revenue",
    company: "CloudScale Analytics",
    initials: "MC",
  },
  {
    quote: "Cursive increased our meeting booking rate by 312%. The AI SDR works 24/7 and never misses a follow-up. It's like having a team of 15 BDRs without the overhead.",
    name: "Sarah Martinez",
    title: "Head of Sales",
    company: "DataFlow Systems",
    initials: "SM",
  },
  {
    quote: "We went from 12 qualified leads per month to 180+ by identifying intent signals from our existing traffic. ROI was positive in week 2. Best investment we've made this year.",
    name: "David Thompson",
    title: "CMO",
    company: "RevTech Solutions",
    initials: "DT",
  },
  {
    quote: "The visitor identification is incredible. We now know which enterprise accounts are researching our pricing page. Our sales team closes 3x more deals because they reach out at the perfect moment.",
    name: "Jennifer Park",
    title: "Director of Growth",
    company: "Enterprise SaaS Co",
    initials: "JP",
  },
  {
    quote: "Lead generation costs dropped from $215 per lead to $34. Cursive helped us extract maximum value from our existing ad spend by converting more traffic into pipeline.",
    name: "Robert Williams",
    title: "VP of Marketing",
    company: "GrowthStack Inc",
    initials: "RW",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-gray-50">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real results from B2B companies using Cursive to identify visitors and convert them into customers
          </p>
        </motion.div>

        {/* 3-column grid on desktop, 1 column on mobile */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              {/* Quote */}
              <p className="text-gray-700 mb-6 leading-relaxed flex-grow">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                {/* Avatar with initials */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {testimonial.initials}
                </div>

                <div>
                  <div className="text-gray-900 font-semibold">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}
