"use client"

import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft, Check, X, ShieldCheck, AlertTriangle } from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"
import Link from "next/link"

const faqs = [
  {
    question: "Is website visitor identification legal under GDPR?",
    answer: "Yes, website visitor identification is legal under GDPR when you have the right legal basis in place. You can use either explicit consent (opt-in via a cookie/tracking banner) or legitimate interests (with a documented Legitimate Interests Assessment). The key is that you must disclose visitor identification technology in your privacy policy, provide an opt-out mechanism, and sign a Data Processing Agreement with your vendor. Doing it without these steps is where most companies run into compliance risk."
  },
  {
    question: "Does RB2B work in Europe and identify EU visitors?",
    answer: "No. RB2B is a US-only person-level identification tool. It explicitly does not perform person-level identification of EU or UK visitors. RB2B acknowledges this limitation themselves — they built the product for the US market under US privacy laws, which are far less restrictive than GDPR. If a significant portion of your website visitors come from the EU, UK, or other non-US regions, RB2B will show you nothing for that traffic at the person level. This is both a compliance shortcut and a massive data gap that costs you real pipeline."
  },
  {
    question: "Can I use legitimate interests as the legal basis for visitor identification?",
    answer: "Yes, legitimate interests (Art. 6(1)(f) GDPR) is a valid legal basis for B2B visitor identification when properly documented. The key conditions are: (1) you have a genuine legitimate interest in identifying business visitors for commercial outreach, (2) the processing is necessary for that purpose, and (3) the individual's privacy rights don't override your interests — which for B2B professionals receiving relevant business outreach, generally holds. You must document a Legitimate Interests Assessment (LIA) and make it available on request. For consumer/B2C sites, this basis is much harder to justify."
  },
  {
    question: "What is a Data Processing Agreement and do I need one for visitor identification?",
    answer: "A Data Processing Agreement (DPA) is a contract required under GDPR Art. 28 between you (the data controller) and any third-party vendor (the data processor) that handles personal data on your behalf. A visitor identification pixel absolutely constitutes processing of personal data, so yes — you need a DPA with your vendor. Reputable tools like Cursive provide a DPA on request. Tools that cannot provide a DPA or refuse to sign one are a legal liability."
  },
  {
    question: "Should I block the visitor identification pixel until consent is given?",
    answer: "For EU and UK visitors, yes — under GDPR's ePrivacy Directive (the 'cookie law'), non-essential tracking technologies generally require prior informed consent before they can fire. A Consent Management Platform (CMP) can automatically block the pixel until a visitor clicks Accept on your cookie banner. This is exactly how Cursive's own marketing site works: Google Analytics, RB2B pixel, and the AudienceLab SuperPixel are all blocked behind a consent gate and only load after the visitor explicitly accepts."
  },
  {
    question: "Is company-level identification subject to GDPR?",
    answer: "Company data by itself is not personal data under GDPR — GDPR protects natural persons, not legal entities. Tools that identify visiting companies (IP-to-company resolution) generally operate in a lower-risk compliance zone than tools that identify specific individuals. Person-level identification — resolving a visit to a named individual with their email address and job title — is clearly personal data and requires a valid legal basis. This is why RB2B's EU 'workaround' of only showing company data for European visitors technically sidesteps GDPR, but also completely eliminates the primary value of person-level identification."
  },
  {
    question: "How does Cursive handle GDPR compliance for visitor identification?",
    answer: "Cursive is built with GDPR compliance as a core requirement, not an afterthought. Our marketing site uses a Consent Management Tool that blocks all non-essential tracking (analytics, RB2B pixel, AudienceLab SuperPixel) until the visitor explicitly accepts. We maintain timestamped consent records per visitor. We provide a Data Processing Agreement (DPA) to all customers on request. We have a documented Legitimate Interests Assessment available for B2B use cases. We support full opt-outs via privacy@meetcursive.com. And critically, we perform global identification including EU, UK, and APAC visitors — not by bypassing GDPR, but by doing it properly with the right infrastructure."
  }
]

