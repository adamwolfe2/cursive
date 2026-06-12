"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft, Check, X, Zap } from "lucide-react"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink } from "@/components/view-wrapper"

const faqs = [
  {
    question: "What is the main difference between Cursive and Demandbase?",
    answer: "The most important difference is what each platform actually identifies. Demandbase identifies companies visiting your website — you learn that 'Acme Corp' visited, but not who from Acme Corp. Cursive's Visitor Pixel identifies individual people visiting your site for $97/month. Demandbase also costs $50,000-$150,000 per year with a complex multi-month implementation."
  },
  {
    question: "How much does Demandbase actually cost?",
    answer: "Demandbase does not publish public pricing. Based on customer reports and industry analysis, Demandbase contracts typically range from $50,000 to $150,000+ per year depending on the modules purchased, number of seats, and account volume. Enterprise deployments with advertising activation, full ABM capabilities, and advanced analytics commonly exceed $100,000 annually. Annual contracts are required. Cursive offers Visitor Pixel at $97/month, Custom Audience at $197/month, and the Pixel + Audience Bundle at $247/month. All plans are month-to-month with no setup fee and can be canceled anytime."
  },
  {
    question: "Does Demandbase show you individual person names or just company names?",
    answer: "Demandbase primarily provides company-level identification — it tells you which businesses visited your site but does not reliably identify the individual people who visited. To get individual contact information, you need to connect Demandbase data to a separate contact database and match the accounts manually, adding cost and complexity. Cursive identifies individual decision-makers directly: name, verified work email, job title, company, and pages viewed — delivered automatically with no additional enrichment step needed."
  },
  {
    question: "How long does Demandbase take to implement?",
    answer: "A full Demandbase implementation typically takes 3-6 months. This includes enterprise sales cycles, CRM and marketing automation integration, training your marketing and sales team, configuring account-based advertising workflows, and mapping intent data to your sales process. Dedicated RevOps or marketing operations resources are required. Cursive requires adding a tracking pixel (5 minutes), setting your ICP criteria (15 minutes), and approving your first AI outreach sequences — typically live within 24 hours of signing up."
  },
  {
    question: "Is Demandbase worth it for companies under $10M ARR?",
    answer: "Demandbase is generally not cost-effective for companies under $10M ARR. The platform is built for enterprise teams with dedicated ABM programs, marketing operations staff, and budgets that support $50,000-$150,000/year in tooling. Without the organizational infrastructure to act on account-level signals, you end up paying enterprise prices for insights you cannot operationalize. Cursive is designed for B2B teams of 5-200 people: self-service setup, AI-automated outreach, and immediate pipeline impact without a dedicated ABM team."
  },
  {
    question: "Does Cursive have account-based marketing capabilities like Demandbase?",
    answer: "Cursive focuses on person-level identification and automated outreach rather than traditional ABM advertising. Within Cursive, you can segment identified visitors by company, industry, company size, and intent score — which gives you the core account targeting capability. Where Demandbase excels is in its advertising activation layer. If your primary need is identifying who is visiting your site and engaging those people with personalized outreach, Cursive delivers better results at a fraction of the cost."
  },
  {
    question: "What does Cursive offer that Demandbase does not?",
    answer: "Cursive offers self-serve person-level visitor identification and fresh weekly lists of in-market buyers delivered to Google Sheets. Teams can choose Visitor Pixel at $97/month, Custom Audience at $197/month, or the Pixel + Audience Bundle at $247/month. All plans are month-to-month with no setup fee and can be canceled anytime."
  }
]

const relatedPosts = [
  {
    title: "Demandbase Alternative: 8 Tools That Cost Less and Convert More",
    href: "/blog/demandbase-alternative",
    description: "Every major Demandbase alternative ranked by ID rate, pricing, and ease of use.",
  },
  {
    title: "Cursive vs 6sense: From $97/mo vs $50k-$200k/yr",
    href: "/blog/cursive-vs-6sense",
    description: "Another enterprise ABM platform comparison — who wins for mid-market teams?",
  },
  {
    title: "Best Website Visitor Identification Software (2026)",
    href: "/blog/best-website-visitor-identification-software",
    description: "The complete guide to every major visitor ID tool ranked and compared.",
  },
]

