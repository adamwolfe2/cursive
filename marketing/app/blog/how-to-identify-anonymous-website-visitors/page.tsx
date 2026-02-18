"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft, Eye, Database, Shield, Zap, Users, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"

export default function HowToIdentifyAnonymousVisitors() {
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

            <div className="max-w-4xl">
              <div className="inline-block px-3 py-1 bg-primary text-white rounded-full text-sm font-medium mb-4">
                <Eye className="w-3 h-3 inline mr-1" />
                Visitor Identification
              </div>
              <h1 className="text-5xl font-bold mb-6">
                How to Identify Anonymous Website Visitors: Complete B2B Guide (2026)
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Turn 70% of anonymous traffic into qualified leads — with name, email, company, and LinkedIn.
                A step-by-step guide to the methods, tools, and workflow.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>February 18, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>12 min read</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Article Content */}
        <section className="py-16 bg-white">
          <Container>
            <article className="max-w-3xl mx-auto prose prose-lg prose-blue">
              <p className="lead">
                98% of your website visitors leave without filling out a form. For a B2B company with 10,000
                monthly visitors, that means roughly 9,800 qualified prospects disappear every month — people
                who found your site, evaluated your product, and left without raising their hand.
              </p>

              <p>
                <Link href="/visitor-identification" className="text-blue-600 hover:underline">Website visitor identification</Link> technology
                closes this gap. Modern platforms can identify 50-70% of anonymous B2B visitors by name,
                email, company, LinkedIn profile, and the specific pages they visited. This guide explains
                exactly how it works, what data you get, and how to implement it.
              </p>

              <h2>Why 98% of Visitors Stay Anonymous</h2>

              <p>
                Most visitors never fill out a form because they are early in their research. They are:
              </p>

              <ul>
                <li>Comparing you to competitors before reaching out</li>
                <li>Evaluating pricing before they are ready to talk</li>
                <li>Checking your features against a checklist</li>
                <li>Not quite ready but warming up to your category</li>
              </ul>

              <p>
                Traditional analytics tools (Google Analytics, Mixpanel) only tell you <em>that</em> these visitors
                existed — pageviews, sessions, bounce rates. They do not tell you <em>who</em> they are. Visitor
                identification closes this gap by resolving anonymous sessions to real people and companies.
              </p>

              <h2>The 4 Technical Methods Behind Visitor Identification</h2>

              <div className="not-prose bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 my-8 border border-gray-200">
                <h3 className="text-xl font-bold mb-6 text-gray-900">Identification Method Comparison</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold">1. IP Address Resolution</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Maps visitor IP ranges to companies and individuals using ISP/business records.</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">B2B accuracy</span><span className="font-semibold text-green-600">65–75%</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">B2C accuracy</span><span className="font-semibold text-red-500">10–20%</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Privacy risk</span><span className="font-semibold text-green-600">Low</span></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-5 h-5 text-purple-600" />
                      <h4 className="font-bold">2. Device Fingerprinting</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Combines browser, OS, screen, font, and network signals into a probabilistic ID.</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Accuracy</span><span className="font-semibold text-blue-600">70–85%</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Works across sessions</span><span className="font-semibold text-green-600">Yes</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Privacy risk</span><span className="font-semibold text-yellow-600">Medium</span></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-green-600" />
                      <h4 className="font-bold">3. Identity Graph Matching</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Cross-references device/IP signals against databases of 250M+ professional profiles.</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Identifies person</span><span className="font-semibold text-green-600">Yes (by name)</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Email accuracy</span><span className="font-semibold text-green-600">Very high</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Coverage</span><span className="font-semibold text-blue-600">B2B professionals</span></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <h4 className="font-bold">4. First-Party Signals</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Email link clicks, prior form submissions, and cookie matches from known contacts.</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Accuracy</span><span className="font-semibold text-green-600">95–100%</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Coverage</span><span className="font-semibold text-yellow-600">Prior contacts only</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Privacy risk</span><span className="font-semibold text-green-600">Very low</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <h3>Method 1: IP Address Resolution</h3>
              <p>
                Every internet connection uses an IP address. Businesses typically use corporate IP ranges
                assigned to their company — often static addresses associated with office locations. IP
                resolution databases map these ranges to company names, sizes, and locations.
              </p>
              <p>
                This method works well for identifying <em>which company</em> is visiting. For
                person-level identification, tools cross-reference the IP with their identity graph to match
                the IP to a specific individual who is known to work at that company and whose device
                signature matches.
              </p>

              <h3>Method 2: Device Fingerprinting</h3>
              <p>
                Device fingerprinting aggregates dozens of signals: browser type and version, operating system,
                screen resolution, installed fonts, timezone, language settings, and network characteristics.
                Combined, these create a probabilistic identifier that persists across sessions — even when
                cookies are cleared.
              </p>
              <p>
                Fingerprinting is particularly valuable for re-identifying returning visitors who cleared
                their cookies or switched browsers. When a fingerprint matches a previously identified user,
                the system can associate the new session with the known individual.
              </p>

              <h3>Method 3: Identity Graph Matching</h3>
              <p>
                This is the core of person-level identification. Identity graph providers maintain databases
                of 200–300 million professional profiles, cross-referenced against known device fingerprints
                and IP associations. When a visitor's signals match a profile in the graph, the tool can
                return that person's name, work email, LinkedIn URL, and job title.
              </p>
              <p>
                Cursive's identity graph covers 250M+ B2B professionals. When a visitor hits your site, their
                device and IP signals are matched against this graph in real time — typically within 2–5 seconds
                of the first page load.
              </p>

              <h3>Method 4: First-Party Signal Matching</h3>
              <p>
                When a known contact clicks a link in your email, submits a form, or visits while logged in,
                their session is definitively tied to their identity. Visitor identification tools use these
                anchor events to enrich future sessions — if the same device later visits anonymously, the
                system can still identify them.
              </p>

              <h2>What Data Do You Get?</h2>

              <p>When a visitor is successfully identified, you typically receive:</p>

              <div className="not-prose bg-gray-50 rounded-xl p-6 my-6 border border-gray-200">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Person-Level Data
                    </h4>
                    <ul className="space-y-1.5 text-sm text-gray-700">
                      <li>• Full name</li>
                      <li>• Work email address</li>
                      <li>• LinkedIn profile URL</li>
                      <li>• Job title and seniority</li>
                      <li>• Phone number (when available)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Company Data
                    </h4>
                    <ul className="space-y-1.5 text-sm text-gray-700">
                      <li>• Company name</li>
                      <li>• Employee count</li>
                      <li>• Industry and vertical</li>
                      <li>• Annual revenue (estimated)</li>
                      <li>• Tech stack signals</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Visit Behavior
                    </h4>
                    <ul className="space-y-1.5 text-sm text-gray-700">
                      <li>• Pages visited (with timestamps)</li>
                      <li>• Time on page</li>
                      <li>• Pricing page visits</li>
                      <li>• Demo/trial page views</li>
                      <li>• Return visit history</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Intent Signals (Cursive)
                    </h4>
                    <ul className="space-y-1.5 text-sm text-gray-700">
                      <li>• Topics actively researching</li>
                      <li>• Competitor pages viewed</li>
                      <li>• Content category interest</li>
                      <li>• Intent score / urgency rating</li>
                      <li>• Active buying window signal</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h2>Is It Legal? Privacy Compliance Explained</h2>

              <p>
                B2B visitor identification is legal under GDPR, CCPA, and CASL when implemented correctly.
                The key distinction: tools like Cursive identify <em>business professionals acting in their
                professional capacity</em> — not consumers in personal contexts. This carries a lower
                regulatory burden.
              </p>

              <div className="not-prose bg-white rounded-xl border border-gray-200 p-6 my-6">
                <h4 className="font-bold text-gray-900 mb-4">Privacy Compliance Checklist</h4>
                <div className="space-y-3">
                  {[
                    'Disclose data collection in your privacy policy (include visitor identification)',
                    'Provide a clear opt-out mechanism (privacy center link in footer)',
                    'Use data only for legitimate business outreach — not resale',
                    'Honor opt-out requests within 30 days',
                    'Do not identify visitors in personal, non-business contexts',
                    'Work with a tool that is SOC 2 Type II certified (Cursive is)',
                    'Ensure your CRM data processing agreement covers enriched data',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <h2>How to Set Up Visitor Identification: Step-by-Step</h2>

              <h3>Step 1: Choose a Tool</h3>
              <p>
                Select a visitor identification platform based on: identification rate (target 60%+),
                data quality (person-level vs. company-only), CRM integrations, and pricing.
                Cursive identifies 70% of B2B visitors at $1,000/month with direct CRM sync.
              </p>

              <h3>Step 2: Install the Tracking Snippet</h3>
              <p>
                Every visitor identification tool provides a JavaScript snippet. Install it in the{" "}
                <code>&lt;head&gt;</code> tag of every page on your site. The fastest method is via
                Google Tag Manager — add a new Custom HTML tag, paste the snippet, and fire it on All Pages.
              </p>
              <p>
                Verify installation: open your browser dev tools, go to the Network tab, and look for
                requests to the tool's tracking domain. If you see them, the snippet is firing.
              </p>

              <h3>Step 3: Connect Your CRM</h3>
              <p>
                Configure your CRM integration so identified visitors automatically create or update
                contact records. For Salesforce: use the native Cursive-Salesforce connector to push
                identified leads to a designated lead queue with all visit data attached. For HubSpot:
                contacts are created automatically with timeline activities showing each page visited.
              </p>

              <h3>Step 4: Set Up Routing Rules</h3>
              <p>
                Not every identified visitor should go to the same rep. Configure routing rules based on:
                company size (enterprise vs. SMB), industry, geography, or whether the account is already
                in your CRM. Cursive supports round-robin, territory-based, and account-based routing.
              </p>

              <h3>Step 5: Build Your First Workflow</h3>
              <p>
                The highest-value workflow is simple: when a visitor hits your pricing page, immediately
                identify them and send a personalized email within 5 minutes. Cursive automates this
                end-to-end — no manual steps required. This single workflow typically generates 10–20%
                of your pipeline from existing traffic.
              </p>

              <h2>Identification Rate Benchmarks by Traffic Type</h2>

              <div className="not-prose overflow-x-auto my-6">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3 border border-gray-200 font-semibold">Traffic Type</th>
                      <th className="text-left p-3 border border-gray-200 font-semibold">ID Rate</th>
                      <th className="text-left p-3 border border-gray-200 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Corporate office traffic', '75–85%', 'Static business IPs, strong identity graph matches'],
                      ['Remote workers (VPN)', '40–55%', 'VPNs mask IPs; fingerprinting still works'],
                      ['Mobile/cellular', '30–45%', 'Dynamic IPs; fingerprinting is primary method'],
                      ['Consumer/residential', '10–25%', 'Not in B2B identity graphs; lower priority'],
                      ['Paid ad traffic (B2B)', '60–70%', 'High overlap with B2B identity databases'],
                      ['Organic search (B2B)', '55–70%', 'Similar to overall B2B average'],
                    ].map(([type, rate, note], i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-3 border border-gray-200">{type}</td>
                        <td className="p-3 border border-gray-200 font-semibold text-green-700">{rate}</td>
                        <td className="p-3 border border-gray-200 text-gray-600">{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2>Visitor ID vs. Traditional Lead Generation</h2>

              <div className="not-prose bg-gray-50 rounded-xl p-6 my-6 border border-gray-200">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Traditional Lead Gen</h4>
                    <ul className="space-y-2">
                      {[
                        ['Cost per lead', '$50–$500'],
                        ['Lead intent', 'Unknown (cold list)'],
                        ['Personalization', 'Generic'],
                        ['Timing', 'Whenever you reach out'],
                        ['Coverage', '2–5% of ICP traffic'],
                      ].map(([label, value]) => (
                        <li key={label} className="flex justify-between text-sm">
                          <span className="text-gray-600">{label}</span>
                          <span className="font-semibold text-gray-800">{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-700 mb-3">Visitor Identification (Cursive)</h4>
                    <ul className="space-y-2">
                      {[
                        ['Cost per lead', '$2–$20'],
                        ['Lead intent', 'High (visited your site)'],
                        ['Personalization', 'Pages they viewed'],
                        ['Timing', 'Within minutes of visit'],
                        ['Coverage', '70% of B2B traffic'],
                      ].map(([label, value]) => (
                        <li key={label} className="flex justify-between text-sm">
                          <span className="text-gray-600">{label}</span>
                          <span className="font-semibold text-blue-700">{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <h2>Top Visitor Identification Tools Compared (2026)</h2>

              <div className="not-prose overflow-x-auto my-6">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      <th className="text-left p-3 border border-gray-700">Tool</th>
                      <th className="text-left p-3 border border-gray-700">ID Level</th>
                      <th className="text-left p-3 border border-gray-700">ID Rate</th>
                      <th className="text-left p-3 border border-gray-700">Starting Price</th>
                      <th className="text-left p-3 border border-gray-700">Best For</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Cursive', 'Person + Company', '70%', '$1,000/mo', 'Intent-first B2B teams'],
                      ['RB2B', 'Person (LinkedIn)', '50–60%', '$79/mo', 'LinkedIn-first outreach'],
                      ['Warmly', 'Person + Company', '50–60%', '$700/mo', 'Signal-based routing'],
                      ['Leadfeeder', 'Company only', '~70%', '$139/mo', 'Company-level ABM'],
                      ['Albacross', 'Company only', '~65%', '$299/mo', 'EU-focused companies'],
                      ['Demandbase', 'Person + Company', '55–65%', '$50k+/yr', 'Enterprise ABM'],
                    ].map(([tool, level, rate, price, best], i) => (
                      <tr key={i} className={i === 0 ? 'bg-blue-50 font-medium' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-3 border border-gray-200">{tool}{i === 0 && <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Top Pick</span>}</td>
                        <td className="p-3 border border-gray-200">{level}</td>
                        <td className="p-3 border border-gray-200 text-green-700 font-semibold">{rate}</td>
                        <td className="p-3 border border-gray-200">{price}</td>
                        <td className="p-3 border border-gray-200 text-gray-600">{best}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2>FAQ: Identifying Anonymous Website Visitors</h2>

              <h3>Can you identify 100% of visitors?</h3>
              <p>
                No. The practical ceiling is about 70–75% for B2B traffic. The remaining 25–30% includes
                VPN users with masked IPs, individuals not in B2B identity databases (students, researchers,
                job seekers), and consumers visiting from personal devices. Focus on maximizing the B2B
                segment — this is where your buyers are.
              </p>

              <h3>Does visitor identification replace form fills?</h3>
              <p>
                No — forms are still valuable for capturing purchase intent signals. But visitor identification
                captures the 90%+ of qualified prospects who will never fill out a form. The two work
                together: forms provide high-intent leads, visitor ID surfaces the much larger pool of
                anonymous interested buyers.
              </p>

              <h3>What happens after I identify a visitor?</h3>
              <p>
                The most effective workflow: send a personalized email within 5–15 minutes of the visit
                referencing the specific pages they viewed. Response rates for behavior-personalized emails
                are 3–5x higher than cold outreach. Cursive automates this full loop — identification,
                enrichment, email generation, and send.
              </p>
            </article>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Start Identifying Your Anonymous Visitors</h2>
              <p className="text-xl text-blue-100 mb-8">
                Cursive identifies 70% of B2B website visitors by name, email, and LinkedIn — and
                sends personalized outreach automatically. Install in 5 minutes.
              </p>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8">
                Start Free Trial
              </Button>
            </div>
          </Container>
        </section>

        <DashboardCTA />
      </HumanView>

      <MachineView>
        <MachineContent>
          <MachineSection title="How to Identify Anonymous Website Visitors: Complete B2B Guide">
            <p>Modern visitor identification tools identify 50-70% of anonymous B2B website visitors by combining IP address resolution, device fingerprinting, identity graph matching, and first-party signals. Cursive achieves a 70% identification rate — the highest in the market — returning name, email, LinkedIn profile, company data, and specific pages visited.</p>

            <MachineSection title="The 4 Technical Methods">
              <MachineList items={[
                "IP address resolution: Maps visitor IP ranges to companies (65-75% B2B accuracy, low privacy risk)",
                "Device fingerprinting: Combines browser/OS/screen signals into a persistent probabilistic ID (70-85% accuracy)",
                "Identity graph matching: Cross-references device signals against 250M+ professional profiles for person-level ID",
                "First-party signal matching: Email link clicks, prior form fills, and cookie matches (95-100% accuracy, prior contacts only)",
              ]} />
            </MachineSection>

            <MachineSection title="Data Returned Per Identified Visitor">
              <MachineList items={[
                "Full name, work email, LinkedIn URL, job title",
                "Company name, size, industry, revenue (estimated)",
                "Pages visited with timestamps, time on page, pricing/demo page flags",
                "Intent signals: topics researching, competitor views, intent score (Cursive only)",
              ]} />
            </MachineSection>

            <MachineSection title="Legal Compliance">
              <p>B2B visitor identification is legal under GDPR, CCPA, and CASL when: privacy policy discloses collection; opt-out mechanism is provided; data used only for legitimate B2B outreach; opt-out requests honored within 30 days. Cursive is SOC 2 Type II certified.</p>
            </MachineSection>

            <MachineSection title="Top Tools Compared">
              <MachineList items={[
                "Cursive: Person + Company, 70% ID rate, $1,000/month — best for intent-first B2B teams",
                "RB2B: Person (LinkedIn), 50-60% ID rate, $79/month — best for LinkedIn-first outreach",
                "Warmly: Person + Company, 50-60% ID rate, $700/month — best for signal-based routing",
                "Leadfeeder: Company only, ~70% ID rate, $139/month — best for company-level ABM",
                "Demandbase: Person + Company, 55-65% ID rate, $50k+/year — enterprise ABM",
              ]} />
            </MachineSection>

            <MachineSection title="Setup Steps">
              <MachineList items={[
                "Choose a visitor identification tool with 60%+ identification rate",
                "Install the JavaScript tracking snippet via Google Tag Manager or directly in <head>",
                "Connect your CRM (Salesforce, HubSpot, Pipedrive, Close)",
                "Configure routing rules by company size, industry, or territory",
                "Build first workflow: visitor hits pricing page → identify → send personalized email within 5 minutes",
              ]} />
            </MachineSection>

            <MachineSection title="Related Pages">
              <MachineList items={[
                <MachineLink key="vi" href="/visitor-identification" label="Visitor Identification" />,
                <MachineLink key="intent" href="/intent-audiences" label="Intent Audiences" />,
                <MachineLink key="what-is" href="/blog/what-is-website-visitor-identification" label="What Is Website Visitor Identification" />,
                <MachineLink key="technical" href="/blog/how-to-identify-website-visitors-technical-guide" label="Technical Guide to Visitor Identification" />,
              ]} />
            </MachineSection>
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
