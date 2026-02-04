"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Clock, MessageCircle, Calendar } from "lucide-react"
import { useState } from "react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  })
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("submitting")

    // Simulate form submission
    setTimeout(() => {
      setStatus("success")
      setFormData({ name: "", email: "", company: "", message: "" })
    }, 1000)
  }

  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-6">
              Let's Talk About
              <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                Your Growth
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Whether you have questions, need a demo, or want to discuss custom solutions—we're here to help.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Contact Methods */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-light text-gray-900 mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Tell us about your needs..."
                  />
                </div>

                {status === "success" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-[#007AFF]">
                    Thanks! We'll get back to you within 24 hours.
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-light text-gray-900 mb-6">Other Ways to Reach Us</h2>

              <div className="space-y-6 mb-8">
                <a
                  href="https://cal.com/adamwolfe/cursive-ai-audit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-6 bg-[#F7F9FB] rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-[#007AFF] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Book a Call</h3>
                    <p className="text-gray-600 text-sm">
                      Schedule a 15-minute intro call. We'll answer questions and show you a demo.
                    </p>
                    <span className="text-[#007AFF] text-sm mt-2 inline-block">
                      View available times →
                    </span>
                  </div>
                </a>

                <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Email Us</h3>
                    <a href="mailto:hello@meetcursive.com" className="text-[#007AFF] hover:underline">
                      hello@meetcursive.com
                    </a>
                    <p className="text-gray-600 text-sm mt-1">We respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Live Chat</h3>
                    <p className="text-gray-600 text-sm">
                      Available Monday-Friday, 9am-6pm EST
                    </p>
                    <button className="text-[#007AFF] text-sm mt-2 hover:underline">
                      Start chat →
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Response Time</h3>
                    <p className="text-gray-600 text-sm">
                      Support inquiries: Within 24 hours<br />
                      Sales inquiries: Within 4 hours<br />
                      Emergency support: Same day
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Headquarters</h3>
                    <p className="text-gray-600 text-sm">
                      San Francisco, CA<br />
                      United States
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  We're a remote-first company with team members across the US.
                </p>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* FAQ Preview */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Quick
              <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                Answers
              </span>
            </h2>
            <p className="text-xl text-gray-600">Common questions we get asked</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-gray-900 mb-2">How fast can we start?</h3>
              <p className="text-gray-600 text-sm">
                <span className="font-cursive text-base text-gray-500">Cursive</span> Data: 5-7 days. Outbound: 1-2 weeks. Pipeline: 2-3 weeks.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 text-sm">
                Yes. All plans are month-to-month with 30 days notice.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-gray-900 mb-2">Do you offer custom plans?</h3>
              <p className="text-gray-600 text-sm">
                Absolutely. We build custom solutions for enterprise needs.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button size="lg" href="/faq" variant="outline">
              View All FAQs
            </Button>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white">
        <Container>
          <div className="bg-[#007AFF] rounded-3xl p-12 text-center text-white shadow-lg max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-light mb-4">
              Prefer to Talk Live?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Book a 15-minute call and we'll answer all your questions.
            </p>
            <Button
              size="lg"
              className="bg-white text-[#007AFF] hover:bg-gray-100"
              href="https://cal.com/adamwolfe/cursive-ai-audit"
              target="_blank"
            >
              Book a Call Now
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}