export default function CursiveVsDemandbase() {
  return (
    <main>
      <HumanView>
        {/* Header */}
        <section className="py-12 bg-white">
          <Container>
            <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
            <div className="max-w-4xl mx-auto">
              <div className="inline-block px-3 py-1 bg-primary text-white rounded-full text-sm font-medium mb-4">
                Comparison
              </div>
              <h1 className="text-5xl font-bold mb-6">
                Cursive vs Demandbase: $97/mo Person-Level ID vs $50k-$150k/yr Account ABM (2026)
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Demandbase tells you which company visited your site. Cursive tells you which person visited —
                name, email, title, and pages viewed — then automates personalized outreach automatically.
                Visitor Pixel is $97/month vs Demandbase at $50,000-$150,000/year.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>February 18, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>10 min read</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Quick Summary */}
        <section className="py-8 bg-primary/5 border-y border-primary/15">
          <Container>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-lg font-bold mb-3">TL;DR — Quick Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-primary/20">
                  <h3 className="font-bold text-lg mb-2 text-primary">Choose Cursive if...</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> You want to know WHO visited, not just which company</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> You want self-serve buyer data from $97/month</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> You need pipeline this quarter, not next year</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> You want visitor ID + outreach + direct mail in one tool</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> You do not have a dedicated ABM/RevOps team</li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-bold text-lg mb-2">Consider Demandbase if...</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" /> You are enterprise (500+ employees) with a dedicated ABM team</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" /> You can invest $50k-$150k/year and 3-6 months setup</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" /> You need multi-channel ABM advertising activation</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" /> You already have Salesforce + Marketo deeply integrated</li>
                  </ul>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Main Content */}
        <section className="py-12 bg-gray-50">
          <Container>
            <div className="max-w-4xl space-y-8">

              {/* Person vs Company */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-4">The Core Difference: Person vs Company Identification</h2>
                <p className="text-gray-700 mb-6">
                  This is the most important distinction between the two platforms, and it fundamentally changes what you can do with the data.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="border-2 border-primary rounded-xl p-6">
                    <div className="text-primary font-bold text-lg mb-3">Cursive — Person-Level</div>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono mb-4">
                      <div className="text-green-600 font-semibold mb-2">✓ You get:</div>
                      <div>Name: John Smith</div>
                      <div>Title: VP of Sales</div>
                      <div>Email: john@acmecorp.com</div>
                      <div>Company: Acme Corp (250 employees)</div>
                      <div>Page: /pricing (viewed 3x this week)</div>
                      <div>Intent: HIGH</div>
                    </div>
                    <p className="text-sm text-gray-600">You know exactly who to contact and what they care about.</p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-6">
                    <div className="font-bold text-lg mb-3">Demandbase — Company-Level</div>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono mb-4">
                      <div className="text-orange-500 font-semibold mb-2">⚠ You get:</div>
                      <div>Company: Acme Corp</div>
                      <div>Industry: Technology</div>
                      <div>Size: 200-500 employees</div>
                      <div>Intent Score: High</div>
                      <div className="text-gray-400 mt-2">Person: Unknown</div>
                      <div className="text-gray-400">Email: Unknown</div>
                    </div>
                    <p className="text-sm text-gray-600">You know a company visited. You still need to figure out who.</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
                  <strong>Real-world impact:</strong> With Demandbase, you get account-level intelligence and need to separately prospect the right contact. With Cursive, the right contact is identified automatically and outreach starts immediately — no manual prospecting step required.
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-4">Pricing: $97-$247/mo vs $50k-$150k/yr</h2>
                <p className="text-gray-700 mb-6">
                  Demandbase does not publish pricing publicly. Industry reports and customer data consistently show contracts in the $50,000-$150,000/year range.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="border-2 border-primary rounded-xl p-6">
                    <div className="text-primary font-bold text-lg mb-1">Cursive</div>
                    <div className="text-4xl font-bold mb-1">$97-$247<span className="text-lg font-normal text-gray-500">/mo</span></div>
                    <div className="text-sm text-gray-500 mb-4">Month-to-month. Cancel anytime.</div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> 70% person-level visitor ID</li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Automated AI email outreach</li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Direct mail automation</li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> 420M+ contact database</li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Intent scoring + CRM sync</li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> 24-hour setup, no RevOps needed</li>
                    </ul>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-6">
                    <div className="font-bold text-lg mb-1">Demandbase</div>
                    <div className="text-4xl font-bold mb-1">$50k-$150k<span className="text-lg font-normal text-gray-500">/yr</span></div>
                    <div className="text-sm text-gray-500 mb-4">Annual contract. Custom enterprise pricing.</div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Company-level visitor identification</li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Predictive account scoring</li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> ABM advertising activation</li>
                      <li className="flex items-start gap-2"><X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> No built-in email outreach</li>
                      <li className="flex items-start gap-2"><X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> No direct mail</li>
                      <li className="flex items-start gap-2"><X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> 3-6 month implementation</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
                  <strong>True cost comparison:</strong> Even Cursive's $247/month Pixel + Audience Bundle costs a fraction of Demandbase's reported $50,000-$150,000 annual pricing.
                </div>
              </div>

              {/* Implementation */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-4">Implementation: 24 Hours vs 3-6 Months</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-green-900">Cursive: 24-Hour Setup</h3>
                    </div>
                    <ol className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2"><span className="font-bold text-primary shrink-0">1.</span> Add tracking pixel to your site (5 min)</li>
                      <li className="flex items-start gap-2"><span className="font-bold text-primary shrink-0">2.</span> Connect CRM via OAuth (10 min)</li>
                      <li className="flex items-start gap-2"><span className="font-bold text-primary shrink-0">3.</span> Set ICP criteria in dashboard (15 min)</li>
                      <li className="flex items-start gap-2"><span className="font-bold text-primary shrink-0">4.</span> Approve AI outreach sequences (30 min)</li>
                      <li className="flex items-start gap-2"><span className="font-bold text-primary shrink-0">5.</span> Go live — identification and outreach start automatically</li>
                    </ol>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold mb-3">Demandbase: 3-6 Month Implementation</h3>
                    <ol className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2"><span className="font-bold text-gray-500 shrink-0">1.</span> Enterprise procurement + legal review (1-2 mo)</li>
                      <li className="flex items-start gap-2"><span className="font-bold text-gray-500 shrink-0">2.</span> Salesforce + Marketo/HubSpot integration (1-2 mo)</li>
                      <li className="flex items-start gap-2"><span className="font-bold text-gray-500 shrink-0">3.</span> Target account list configuration (2-4 weeks)</li>
                      <li className="flex items-start gap-2"><span className="font-bold text-gray-500 shrink-0">4.</span> ABM advertising setup and team training (2-4 weeks)</li>
                      <li className="flex items-start gap-2"><span className="font-bold text-gray-500 shrink-0">5.</span> Ongoing model tuning and optimization</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Feature Table */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">Feature Comparison</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 pr-4 font-semibold text-gray-700">Feature</th>
                        <th className="text-center py-3 px-4 font-semibold text-primary">Cursive</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Demandbase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        ["Starting price", "$97/mo", "$50,000+/yr"],
                        ["Contract type", "Month-to-month", "Annual contract"],
                        ["Setup time", "24 hours", "3-6 months"],
                        ["Identifies individual people", "✓ (70% rate)", "✗ (company-level)"],
                        ["Automated email outreach", "✓", "✗ (needs add-on tools)"],
                        ["Direct mail automation", "✓", "✗"],
                        ["ABM advertising", "✗", "✓"],
                        ["Account scoring", "Intent scoring", "Predictive AI models"],
                        ["Contact database", "420M+ verified", "Separate purchase"],
                        ["RevOps team required", "No", "Yes"],
                        ["SMB/mid-market friendly", "✓", "✗"],
                      ].map(([feature, cursive, db]) => (
                        <tr key={feature} className="hover:bg-gray-50">
                          <td className="py-3 pr-4 text-gray-700 font-medium">{feature}</td>
                          <td className="py-3 px-4 text-center">
                            {cursive === "✓" ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : cursive === "✗" ? (
                              <X className="w-5 h-5 text-red-400 mx-auto" />
                            ) : (
                              <span className="font-semibold text-primary text-xs">{cursive}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {db === "✓" ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : db === "✗" ? (
                              <X className="w-5 h-5 text-red-400 mx-auto" />
                            ) : (
                              <span className="text-gray-600 text-xs">{db}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-primary rounded-xl p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-3">See Exactly Who Is Visiting Your Site Right Now</h2>
                <p className="text-white/80 mb-6">
                  Stop getting company names. Start getting the actual person — name, email, title, and what they viewed.
                  Choose a self-serve plan from $97/month, with no setup fee.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg" variant="outline">
                    <Link href="/free-audit">Get Your Free Visitor Audit</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
                <div className="space-y-6">
                  {faqs.map((faq, i) => (
                    <div key={i} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                      <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              <SimpleRelatedPosts posts={relatedPosts} />

            </div>
          </Container>
        </section>

        <DashboardCTA />
      </HumanView>

      <MachineView>
        <MachineContent>
          <MachineSection title="Cursive vs Demandbase: Complete 2026 Comparison">
            Cursive and Demandbase are both B2B buyer intelligence platforms, but they solve fundamentally different problems. Demandbase identifies companies visiting your website and provides account-level ABM capabilities at $50,000-$150,000 per year with 3-6 month implementation. Cursive offers person-level visitor identification from $97 per month and fresh weekly in-market buyer lists from $197 per month.
          </MachineSection>
          <MachineSection title="Person-Level vs Company-Level Identification">
            The fundamental difference: Demandbase tells you which company visited your site. Cursive tells you which person visited — including their verified work email, job title, and specific pages viewed. This eliminates the manual prospecting step required with Demandbase and enables immediate, personalized outreach.
          </MachineSection>
          <MachineSection title="Pricing Comparison">
            Cursive offers Visitor Pixel at $97 per month, Custom Audience at $197 per month, and the Pixel + Audience Bundle at $247 per month. All plans are month-to-month with no setup fee and can be canceled anytime. Demandbase pricing ranges from $50,000 to $150,000+ per year on annual contracts.
          </MachineSection>
          <MachineSection title="Who Should Choose Cursive">
            Cursive is the better choice for B2B companies under 200 employees, teams without dedicated RevOps or ABM staff, organizations that want self-serve buyer data, and teams that need pipeline generation this quarter. Demandbase is appropriate for enterprise organizations with $50,000+ annual tooling budgets and dedicated marketing operations teams.
          </MachineSection>
          <MachineSection title="About Cursive">
            <MachineLink href="https://www.meetcursive.com">Cursive</MachineLink> identifies companies and people visiting your website and delivers fresh weekly lists of in-market buyers. Self-serve plans start at $97/month, with no setup fee or annual contract.
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
