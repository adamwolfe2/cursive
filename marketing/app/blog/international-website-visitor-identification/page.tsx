"use client"

import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft, Check, X, Globe } from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"
import Link from "next/link"

const faqs = [
  {
    question: "Can website visitor identification tools identify people outside the US?",
    answer: "Yes — but most popular tools cannot. Tools like RB2B explicitly limit person-level identification to US-based IP addresses. They do not identify individual visitors from the EU, UK, Canada, or APAC at the person level. Cursive is one of the few visitor identification platforms that performs global person-level identification, covering EU, UK, Canada, and APAC visitors with the same precision as US traffic."
  },
  {
    question: "Why do most visitor identification tools only work for US traffic?",
    answer: "Two reasons. First, the largest commercial identity graphs — the databases that match anonymous visitors to known contact records — are predominantly built on US consumer and business data. Non-US identity data is harder to license and integrate at scale. Second, person-level identification of EU and UK residents triggers GDPR compliance requirements that many US-focused vendors have avoided by simply not processing non-US traffic at the person level. It is a shortcut that trades international pipeline for legal simplicity."
  },
  {
    question: "How does Cursive identify visitors from the EU and UK?",
    answer: "Cursive uses a multi-method identification approach that works across geographies: IP intelligence for company-level identification worldwide, device fingerprinting and behavioral signals that are not geographically constrained, and a proprietary identity resolution layer that includes international B2B data. For EU and UK visitors, Cursive applies proper consent management and GDPR-compliant data processing — meaning identification only fires for users who have consented or where legitimate interests are properly documented."
  },
  {
    question: "Is it legal to identify website visitors in the EU?",
    answer: "Yes, with the right legal framework. Under GDPR, you need either explicit consent or a documented legitimate interests basis for person-level visitor identification. This requires a cookie consent banner that gates the tracking pixel, a Data Processing Agreement with your vendor, and a privacy policy that discloses the technology. Cursive supports all of these requirements. The alternative — simply not identifying EU visitors — is legally safe but commercially very costly."
  },
  {
    question: "What percentage of my website traffic typically comes from outside the US?",
    answer: "For B2B SaaS companies with international markets, 30–60% of website traffic commonly originates outside the US. For European SaaS companies, the majority of traffic may come from the UK, Germany, France, and other EU countries. If your visitor identification tool is US-only, you are operating with a massive blind spot. You can verify your geographic traffic distribution in Google Analytics under Reports > Demographics."
  },
  {
    question: "Do I need a different tool for each country or region?",
    answer: "No. Cursive provides a single platform that identifies visitors globally — US, EU, UK, Canada, and APAC — without requiring separate regional tools. One pixel installation handles all geographies, with compliance infrastructure (consent management, DPA, SCCs) built in to support international deployments."
  },
  {
    question: "How does international visitor identification affect ROI?",
    answer: "The ROI impact is proportional to your international traffic share. If 40% of your visitors are from Europe and your current tool misses all of them, you are generating less than 60% of the pipeline you could. At a typical B2B deal value of $20,000–$50,000 ARR, identifying even 10–20 additional international prospects per month from visitors who were previously invisible represents significant revenue upside. Cursive's free audit shows you exactly what you are currently missing from non-US traffic."
  }
]

const relatedPosts = [
  {
    href: "/blog/gdpr-compliant-visitor-identification",
    title: "GDPR-Compliant Visitor Identification Guide",
    description: "How to identify EU and UK visitors legally — and why US-only tools create compliance gaps.",
    category: "Compliance"
  },
  {
    href: "/blog/cursive-vs-rb2b",
    title: "Cursive vs RB2B: Full Comparison",
    description: "Side-by-side comparison — global identification, pricing, features, GDPR compliance.",
    category: "Comparisons"
  },
  {
    href: "/blog/rb2b-alternative",
    title: "Best RB2B Alternatives (2026)",
    description: "Tools with global identification that work beyond US-only traffic.",
    category: "Comparisons"
  },
]