const relatedPosts = [
  {
    href: "/blog/cursive-vs-rb2b",
    title: "Cursive vs RB2B: Full Comparison",
    description: "Why global B2B teams choose Cursive over RB2B's US-only approach.",
    category: "Comparisons"
  },
  {
    href: "/blog/international-website-visitor-identification",
    title: "International Visitor Identification Guide",
    description: "Identify EU, UK, and APAC visitors — not just US traffic.",
    category: "Visitor ID"
  },
  {
    href: "/blog/rb2b-alternative",
    title: "Best RB2B Alternatives (2026)",
    description: "10 GDPR-ready tools that outperform RB2B for global teams.",
    category: "Comparisons"
  },
]

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateFAQSchema({ faqs })} />
      <StructuredData data={generateBlogPostSchema({ title: "GDPR-Compliant Website Visitor Identification: The Complete Guide (2026)", description: "Most visitor identification tools violate GDPR by default. Learn which tools are truly GDPR compliant, why US-only tools are a legal risk for EU businesses, and how to identify visitors without violating EU law.", author: "Cursive Team", publishDate: "2026-02-24", image: "https://www.meetcursive.com/cursive-logo.png" })} />

      <HumanView>
        {/* Header */}
        <section className="py-12 bg-white">
          <Container>
            <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            <div className="max-w-4xl">
              <div className="inline-block px-3 py-1 bg-primary text-white rounded-full text-sm font-medium mb-4">
                Compliance
              </div>
              <h1 className="text-5xl font-bold mb-6">
                GDPR-Compliant Website Visitor Identification: The Complete Guide (2026)
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Most visitor identification tools are built for the US market — and when deployed globally, they either
                skip EU visitors entirely or quietly create GDPR liability. Here is how to do it right.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>February 24, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>11 min read</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Article Content */}
        <section className="py-16 bg-white">
          <Container>
            <article className="max-w-3xl mx-auto prose prose-lg prose-blue">

              <p>
                <Link href="/visitor-identification">Website visitor identification</Link> is one of the most
                powerful tools in modern B2B sales — resolving anonymous website traffic to named individuals
                and companies, so your team can follow up with genuine intent data. But in Europe, it comes with
                a compliance minefield that trips up most companies.
              </p>

              <p>
                The uncomfortable truth: <strong>the majority of popular visitor identification tools either violate
                GDPR by default or sidestep it entirely by simply refusing to identify EU visitors at the
                person level.</strong> Neither approach is acceptable if you are a global company or an EU-based
                business trying to generate pipeline from your website traffic.
              </p>

              <p>
                This guide explains exactly what GDPR requires, why so many tools fall short, what to look for
                in a genuinely compliant solution, and how to implement visitor identification without putting
                your legal team on edge.
              </p>

              {/* Section 1 */}
              <h2>Why Most Visitor Identification Tools Fail GDPR</h2>

              <p>
                GDPR (General Data Protection Regulation) applies whenever you process personal data of individuals
                in the European Economic Area — regardless of where your company is headquartered. An American
                SaaS company whose pixel fires on an EU resident&apos;s browser is subject to GDPR.
              </p>

              <p>
                Most visitor identification tools were built by US companies for US companies, using data
                infrastructure built around US privacy norms — which are dramatically more permissive than
                the EU&apos;s. When these companies encounter GDPR, they typically take one of three approaches,
                all of which are problematic:
              </p>

              <div className="not-prose bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 my-8 border border-red-200">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  The Three Compliance Failure Modes
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-bold text-red-800">1. Fire everywhere, document nothing</p>
                    <p className="text-gray-700">The pixel runs unconditionally. No consent gate, no privacy policy disclosure, no DPA with customers. This is the most common — and most legally exposed — approach.</p>
                  </div>
                  <div>
                    <p className="font-bold text-red-800">2. Just skip EU visitors (the &ldquo;US-only&rdquo; workaround)</p>
                    <p className="text-gray-700">Tools like RB2B explicitly limit person-level identification to US IP addresses. This technically avoids GDPR liability for person-level processing but completely destroys the value of the tool for EU traffic. You pay the same price and see nothing for European visitors.</p>
                  </div>
                  <div>
                    <p className="font-bold text-red-800">3. Claim consent without proper gating</p>
                    <p className="text-gray-700">The privacy policy mentions &ldquo;cookies and tracking&rdquo; somewhere, but the pixel fires immediately on page load regardless of consent state. Recording a consent decision after the fact does not satisfy GDPR&apos;s prior consent requirement for non-essential tracking.</p>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <h2>The US-Only Problem: A Legal and Commercial Trap</h2>

              <p>
                RB2B is the most prominent example of a tool that explicitly chose US-only person-level
                identification as its GDPR strategy. On their support documentation, they state this directly:
                person-level identification is limited to US-based visitors.
              </p>

              <p>
                For a US-only company with exclusively US traffic, this is a usable solution. For everyone else,
                it creates two simultaneous problems:
              </p>

              <ol>
                <li>
                  <strong>You still have GDPR exposure.</strong> Even though RB2B doesn&apos;t perform person-level EU
                  identification, the pixel itself still fires on EU visitors&apos; browsers. Depending on what signals
                  it collects and transmits even at the company-level, there may still be GDPR obligations — particularly
                  around IP address processing (which the CJEU has ruled constitutes personal data for dynamic IPs).
                </li>
                <li>
                  <strong>You lose all EU pipeline.</strong> If 30–60% of your website traffic comes from Europe —
                  which is typical for B2B SaaS companies with global markets — you are leaving that entire segment
                  completely dark. No person-level identification, no outreach, no pipeline from a substantial
                  portion of your total addressable market.
                </li>
              </ol>

              <div className="not-prose bg-blue-50 rounded-xl p-6 my-8 border border-blue-200">
                <h3 className="font-bold text-base mb-2">Real Cost Illustration</h3>
                <p className="text-sm text-gray-700">
                  If your website gets 10,000 monthly visitors and 40% are from Europe, a US-only tool identifies
                  visitors from 6,000 of them at best. Cursive&apos;s 70% identification rate across global traffic
                  means identifying up to 7,000 visitors — including the 4,000 EU visitors the US-only tool
                  ignores entirely. At typical B2B deal values, that&apos;s not a minor gap.
                </p>
              </div>

              {/* Section 3 */}
              <h2>GDPR Legal Bases for Visitor Identification</h2>

              <p>
                GDPR (Art. 6) requires a valid legal basis for any processing of personal data. For
                <Link href="/visitor-identification"> visitor identification</Link>, two bases are most relevant:
              </p>

              <h3>Option 1: Explicit Consent (Art. 6(1)(a))</h3>
              <p>
                The visitor must actively opt in before the pixel fires. This typically means a cookie consent
                banner that presents clear choices — and the identification pixel only loads after the visitor
                clicks &ldquo;Accept.&rdquo;
              </p>
              <ul>
                <li>Must be freely given, specific, informed, and unambiguous</li>
                <li>Granular — visitors must be able to accept analytics without accepting visitor identification, or vice versa</li>
                <li>Withdrawal must be as easy as granting consent</li>
                <li>You must maintain timestamped records of consent decisions</li>
                <li>Silence, pre-ticked boxes, or continued browsing do NOT constitute valid consent</li>
              </ul>

              <h3>Option 2: Legitimate Interests (Art. 6(1)(f))</h3>
              <p>
                For B2B contexts, legitimate interests can be a valid basis for visitor identification — but only
                when you have properly documented it with a Legitimate Interests Assessment (LIA). The three-part
                test:
              </p>
              <ol>
                <li><strong>Purpose test:</strong> Do you have a genuine, specific legitimate interest? (B2B marketing and lead generation — yes)</li>
                <li><strong>Necessity test:</strong> Is the processing necessary for that purpose? (Visitor identification is the most direct method — yes)</li>
                <li><strong>Balancing test:</strong> Do the individual&apos;s privacy interests override yours? For B2B professionals receiving relevant commercial outreach in their professional capacity, this is generally defensible — but you must document the reasoning</li>
              </ol>

              <div className="not-prose bg-amber-50 rounded-xl p-5 my-6 border border-amber-200">
                <p className="text-sm font-medium text-amber-800">
                  <strong>Important:</strong> Legitimate interests is harder to justify for B2C sites, sensitive
                  categories of data, or systematic profiling. For standard B2B SaaS identifying business professionals
                  visiting a commercial website, it is the most common and defensible approach — when documented properly.
                </p>
              </div>

              {/* Section 4 */}
              <h2>What to Look for in a GDPR-Compliant Visitor Identification Tool</h2>

              <p>
                Not all tools market their compliance capabilities equally. Here are the six questions to ask
                before deploying any visitor identification pixel:
              </p>

              <div className="not-prose space-y-4 my-8">
                {[
                  { num: "1", title: "Do they provide a Data Processing Agreement (DPA)?", body: "Required under GDPR Art. 28. Any vendor that processes personal data on your behalf must sign a DPA. If they can't or won't, that's a legal red flag." },
                  { num: "2", title: "Do they support Consent Management Platform (CMP) integration?", body: "The pixel should be blockable via a CMP so it doesn't fire until consent is given. Standard with quality tools — absent from many US-only platforms." },
                  { num: "3", title: "Do they maintain Standard Contractual Clauses (SCCs) for EU→US transfers?", body: "Personal data flowing from EU users to US servers requires SCCs or equivalent safeguards post-Schrems II. Verify your vendor has these in place." },
                  { num: "4", title: "Is a Legitimate Interests Assessment (LIA) available?", body: "For customers relying on legitimate interests as their legal basis, the vendor should be able to provide documentation supporting this position." },
                  { num: "5", title: "Is there a right to erasure / opt-out mechanism?", body: "GDPR grants individuals the right to object to data processing and request erasure. Your vendor must support this workflow." },
                  { num: "6", title: "Does it actually identify EU visitors at the person level?", body: "This is the commercial test. A tool that achieves GDPR compliance by simply not identifying EU visitors has solved the legal problem by eliminating the product value." },
                ].map(item => (
                  <div key={item.num} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {item.num}
                    </div>
                    <div>
                      <p className="font-bold text-sm mb-1">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 5: Tool Comparison */}
              <h2>GDPR Compliance Comparison: Major Visitor ID Tools</h2>

              <div className="not-prose overflow-x-auto my-8">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      <th className="border border-gray-700 p-3 text-left">Tool</th>
                      <th className="border border-gray-700 p-3 text-center">Global Person ID</th>
                      <th className="border border-gray-700 p-3 text-center">CMP Support</th>
                      <th className="border border-gray-700 p-3 text-center">DPA Available</th>
                      <th className="border border-gray-700 p-3 text-center">Consent Records</th>
                      <th className="border border-gray-700 p-3 text-center">EU-Ready</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="bg-blue-50 border-2 border-blue-500">
                      <td className="border border-gray-300 p-3 font-bold">Cursive</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600 font-bold">✓ Yes</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600 font-bold">✓ Yes</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600 font-bold">✓ Yes</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600 font-bold">✓ Yes</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600 font-bold">✓ Yes</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-bold">RB2B</td>
                      <td className="border border-gray-300 p-3 text-center text-red-600 font-bold">✗ US-only</td>
                      <td className="border border-gray-300 p-3 text-center text-orange-600">~ Partial</td>
                      <td className="border border-gray-300 p-3 text-center text-orange-600">~ Limited</td>
                      <td className="border border-gray-300 p-3 text-center text-red-600 font-bold">✗ No</td>
                      <td className="border border-gray-300 p-3 text-center text-red-600 font-bold">✗ No person-level</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-bold">Warmly</td>
                      <td className="border border-gray-300 p-3 text-center text-orange-600">~ Limited</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600">✓ Yes</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600">✓ Yes</td>
                      <td className="border border-gray-300 p-3 text-center text-orange-600">~ Partial</td>
                      <td className="border border-gray-300 p-3 text-center text-orange-600">~ Company-only EU</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-bold">Leadfeeder</td>
                      <td className="border border-gray-300 p-3 text-center text-orange-600">Company only</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600">✓ Yes</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600">✓ Yes</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600">✓ Yes</td>
                      <td className="border border-gray-300 p-3 text-center text-orange-600">Company only</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-bold">Lead Forensics</td>
                      <td className="border border-gray-300 p-3 text-center text-orange-600">Company only</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600">✓ Yes</td>
                      <td className="border border-gray-300 p-3 text-center text-green-600">✓ Yes</td>
                      <td className="border border-gray-300 p-3 text-center text-orange-600">~ Partial</td>
                      <td className="border border-gray-300 p-3 text-center text-orange-600">Company only</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                Notice the pattern: the tools that achieve broad EU compliance do so by only identifying companies —
                not individual people. Only Cursive provides both global person-level identification and
                the compliance infrastructure to support it legally. RB2B&apos;s approach is not GDPR
                compliance — it is GDPR avoidance by product design, at the cost of EU pipeline.
              </p>

              {/* Section 6: How Cursive handles GDPR */}
              <h2>How Cursive Approaches GDPR Compliance</h2>

              <p>
                Cursive is built for global B2B teams. That means GDPR compliance is not an edge case — it is a
                core product requirement. Here is what we do:
              </p>

              <div className="not-prose space-y-3 my-6">
                {[
                  { icon: "🔒", title: "Consent-gated pixel loading", body: "Our marketing site uses a Consent Management Tool that blocks all non-essential tracking — Google Analytics, visitor identification pixels — until the visitor explicitly clicks Accept. The pixel never fires before consent." },
                  { icon: "📋", title: "Timestamped consent records", body: "We record the date, time, and version of the consent notice presented, stored in browser localStorage and available for audit on request." },
                  { icon: "📝", title: "Data Processing Agreement on request", body: "All Cursive customers can request a DPA covering our processing of personal data as part of the identification service." },
                  { icon: "⚖️", title: "Legitimate Interests Assessment available", body: "For customers who rely on legitimate interests as their GDPR legal basis, we can provide supporting documentation for review by your legal team." },
                  { icon: "🌍", title: "Global identification — not a US-only workaround", body: "We identify visitors from the EU, UK, Canada, and APAC with the same person-level precision as US visitors, using infrastructure built to process international data with appropriate safeguards." },
                  { icon: "✉️", title: "Opt-out and erasure support", body: "Individuals can request removal from our identification database by emailing privacy@meetcursive.com. We honor these requests." },
                ].map(item => (
                  <div key={item.title} className="flex gap-3 p-4 bg-white rounded-xl border border-gray-200">
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-bold text-sm mb-1">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 7: 5 Steps */}
              <h2>5 Steps to Make Your Visitor Identification GDPR Compliant</h2>

              <p>
                Whether you are implementing visitor identification for the first time or auditing an existing
                deployment, these five steps ensure you are covered:
              </p>

              <div className="not-prose space-y-4 my-8">
                {[
                  { step: "Step 1", title: "Install a CMP and gate your pixel behind consent", desc: "Deploy a Consent Management Platform (or use a tool with built-in CMP integration). Configure it so your visitor identification pixel only loads after the visitor clicks Accept on your cookie/tracking banner. Never fire the pixel on page load unconditionally." },
                  { step: "Step 2", title: "Update your privacy policy to disclose visitor identification", desc: "Add a specific section explaining that you use visitor identification technology, what data is collected, why (your legal basis), which third parties are involved, and how visitors can opt out. Generic 'we use cookies' language is not sufficient." },
                  { step: "Step 3", title: "Document your legitimate interests basis (or confirm you have consent)", desc: "Write a Legitimate Interests Assessment documenting your purpose, why it's necessary, and the balancing test outcome. Keep it on file — supervisory authorities can request it." },
                  { step: "Step 4", title: "Sign a Data Processing Agreement with your vendor", desc: "Request a DPA from your visitor identification provider. If they can't provide one, find a different vendor. This is a non-negotiable legal requirement under GDPR Art. 28." },
                  { step: "Step 5", title: "Implement an opt-out and erasure mechanism", desc: "Publish a clear opt-out path in your privacy policy (email address, web form, or browser-level mechanism). Test that it actually works — honoring the right to erasure is an enforceable obligation." },
                ].map(item => (
                  <div key={item.step} className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="bg-primary text-white rounded-full w-16 h-8 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-bold mb-1">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom CTA */}
              <h2>See Cursive&apos;s GDPR-Compliant Identification in Action</h2>

              <p>
                If your current visitor identification setup is US-only, lacks a DPA, or fires unconditionally
                without consent gating — you have both a compliance gap and a pipeline gap. Cursive solves both.
                Get a free <Link href="/free-audit">visitor identification audit</Link> to see what you are missing
                from your EU and global traffic.
              </p>

            </article>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto mt-16">
              <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <details key={i} className="group bg-white rounded-xl border border-gray-200 p-6 cursor-pointer">
                    <summary className="font-semibold text-gray-900 list-none flex items-center justify-between gap-4">
                      {faq.question}
                      <span className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0">▼</span>
                    </summary>
                    <p className="mt-4 text-gray-600 leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="max-w-3xl mx-auto mt-16">
              <DashboardCTA
                headline="Get Your Free Visitor Identification Audit"
                description="See exactly how many visitors you're missing — from the EU, UK, and beyond. No commitment, full insight."
                ctaText="Get My Free Audit"
                ctaUrl="/free-audit"
              />
            </div>

            {/* Related Posts */}
            <div className="max-w-3xl mx-auto mt-16">
              <SimpleRelatedPosts posts={relatedPosts} />
            </div>
          </Container>
        </section>
      </HumanView>

      <MachineView>
        <MachineContent>
          <MachineSection title="Page Overview">
            <p>Comprehensive guide to GDPR-compliant website visitor identification for B2B companies. Covers legal requirements, tool comparison (Cursive vs RB2B and others), and implementation steps.</p>
          </MachineSection>
          <MachineSection title="Key Finding">
            <p>Most visitor identification tools fail GDPR in one of three ways: fire everywhere without consent, skip EU visitors entirely (RB2B's approach), or claim consent without proper gating. Only Cursive combines global person-level identification with full GDPR compliance infrastructure.</p>
          </MachineSection>
          <MachineSection title="GDPR Legal Bases for Visitor Identification">
            <MachineList items={[
              "Explicit Consent (Art. 6(1)(a)): Visitor must opt in before pixel fires; requires CMP integration",
              "Legitimate Interests (Art. 6(1)(f)): Valid for B2B marketing with documented LIA; three-part test: purpose, necessity, balancing",
            ]} />
          </MachineSection>
          <MachineSection title="Why US-Only Tools Fail EU Teams">
            <p>RB2B explicitly limits person-level identification to US IP addresses. For companies with 30-60% EU traffic, this means paying for a tool that delivers zero person-level pipeline from a major market segment. It is also not a complete GDPR solution — the pixel itself still fires on EU visitors' browsers.</p>
          </MachineSection>
          <MachineSection title="How Cursive Handles GDPR">
            <MachineList items={[
              "Consent-gated pixel: tracking only loads after explicit visitor acceptance",
              "Timestamped consent records maintained per visitor",
              "DPA available to all customers on request",
              "Legitimate Interests Assessment available for legal review",
              "Global person-level identification: EU, UK, Canada, APAC coverage",
              "Opt-out via privacy@meetcursive.com",
            ]} />
          </MachineSection>
          <MachineSection title="5 Implementation Steps">
            <MachineList items={[
              "Install a CMP and gate your pixel behind consent",
              "Update your privacy policy to disclose visitor identification technology",
              "Document your legitimate interests basis or confirm consent workflow",
              "Sign a Data Processing Agreement with your vendor",
              "Implement an opt-out and erasure mechanism",
            ]} />
          </MachineSection>
          <MachineSection title="Related Resources">
            <MachineList items={relatedPosts.map(p => p.title)} />
            <MachineLink href="/free-audit">Get a free visitor identification audit</MachineLink>
            <MachineLink href="/visitor-identification">Cursive visitor identification platform</MachineLink>
            <MachineLink href="/privacy">Cursive Privacy Policy (with consent management details)</MachineLink>
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
