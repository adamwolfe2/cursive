"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export default function AboutPage() {
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
              We Got Tired of Bad Lead Data
              <span className="block font-cursive text-6xl lg:text-7xl text-gray-900 mt-2">
                So We Built Something Better
              </span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              <span className="font-cursive text-2xl text-gray-900">Cursive</span> started because we were tired of paying for lead lists that didn't convert.
              Outdated contacts. Generic emails. No personalization. No results.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <p className="text-xl text-gray-700 leading-relaxed">
                So we built what we wished existed: verified data, AI-powered outreach, and done-for-you campaigns that actually work.
              </p>

              <p className="text-xl text-gray-700 leading-relaxed">
                Today, <span className="font-cursive text-2xl text-gray-900">Cursive</span> powers pipeline for hundreds of B2B companies—from bootstrapped startups
                to growth-stage companies scaling fast.
              </p>

              <p className="text-xl text-gray-700 leading-relaxed">
                We don't sell software. We sell results.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Our Mission
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Make Lead Gen Effortless
              </span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-700 text-center leading-relaxed mb-12">
              Every company deserves access to high-quality leads without hiring an army of BDRs
              or stitching together 10 tools.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 text-center border border-gray-200"
              >
                <div className="w-16 h-16 bg-[#007AFF] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-light">1</span>
                </div>
                <h3 className="text-xl font-light text-gray-900 mb-3">Buy the Data</h3>
                <p className="text-gray-600">
                  Get verified lead lists and run campaigns yourself
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-8 text-center border border-gray-200"
              >
                <div className="w-16 h-16 bg-[#007AFF] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-light">2</span>
                </div>
                <h3 className="text-xl font-light text-gray-900 mb-3">Let Us Run It</h3>
                <p className="text-gray-600">
                  Done-for-you campaigns, managed end-to-end
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-8 text-center border border-gray-200"
              >
                <div className="w-16 h-16 bg-[#007AFF] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-light">3</span>
                </div>
                <h3 className="text-xl font-light text-gray-900 mb-3">Full Pipeline</h3>
                <p className="text-gray-600">
                  We build your entire pipeline, AI-powered and automated
                </p>
              </motion.div>
            </div>

            <p className="text-center text-xl text-gray-700 mt-12">
              Whatever stage you're at, we meet you there.
            </p>
          </div>
        </Container>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Our
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Values
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                <div className="w-3 h-3 bg-[#007AFF] rounded-full" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3">Speed Over Perfection</h3>
              <p className="text-gray-600 leading-relaxed">
                We ship fast, test fast, and iterate fast. Your pipeline can't wait for perfect.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                <div className="w-3 h-3 bg-[#007AFF] rounded-full" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3">Quality Over Quantity</h3>
              <p className="text-gray-600 leading-relaxed">
                We'd rather send you 100 perfect leads than 10,000 garbage contacts.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                <div className="w-3 h-3 bg-[#007AFF] rounded-full" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3">Transparency Always</h3>
              <p className="text-gray-600 leading-relaxed">
                No hidden fees. No long contracts. No nonsense.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Who
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                We Are
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're a team of growth operators, data engineers, and AI builders who've lived
              the pain of bad lead gen.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-12 max-w-4xl mx-auto border border-gray-200 text-center">
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              Started by founders who were tired of wasting money on bad data and ineffective outbound tools.
              We built <span className="font-cursive text-2xl text-gray-900">Cursive</span> to solve our own problem—then realized every B2B company faces the same challenges.
            </p>
            <p className="text-xl text-gray-700 leading-relaxed">
              Now we're on a mission to make high-quality lead generation accessible to every company,
              regardless of size or budget.
            </p>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="bg-[#007AFF] rounded-3xl p-12 text-center text-white shadow-lg max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-light mb-4">
              Let's Build Your Pipeline
              <span className="block font-cursive text-5xl lg:text-6xl mt-2">
                Together
              </span>
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Book a call and we'll show you exactly how <span className="font-cursive text-2xl">Cursive</span> can transform your lead generation.
            </p>
            <Button
              size="lg"
              className="bg-white text-[#007AFF] hover:bg-gray-100"
              href="https://cal.com/adamwolfe/cursive-ai-audit"
              target="_blank"
            >
              Book a Call
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}