const regions = [
  {
    region: "European Union",
    flag: "🇪🇺",
    regulation: "GDPR",
    personLevelPossible: true,
    rb2bSupport: "Company only",
    cursiveSupport: "Full person-level",
    notes: "Requires consent or documented legitimate interests. DPA required.",
  },
  {
    region: "United Kingdom",
    flag: "🇬🇧",
    regulation: "UK GDPR",
    personLevelPossible: true,
    rb2bSupport: "Company only",
    cursiveSupport: "Full person-level",
    notes: "Post-Brexit UK GDPR mirrors EU GDPR. Same requirements apply.",
  },
  {
    region: "Canada",
    flag: "🇨🇦",
    regulation: "PIPEDA / Law 25",
    personLevelPossible: true,
    rb2bSupport: "Limited",
    cursiveSupport: "Full person-level",
    notes: "Federal PIPEDA plus Quebec's Law 25 (strict). Consent required.",
  },
  {
    region: "Australia",
    flag: "🇦🇺",
    regulation: "Privacy Act",
    personLevelPossible: true,
    rb2bSupport: "✗ No",
    cursiveSupport: "Full person-level",
    notes: "Australian Privacy Principles apply. Less restrictive than GDPR.",
  },
  {
    region: "United States",
    flag: "🇺🇸",
    regulation: "CCPA (CA) / state laws",
    personLevelPossible: true,
    rb2bSupport: "Full person-level",
    cursiveSupport: "Full person-level",
    notes: "Most permissive major market. Both tools work well.",
  },
]

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateFAQSchema({ faqs })} />
      <StructuredData data={generateBlogPostSchema({ title: "International Website Visitor Identification: EU, UK & APAC Guide (2026)", description: "Most visitor ID tools only work for US traffic. Learn how to identify website visitors from the EU, UK, Canada, and APAC with compliant, global person-level identification.", author: "Cursive Team", publishDate: "2026-02-24", image: "https://www.meetcursive.com/cursive-logo.png" })} />

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
                Visitor Identification
              </div>
              <h1 className="text-5xl font-bold mb-6">
                International Website Visitor Identification: EU, UK & APAC Guide (2026)
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                If your visitor identification tool is US-only, you are blind to 30–60% of your website traffic.
                Here is how global person-level identification works — and why it matters for your pipeline.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>February 24, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>10 min read</span>
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
                <Link href="/visitor-identification">Website visitor identification</Link> has become a core
                capability for B2B sales teams. The ability to see which companies — and which individuals —
                are browsing your pricing page, reading your case studies, or comparing your product against
                competitors is genuinely transformative for pipeline generation.
              </p>

              <p>
                But most teams using visitor identification tools are operating with a massive, invisible blind spot:
                <strong> their tool only works on US traffic.</strong>
              </p>

              <p>
                This is not a minor edge case. For the average B2B SaaS company, 30–50% of website visitors
                come from outside the United States. For European companies or those with strong UK, DACH, or
                APAC markets, the non-US share can exceed 60%. If your identification tool silently skips all
                of that traffic — or only provides company-level data for non-US visitors — you are leaving
                enormous pipeline potential on the table.
              </p>

              {/* The Problem */}
              <h2>The US-Only Problem: Why Most Tools Fail International Teams</h2>

              <p>
                When RB2B launched, it made website visitor identification accessible to smaller B2B teams at
                an affordable price point. But RB2B is explicitly and intentionally a US-only product.
                Their documentation states this directly: person-level identification is limited to US-based
                visitors. EU, UK, and APAC visitors appear only at the company level — if at all.
              </p>

              <div className="not-prose bg-red-50 rounded-xl p-6 my-8 border border-red-200">
                <h3 className="font-bold text-base mb-3 text-red-800">What &ldquo;US-Only&rdquo; Actually Means for Your Pipeline</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Imagine your website gets 10,000 monthly visitors:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><span>🇺🇸</span> <span><strong>6,000 US visitors</strong> — RB2B can identify these at the person level (at ~50–60% match rate = 3,000–3,600 identified)</span></li>
                  <li className="flex gap-2"><span>🇪🇺</span> <span><strong>2,500 EU visitors</strong> — RB2B shows nothing. Zero person-level identification.</span></li>
                  <li className="flex gap-2"><span>🇬🇧</span> <span><strong>900 UK visitors</strong> — RB2B shows nothing. Zero person-level identification.</span></li>
                  <li className="flex gap-2"><span>🌏</span> <span><strong>600 APAC visitors</strong> — RB2B shows nothing. Zero person-level identification.</span></li>
                </ul>
                <p className="text-sm font-medium text-red-700 mt-3">
                  That&apos;s 4,000 potential prospects — 40% of your traffic — completely invisible.
                </p>
              </div>

              <p>
                With Cursive&apos;s 70% global identification rate, that same 10,000 visitors yields up to
                7,000 identified prospects — including the EU, UK, and APAC visitors who are completely
                invisible to US-only tools.
              </p>

              {/* Why Tools Are US-Only */}
              <h2>Why Most Tools Are US-Only (And Why That Is Changing)</h2>

              <p>
                The US-only limitation is not arbitrary — it reflects real technical and legal challenges:
              </p>

              <h3>Identity Graph Coverage</h3>
              <p>
                Visitor identification works by matching anonymous browser sessions to known contact records
                using identity graphs — massive databases of resolved identities. The largest identity graphs
                in existence are predominantly built on US consumer and business data. US data is more
                abundant, more readily licensed, and more easily enriched with contact information.
              </p>
              <p>
                Building equivalent identity graph coverage for EU, UK, and APAC markets requires investing
                in different data sources, navigating different regulatory frameworks, and building
                infrastructure that most early-stage visitor ID tools simply have not prioritized.
              </p>

              <h3>Regulatory Complexity</h3>
              <p>
                Processing personal data of EU residents triggers GDPR. For UK residents, UK GDPR applies.
                Canada has PIPEDA and Quebec&apos;s strict Law 25. Australia has the Privacy Act.
                Each jurisdiction requires different consent mechanisms, data processing agreements,
                and cross-border transfer safeguards.
              </p>
              <p>
                For a US-focused tool, the path of least resistance is simply not to identify non-US visitors
                at the person level — no compliance exposure, no infrastructure investment. The cost is paid
                entirely by customers who have non-US traffic.
              </p>

              {/* Coverage by Region */}
              <h2>International Visitor Identification: Coverage by Region</h2>

              <div className="not-prose overflow-x-auto my-8">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      <th className="border border-gray-700 p-3 text-left">Region</th>
                      <th className="border border-gray-700 p-3 text-left">Regulation</th>
                      <th className="border border-gray-700 p-3 text-center">Person ID Possible?</th>
                      <th className="border border-gray-700 p-3 text-center">RB2B</th>
                      <th className="border border-gray-700 p-3 text-center">Cursive</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {regions.map(r => (
                      <tr key={r.region} className={r.region === "United States" ? "bg-gray-50" : ""}>
                        <td className="border border-gray-300 p-3 font-medium">{r.flag} {r.region}</td>
                        <td className="border border-gray-300 p-3 text-gray-600 text-xs">{r.regulation}</td>
                        <td className="border border-gray-300 p-3 text-center text-green-600">✓ Yes</td>
                        <td className={`border border-gray-300 p-3 text-center text-sm ${r.rb2bSupport.includes("✗") || r.rb2bSupport.includes("only") ? "text-red-600" : "text-orange-600"} font-medium`}>
                          {r.rb2bSupport}
                        </td>
                        <td className="border border-gray-300 p-3 text-center text-green-600 font-medium">{r.cursiveSupport}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* How Cursive Does It */}
              <h2>How Cursive Achieves Global Person-Level Identification</h2>

              <p>
                Cursive&apos;s identification infrastructure is built from the ground up to work across geographies,
                not as an afterthought. Here is how we identify visitors beyond the US:
              </p>

              <div className="not-prose space-y-4 my-8">
                {[
                  {
                    num: "1",
                    title: "Multi-method identification",
                    desc: "We combine IP intelligence (company-level worldwide), device fingerprinting, behavioral signals, and first-party data matching. These methods are not geographically constrained to the US — they work wherever the internet works."
                  },
                  {
                    num: "2",
                    title: "International B2B data partnerships",
                    desc: "Our identity resolution layer incorporates international B2B databases that cover European, UK, and APAC business professionals. This is the foundation for person-level identification outside the US."
                  },
                  {
                    num: "3",
                    title: "GDPR-compliant consent gating",
                    desc: "For EU and UK visitors, the identification pixel fires only after consent is obtained through our Consent Management Tool. Visitors who decline are not tracked. Visitors who accept are identified with full person-level precision."
                  },
                  {
                    num: "4",
                    title: "Jurisdiction-aware data handling",
                    desc: "Data from EU visitors is processed under Standard Contractual Clauses for cross-border transfers. We maintain Data Processing Agreements for customers and honor data subject requests across all supported geographies."
                  },
                ].map(item => (
                  <div key={item.num} className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {item.num}
                    </div>
                    <div>
                      <p className="font-bold mb-1">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Practical implications */}
              <h2>Practical Implications for B2B Sales Teams</h2>

              <p>
                Moving from a US-only tool to global identification changes what your sales team can do:
              </p>

              <div className="not-prose grid md:grid-cols-2 gap-4 my-8">
                <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                  <h3 className="font-bold text-sm mb-3 text-red-800">With US-Only Tools (e.g., RB2B)</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {[
                      "EU/UK visitors view pricing — invisible to your team",
                      "DACH enterprise prospect researches your platform — no notification",
                      "UK SaaS company visits 6 pages — you never know",
                      "Australian prospect compares you to a competitor — missed",
                      "30–60% of your traffic generates zero identified pipeline",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                  <h3 className="font-bold text-sm mb-3 text-green-800">With Cursive (Global)</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {[
                      "EU/UK visitors identified with name, email, company",
                      "DACH enterprise prospect routed to regional rep immediately",
                      "UK SaaS company receives personalized follow-up within hours",
                      "Australian prospect added to APAC outreach sequence",
                      "70% identification rate across all geographies",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* What to check before switching */}
              <h2>How to Audit Your Current International Coverage</h2>

              <p>
                Before assuming your visitor identification tool is working globally, run this quick audit:
              </p>

              <ol>
                <li>
                  <strong>Check Google Analytics geographic data.</strong> In GA4 go to Reports &rarr; User Attributes &rarr; Demographic Details &rarr; Country. Note what percentage of sessions come from non-US countries.
                </li>
                <li>
                  <strong>Cross-reference with identified visitors.</strong> In your visitor identification tool, filter identified visitors by country. Compare the distribution to your GA4 data. If you have 40% EU visitors in GA4 but 0% in identified visitors, you have found the gap.
                </li>
                <li>
                  <strong>Request an identification rate by country.</strong> Ask your current vendor what their identification rate is for EU, UK, and APAC traffic specifically. If they can&apos;t answer or say &ldquo;US-only,&rdquo; you have your answer.
                </li>
                <li>
                  <strong>Estimate the pipeline gap.</strong> Multiply your unidentified non-US visitor volume by your average deal value and close rate. That is the floor of what global identification could add to your pipeline.
                </li>
              </ol>

              <div className="not-prose bg-blue-50 rounded-xl p-6 my-8 border border-blue-200">
                <h3 className="font-bold text-base mb-2">Skip the Manual Audit</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Cursive&apos;s free audit shows you exactly which visitors you are currently missing — by geography,
                  company size, and intent level — in one report. Takes 5 minutes to set up.
                </p>
                <Link
                  href="/free-audit"
                  className="inline-block bg-primary text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Get My Free International Traffic Audit
                </Link>
              </div>

              <h2>The Bottom Line on International Visitor Identification</h2>

              <p>
                <Link href="/visitor-identification">Visitor identification</Link> is only as valuable as its coverage.
                A tool that identifies 70% of your US visitors but 0% of your EU visitors is not a 70% identification
                tool — it is a partial tool with a commercially significant gap.
              </p>
              <p>
                RB2B chose US-only as their product strategy. That made sense for their initial market.
                But for B2B companies with global ambitions — or for any European company deploying visitor
                identification on their own site — US-only is not a limitation you can work around.
                It is a fundamental constraint that leaves a third or more of your potential pipeline invisible.
              </p>
              <p>
                Cursive is built for global B2B teams. Our identification infrastructure covers US, EU, UK,
                Canada, and APAC visitors. Our compliance infrastructure handles the GDPR requirements
                that make non-US identification genuinely complex. The result is a tool that works wherever
                your customers are — not just where the US internet happens to be.
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
                heading="See What You're Missing from International Traffic"
                subheading="Get a free audit showing exactly which EU, UK, and APAC visitors your current tool is missing — and how much pipeline that represents."
                cta="Get My Free Audit"
                href="/free-audit"
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
            <p>Guide to international website visitor identification covering EU, UK, Canada, and APAC markets. Explains why most tools are US-only, how Cursive achieves global coverage, and the pipeline cost of US-only identification tools.</p>
          </MachineSection>
          <MachineSection title="Key Finding">
            <p>Most visitor identification tools (including RB2B) only identify visitors at the person level for US-based IP addresses. For companies with 30–60% non-US traffic, this creates a major pipeline gap. Cursive identifies visitors globally with a 70% person-level match rate.</p>
          </MachineSection>
          <MachineSection title="Geographic Coverage Comparison">
            <MachineList items={[
              "EU: RB2B = company-level only; Cursive = full person-level with GDPR compliance",
              "UK: RB2B = company-level only; Cursive = full person-level with UK GDPR compliance",
              "Canada: RB2B = limited; Cursive = full person-level",
              "Australia/APAC: RB2B = none; Cursive = full person-level",
              "US: Both tools provide person-level identification",
            ]} />
          </MachineSection>
          <MachineSection title="Why US-Only Tools Fall Short">
            <MachineList items={[
              "Identity graphs predominantly built on US data",
              "Regulatory complexity of GDPR/UK GDPR avoided by not processing EU visitors at person-level",
              "Results in 30-60% of traffic being invisible for international B2B companies",
            ]} />
          </MachineSection>
          <MachineSection title="How Cursive Achieves Global Identification">
            <MachineList items={[
              "Multi-method identification: IP intelligence, device fingerprinting, behavioral signals",
              "International B2B data partnerships for EU/UK/APAC coverage",
              "GDPR-compliant consent gating: pixel only fires after visitor accepts",
              "Jurisdiction-aware data handling with SCCs and DPAs",
            ]} />
          </MachineSection>
          <MachineSection title="Related Resources">
            <MachineList items={relatedPosts.map(p => p.title)} />
            <MachineLink href="/free-audit">Get a free international traffic audit</MachineLink>
            <MachineLink href="/visitor-identification">Cursive visitor identification platform</MachineLink>
            <MachineLink href="/blog/gdpr-compliant-visitor-identification">GDPR compliance guide for visitor identification</MachineLink>
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
