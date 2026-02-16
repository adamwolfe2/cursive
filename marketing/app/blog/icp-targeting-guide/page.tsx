"use client"

import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateBlogPostSchema({
        title: "The 5-Step Framework for Perfect ICP Targeting",
        description: "Build and target your ideal customer profile (ICP) with data-driven strategies. Define firmographics, behaviors, and intent signals for better conversions.",
        author: "Adam Wolfe",
        publishDate: "2026-01-21",
        image: "https://www.meetcursive.com/cursive-logo.png",
      })} />

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
              Strategy
            </div>
            <h1 className="text-5xl font-bold mb-6">
              The 5-Step Framework for Perfect ICP Targeting
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Stop wasting money on bad leads. Learn how to define and target your ideal customer profile.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>January 21, 2026</span>
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
            <p className="lead">
              Most B2B companies waste 60-70% of their outbound budget targeting the wrong people. That is not a guess—it is what we see consistently across the 500+ outbound programs we have managed at Cursive.
            </p>

            <p>
              They cast a wide net, hoping something sticks. They chase any company that <em>might</em> buy.
              They confuse "anyone could use this" with "this is who we are built for." Sales teams spend weeks pursuing prospects who were never going to close, while high-fit accounts go untouched because nobody identified them as priorities.
            </p>

            <p>
              The result? Low reply rates (often under 3%), painfully long sales cycles (6+ months when they should be 6 weeks), high churn (because the wrong customers signed up in the first place), and frustrated sales teams that feel like they are pushing a boulder uphill.
            </p>

            <p>
              The fix is straightforward: Get crystal clear on your Ideal Customer Profile (ICP). Companies that invest the time to define, document, and enforce a tight ICP see dramatically better results across every metric that matters—from reply rate to revenue retention.
            </p>

            <h2>What is an ICP?</h2>

            <p>
              Your ICP is the <strong>type of company</strong> that gets the most value from your product,
              has the budget and authority to buy, and is relatively easy to sell to. It is the intersection of three things: they need what you offer, they can afford it, and the sales motion to close them is efficient and repeatable.
            </p>

            <p>
              It is NOT:
            </p>

            <ul>
              <li>A buyer persona (that is who you talk to within the ICP—the individual people, their roles, and their motivations)</li>
              <li>Your total addressable market (TAM)—your ICP should be a focused subset of your TAM, not the whole thing</li>
              <li>"Any company that could use our product"—just because someone could theoretically benefit does not mean they are a good fit for your sales process and pricing</li>
              <li>A static document—your ICP should evolve as you learn more about your best and worst customers</li>
            </ul>

            <p>
              Your ICP is narrow and specific. That is the point. Counterintuitively, narrowing your focus almost always increases your total revenue because you convert a much higher percentage of the leads you target.
            </p>

            <h2>Why ICP Matters: The Numbers</h2>

            <p>
              When you nail your ICP, every metric in your sales funnel improves:
            </p>

            <ul>
              <li><strong>Reply rates double or triple:</strong> You are speaking directly to real pain points that the prospect is actively feeling. Generic outreach that could apply to anyone fails because it applies to no one specifically enough to trigger a response.</li>
              <li><strong>Sales cycles shrink by 40-60%:</strong> You are talking to people who already have the problem, the budget, and the authority to buy. There are fewer "let me check with my team" delays and fewer "we need to wait until next quarter" stalls.</li>
              <li><strong>Close rates improve by 2-3x:</strong> Product-market fit is obvious when you are selling to the right companies. Your demos land better, your case studies are more relevant, and your ROI projections are more credible.</li>
              <li><strong>Churn drops by 30-50%:</strong> Customers who fit your ICP get real value from your product and stick around longer. Companies that sign up outside your ICP are the ones most likely to churn within 6 months.</li>
              <li><strong>Marketing works:</strong> Messaging resonates instantly because you understand your audience's specific language, pain points, and priorities. Your content attracts the right visitors and your ads convert at higher rates.</li>
              <li><strong>Sales team morale improves:</strong> Reps who spend their time talking to well-qualified prospects close more deals, earn more commission, and enjoy their work. Reps who chase unqualified leads burn out and quit.</li>
            </ul>

            <p>
              Companies that rigorously define and enforce their ICP see 2-3x improvement in pipeline efficiency. That means the same number of reps, spending the same amount of time, generate 2-3x more revenue.
            </p>

            <h2>The 5-Step ICP Framework</h2>

            <p>
              Here's how to define your ICP in a way that actually drives results.
            </p>

            <div className="not-prose my-8">
              {[
                {
                  step: 1,
                  title: 'Analyze Your Best Customers',
                  description: 'Start with data, not assumptions'
                },
                {
                  step: 2,
                  title: 'Define Firmographic Criteria',
                  description: 'Set the quantitative boundaries'
                },
                {
                  step: 3,
                  title: 'Identify Qualifying Attributes',
                  description: 'Add the qualitative filters'
                },
                {
                  step: 4,
                  title: 'Map the Buying Committee',
                  description: 'Know who to reach'
                },
                {
                  step: 5,
                  title: 'Test and Refine',
                  description: 'Validate with real campaigns'
                }
              ].map((step) => (
                <div key={step.step} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-4 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h3>Step 1: Analyze Your Best Customers</h3>

            <p>
              Pull a list of your top 10-20 customers. Do not guess or rely on intuition. Pull actual data from your CRM. The best customers are the ones who:
            </p>

            <ul>
              <li>Closed quickly (short sales cycle relative to your average)</li>
              <li>Pay full price (no heavy discounts or special concessions)</li>
              <li>Use the product actively (high login frequency, feature adoption, engagement scores)</li>
              <li>Expand over time (upsells, add-ons, additional seats)</li>
              <li>Refer other customers (they are willing advocates for your product)</li>
              <li>Generate low support ticket volume (they can self-serve and succeed without hand-holding)</li>
            </ul>

            <p>
              Look for patterns across these best customers:
            </p>

            <ul>
              <li>What industries are they in? Are there 2-3 industries that consistently show up?</li>
              <li>What is their revenue range? Is there a sweet spot where you win most often?</li>
              <li>How many employees do they have? Too small and they cannot afford you. Too large and the sales cycle is too complex.</li>
              <li>Where are they located? Geographic patterns can reveal market differences in buyer behavior.</li>
              <li>What is their growth stage? Are you winning with early-stage startups, growth-stage companies, or mature enterprises?</li>
              <li>What tools do they use? Tech stack patterns can be powerful predictors of product fit.</li>
              <li>How did they find you? Did they come inbound or through outbound? Referral or paid ads?</li>
            </ul>

            <p>
              Equally important: look at your <strong>worst</strong> customers. The ones who churned within 6 months, took forever to close with heavy discounting, needed constant support, or complained frequently. Identify what they have in common so you can build negative filters into your ICP. Sometimes the most valuable insight from this exercise is learning who NOT to target.
            </p>

            <p>
              A practical approach: create a spreadsheet with your top 20 and bottom 20 customers and fill in every attribute you can find. The patterns will jump off the page.
            </p>

            <h3>Step 2: Define Firmographic Criteria</h3>

            <p>
              Firmographics are the quantitative attributes of your ICP. These are the hard filters you'll
              use to build lead lists.
            </p>

            <div className="not-prose bg-gray-50 rounded-xl p-6 my-8">
              <h4 className="font-bold mb-4">Example ICP: SaaS Sales Tool for Mid-Market</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-medium">Industry</td>
                    <td className="py-2 text-gray-600">B2B SaaS</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-medium">Revenue</td>
                    <td className="py-2 text-gray-600">$5M - $50M ARR</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-medium">Employees</td>
                    <td className="py-2 text-gray-600">50 - 500</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-medium">Location</td>
                    <td className="py-2 text-gray-600">United States, Canada, UK</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-medium">Funding Stage</td>
                    <td className="py-2 text-gray-600">Series A - Series C</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-medium">Growth Signal</td>
                    <td className="py-2 text-gray-600">Hiring sales reps (3+ open roles)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              Be specific. "Small to mid-size companies" is useless. "$5M-$50M ARR" is actionable.
            </p>

            <h3>Step 3: Identify Qualifying Attributes</h3>

            <p>
              Qualitative attributes are the "softer" signals that indicate fit. These are harder to filter
              programmatically but are often the difference between a good lead and a great one.
            </p>

            <p>
              Examples:
            </p>

            <ul>
              <li><strong>Tech stack:</strong> Uses Salesforce, HubSpot, or similar CRM</li>
              <li><strong>Business model:</strong> Sells to enterprises with ACV &gt; $50k</li>
              <li><strong>Pain indicators:</strong> Just hired a VP of Sales (needs to build process)</li>
              <li><strong>Buying triggers:</strong> Recent funding round, new market expansion</li>
              <li><strong>Culture fit:</strong> Growth-focused, data-driven, fast-moving</li>
            </ul>

            <p>
              These attributes help you prioritize within your firmographic filters.
            </p>

            <h3>Step 4: Map the Buying Committee</h3>

            <p>
              Now define <strong>who</strong> you need to reach within these companies.
            </p>

            <p>
              For most B2B deals, you'll need to engage 3-5 stakeholders:
            </p>

            <ul>
              <li><strong>Champion:</strong> The person who feels the pain and drives the deal</li>
              <li><strong>Economic Buyer:</strong> Has budget authority</li>
              <li><strong>Decision Maker:</strong> Final sign-off</li>
              <li><strong>Influencers:</strong> Provide input (legal, IT, finance)</li>
              <li><strong>End Users:</strong> Will use the product</li>
            </ul>

            <div className="not-prose bg-blue-50 rounded-xl p-6 my-8 border border-blue-200">
              <h4 className="font-bold mb-4">Example Buying Committee</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-blue-200">
                    <th className="py-2 text-left">Role</th>
                    <th className="py-2 text-left">Title</th>
                    <th className="py-2 text-left">Primary Pain</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-blue-100">
                    <td className="py-2 font-medium">Champion</td>
                    <td className="py-2 text-gray-600">Director of Sales Ops</td>
                    <td className="py-2 text-gray-600">Manual processes, data chaos</td>
                  </tr>
                  <tr className="border-b border-blue-100">
                    <td className="py-2 font-medium">Economic Buyer</td>
                    <td className="py-2 text-gray-600">VP of Sales</td>
                    <td className="py-2 text-gray-600">Missing revenue targets</td>
                  </tr>
                  <tr className="border-b border-blue-100">
                    <td className="py-2 font-medium">Decision Maker</td>
                    <td className="py-2 text-gray-600">CRO</td>
                    <td className="py-2 text-gray-600">Pipeline predictability</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              Start with your champion. They're the one you'll reach in outbound. They'll bring in the others.
            </p>

            <h3>Step 5: Test and Refine</h3>

            <p>
              Your ICP is a hypothesis until you test it with real outbound campaigns.
            </p>

            <p>
              Run a small campaign (200-500 leads) targeting your defined ICP and track these metrics carefully:
            </p>

            <ul>
              <li><strong>Reply rate:</strong> Are people responding? Aim for 8-15% on cold outreach to ICP-fit leads.</li>
              <li><strong>Positive reply rate:</strong> What percentage of replies express genuine interest? Aim for 3-6%.</li>
              <li><strong>Meeting booked rate:</strong> How many leads convert to meetings? Aim for 1-3% of total outreach.</li>
              <li><strong>Sales cycle length:</strong> How long from first touch to closed deal? If it exceeds your target, the ICP may include companies with too many decision-makers or insufficient urgency.</li>
              <li><strong>Close rate:</strong> What percentage of meetings convert to deals? A low close rate despite high meeting rates suggests you are reaching interested people at the wrong companies.</li>
            </ul>

            <p>
              If results are below benchmark, your ICP needs work. Dig into the data and look for patterns:
            </p>

            <ul>
              <li>Are certain industries responding significantly better than others? Double down on those.</li>
              <li>Is company size too broad or too narrow? Test different size bands to find the sweet spot.</li>
              <li>Are you reaching the right titles? Maybe Directors respond at 12% but VPs respond at 4%.</li>
              <li>Do any qualifying attributes correlate with success? Maybe companies using a specific CRM or those that recently raised funding convert at 3x the rate.</li>
              <li>Are there disqualifying signals? Maybe companies with fewer than 5 employees never close, regardless of other attributes.</li>
            </ul>

            <p>
              Refine and test again. Most companies need 2-3 iterations over 60-90 days to dial in their ICP. Each iteration should be informed by actual campaign data, not assumptions. The companies that approach ICP definition as an ongoing, data-driven process consistently outperform those that define it once and never revisit it.
            </p>

            <h3>Bonus: Using Website Visitor Data to Refine Your ICP</h3>

            <p>
              One of the most underutilized data sources for ICP refinement is your own website traffic. Tools like Cursive identify who is visiting your website—their name, company, title, and the pages they view. This data is gold for ICP refinement because it tells you who is actively interested in your product, even if they have not filled out a form.
            </p>

            <p>
              Look at your highest-intent website visitors (those visiting pricing pages, product pages, or case studies) and compare their attributes to your current ICP definition. You may discover entire segments you had not considered. One Cursive customer discovered that CFOs at healthcare companies were visiting their pricing page at 3x the rate of any other title—a segment they had never targeted in outbound. Adding that segment to their ICP increased pipeline by 35%.
            </p>

            <h2>ICP vs. Buyer Persona</h2>

            <p>
              People confuse these. Here's the difference:
            </p>

            <div className="not-prose my-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="font-bold text-lg mb-3">ICP (Company Level)</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• B2B SaaS</li>
                    <li>• $5M-$50M ARR</li>
                    <li>• 50-500 employees</li>
                    <li>• Series A-C funded</li>
                    <li>• Uses Salesforce</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="font-bold text-lg mb-3">Buyer Persona (Individual)</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Director of Sales Ops</li>
                    <li>• 5-10 years experience</li>
                    <li>• Wants process automation</li>
                    <li>• Frustrated by manual work</li>
                    <li>• Data-driven decision maker</li>
                  </ul>
                </div>
              </div>
            </div>

            <p>
              You need both. ICP tells you which companies. Persona tells you who to reach and how to message.
            </p>

            <h2>Common ICP Mistakes</h2>

            <h3>1. Too Broad</h3>

            <p>
              "We sell to any company with sales teams" is not an ICP. You'll waste money on leads that
              don't convert.
            </p>

            <h3>2. Too Narrow</h3>

            <p>
              "Series B SaaS companies in San Francisco with 100-150 employees" might be too specific. You'll
              run out of leads in a month.
            </p>

            <p>
              Aim for an ICP that gives you 10,000-50,000 target companies.
            </p>

            <h3>3. Based on Wishful Thinking</h3>

            <p>
              "We want to sell to Fortune 500 companies" is aspirational. But if you've never closed one,
              your ICP should reflect who you <em>actually</em> close.
            </p>

            <h3>4. Never Updated</h3>

            <p>
              Your ICP should evolve as your product and business mature. Review quarterly.
            </p>

            <h2>How to Use Your ICP</h2>

            <p>
              Once defined, your ICP should be the central organizing principle for your entire go-to-market motion. It is not a document that sits in a Google Drive folder. It should actively drive decisions every day:
            </p>

            <ul>
              <li><strong>Lead list building:</strong> Use firmographic filters to build targeted lists that match your ICP criteria precisely. If a lead does not match, it should not be in your outbound pipeline, no matter how tempting it looks.</li>
              <li><strong>Messaging:</strong> Craft copy that speaks to your ICP's specific pain points, in their language, referencing their world. Generic messaging fails because it tries to appeal to everyone and ends up resonating with no one.</li>
              <li><strong>Sales prioritization:</strong> Score and rank leads by ICP fit. Your best reps should spend their time on the highest-fit opportunities, not first-come-first-served.</li>
              <li><strong>Product roadmap:</strong> Build features your ICP needs, not features that any random prospect asks for in a demo. Product-market fit starts with knowing exactly who your product is for.</li>
              <li><strong>Marketing content:</strong> Create blog posts, case studies, webinars, and resources that directly address ICP pain points. Content that attracts your ICP drives higher-quality inbound leads.</li>
              <li><strong>Hiring:</strong> Hire salespeople who have experience selling to your ICP. A rep with experience selling to mid-market SaaS companies will ramp faster if that is your ICP than a rep who has only sold to enterprise healthcare.</li>
              <li><strong>Partnership decisions:</strong> Choose technology partners, agency partners, and co-marketing partners that serve the same ICP. Their audience becomes your audience.</li>
            </ul>

            <p>
              Everyone in your company should know your ICP cold. From the CEO to the newest SDR, if someone asks "who is our ideal customer?" the answer should be specific, consistent, and immediate.
            </p>

            <h2>ICP Template</h2>

            <p>
              Use this template to document your ICP:
            </p>

            <div className="not-prose bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 my-8 border border-gray-200">
              <h4 className="font-bold text-xl mb-6">ICP: [Name]</h4>

              <div className="space-y-6">
                <div>
                  <h5 className="font-bold mb-2">Firmographics</h5>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Industry:</li>
                    <li>• Revenue:</li>
                    <li>• Employees:</li>
                    <li>• Location:</li>
                    <li>• Funding Stage:</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-bold mb-2">Qualifying Attributes</h5>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Tech Stack:</li>
                    <li>• Business Model:</li>
                    <li>• Pain Indicators:</li>
                    <li>• Buying Triggers:</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-bold mb-2">Buying Committee</h5>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Champion (Title):</li>
                    <li>• Economic Buyer (Title):</li>
                    <li>• Decision Maker (Title):</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-bold mb-2">Success Metrics</h5>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Target Reply Rate:</li>
                    <li>• Target Meeting Rate:</li>
                    <li>• Target Close Rate:</li>
                    <li>• Average Deal Size:</li>
                    <li>• Sales Cycle Length:</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2>The Bottom Line</h2>

            <p>
              Great ICP = Great pipeline. It really is that straightforward.
            </p>

            <p>
              Stop trying to sell to everyone. Get crystal clear on who you are built for, and go all-in
              on reaching them. The energy you save by not chasing bad-fit prospects can be redirected toward winning more of the right ones.
            </p>

            <p>
              The companies that win in B2B are the ones who understand their ICP better than anyone else—who obsessively study their best customers, refine their targeting based on real data, and have the discipline to say no to opportunities that fall outside their focus. That discipline is hard, especially when revenue pressure is high. But it is the single most impactful thing you can do for your pipeline.
            </p>

            <p>
              If you are not sure where to start, Cursive can help. Our platform identifies your website visitors and shows you exactly who is engaging with your content—giving you real data to validate and refine your ICP. Combined with our done-for-you outreach services, we help you go from ICP definition to booked meetings in weeks, not months.
            </p>


            <h2>About the Author</h2>
            <p>
              <strong>Adam Wolfe</strong> is the founder of Cursive. He's helped 500+ B2B companies
              refine their ICPs and build better pipelines.
            </p>
          </article>
        </Container>
      </section>

      {/* CTA Section */}
      <DashboardCTA
        headline="Need Help Defining"
        subheadline="Your ICP?"
        description="We'll run a free ICP workshop and build your first targeted list. Get crystal clear on who you're built for."
      />

      {/* Related Posts */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <h2 className="text-3xl font-bold mb-8 text-center">Read Next</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link href="/blog/cold-email-2026" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">Cold Email in 2026</h3>
              <p className="text-sm text-gray-600">What's still working and what's not</p>
            </Link>
            <Link href="/blog/ai-sdr-vs-human-bdr" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">AI SDR vs. Human BDR</h3>
              <p className="text-sm text-gray-600">90-day head-to-head comparison</p>
            </Link>
            <Link href="/blog/scaling-outbound" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">Scaling Outbound</h3>
              <p className="text-sm text-gray-600">10 to 200+ emails without killing quality</p>
            </Link>
          </div>
        </Container>
      </section>
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">The 5-Step Framework for Perfect ICP Targeting</h1>

          <p className="text-gray-700 mb-6">
            A practical guide for B2B marketers to define, target, and refine their Ideal Customer Profile (ICP) using data-driven strategies. Published: January 21, 2026. Author: Adam Wolfe, Founder of Cursive.
          </p>

          <MachineSection title="Key Takeaways">
            <MachineList items={[
              "Most B2B companies waste 60-70% of outbound budget targeting wrong prospects",
              "ICP = type of company that gets most value, has budget/authority, easy to sell to",
              "ICP ≠ buyer persona (ICP is company-level, persona is individual-level)",
              "Companies with tight ICP see 2-3x improvement in pipeline efficiency",
              "ICP should be narrow, specific, data-driven, and regularly updated"
            ]} />
          </MachineSection>

          <MachineSection title="What is an ICP?">
            <p className="text-gray-700 mb-3">
              Ideal Customer Profile (ICP) is the type of company that:
            </p>
            <MachineList items={[
              "Gets the most value from your product",
              "Has budget and authority to buy",
              "Experiences efficient, repeatable sales motion",
              "Is a focused subset of TAM, not the entire addressable market",
              "Should be narrow and specific to increase conversion rates"
            ]} />
            <p className="text-gray-700 mt-3">
              ICP is NOT: a buyer persona (individual level), your total addressable market, "any company that could use our product", or a static document.
            </p>
          </MachineSection>

          <MachineSection title="Why ICP Matters: Impact Metrics">
            <p className="text-gray-700 mb-3">
              When you nail your ICP, every sales funnel metric improves:
            </p>
            <MachineList items={[
              "Reply rates: 2-3x improvement (generic → specific pain points)",
              "Sales cycles: 40-60% shorter (right budget, authority, urgency)",
              "Close rates: 2-3x improvement (obvious product-market fit)",
              "Churn: 30-50% reduction (right customers stick around)",
              "Marketing effectiveness: Higher conversion rates (resonant messaging)",
              "Sales morale: Reps close more, earn more, stay longer",
              "Pipeline efficiency: 2-3x more revenue with same headcount/effort"
            ]} />
          </MachineSection>

          <MachineSection title="5-Step ICP Framework">
            <div className="space-y-4">
              <div>
                <p className="font-bold text-gray-900 mb-2">Step 1: Analyze Your Best Customers</p>
                <p className="text-gray-700 mb-2">
                  Pull top 10-20 customers from CRM who: closed quickly, pay full price, use product actively, expand over time, refer others, generate low support volume.
                </p>
                <MachineList items={[
                  "Look for patterns: industries, revenue range, employee count, location, growth stage, tech stack, acquisition channel",
                  "Also analyze WORST customers (churned quickly, heavy discounts, high support) to build negative filters",
                  "Create spreadsheet with top 20 + bottom 20 customers, fill in all attributes"
                ]} />
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-2">Step 2: Define Firmographic Criteria</p>
                <p className="text-gray-700 mb-2">
                  Quantitative attributes used to build lead lists. Be specific, not vague.
                </p>
                <MachineList items={[
                  "Industry: Specific verticals (e.g., 'B2B SaaS' not 'technology')",
                  "Revenue: Exact range (e.g., '$5M-$50M ARR' not 'small to mid-size')",
                  "Employees: Number range (e.g., '50-500')",
                  "Location: Countries/regions (e.g., 'United States, Canada, UK')",
                  "Funding Stage: Series A-C, bootstrapped, etc.",
                  "Growth Signals: Hiring patterns (e.g., '3+ open sales roles')"
                ]} />
                <p className="text-gray-700 mt-2">
                  Example ICP: B2B SaaS companies, $5M-$50M ARR, 50-500 employees, US/Canada/UK, Series A-C, hiring 3+ sales reps.
                </p>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-2">Step 3: Identify Qualifying Attributes</p>
                <p className="text-gray-700 mb-2">
                  Qualitative signals that indicate fit (harder to filter programmatically but differentiate good from great leads).
                </p>
                <MachineList items={[
                  "Tech stack: Uses Salesforce, HubSpot, or similar CRM",
                  "Business model: Sells to enterprises with ACV > $50k",
                  "Pain indicators: Just hired VP of Sales (needs process)",
                  "Buying triggers: Recent funding round, new market expansion",
                  "Culture fit: Growth-focused, data-driven, fast-moving"
                ]} />
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-2">Step 4: Map the Buying Committee</p>
                <p className="text-gray-700 mb-2">
                  Define WHO to reach within ICP companies. Most B2B deals require engaging 3-5 stakeholders:
                </p>
                <MachineList items={[
                  "Champion: Feels the pain, drives the deal internally",
                  "Economic Buyer: Has budget authority to approve purchase",
                  "Decision Maker: Final sign-off authority",
                  "Influencers: Provide input (legal, IT, finance, security)",
                  "End Users: Will actually use the product day-to-day"
                ]} />
                <p className="text-gray-700 mt-2">
                  Example: Champion = Director of Sales Ops (manual processes pain), Economic Buyer = VP Sales (missing targets), Decision Maker = CRO (pipeline predictability). Start outbound with champion.
                </p>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-2">Step 5: Test and Refine</p>
                <p className="text-gray-700 mb-2">
                  ICP is a hypothesis until tested with real campaigns. Run small campaign (200-500 leads) and track:
                </p>
                <MachineList items={[
                  "Reply rate: 8-15% target on cold outreach to ICP-fit leads",
                  "Positive reply rate: 3-6% expressing genuine interest",
                  "Meeting booked rate: 1-3% of total outreach",
                  "Sales cycle length: Should meet target timeline",
                  "Close rate: % of meetings converting to deals"
                ]} />
                <p className="text-gray-700 mt-2">
                  If below benchmarks, refine: analyze which industries/sizes/titles respond better, identify correlating attributes, find disqualifying signals. Iterate 2-3 times over 60-90 days using campaign data.
                </p>
              </div>
            </div>
          </MachineSection>

          <MachineSection title="Bonus: Using Website Visitor Data">
            <p className="text-gray-700 mb-3">
              Underutilized ICP refinement data source: your own website traffic. Tools like Cursive identify visitors (name, company, title, pages viewed).
            </p>
            <MachineList items={[
              "Analyze high-intent visitors (pricing pages, product pages, case studies)",
              "Compare their attributes to current ICP definition",
              "May discover untargeted segments with high intent",
              "Example: One Cursive customer found CFOs at healthcare companies visiting pricing 3x more than other titles → added to ICP → 35% pipeline increase"
            ]} />
          </MachineSection>

          <MachineSection title="ICP vs Buyer Persona">
            <div className="space-y-3">
              <p className="font-bold text-gray-900">ICP (Company Level):</p>
              <MachineList items={[
                "B2B SaaS industry",
                "$5M-$50M ARR",
                "50-500 employees",
                "Series A-C funded",
                "Uses Salesforce"
              ]} />

              <p className="font-bold text-gray-900 mt-4">Buyer Persona (Individual Level):</p>
              <MachineList items={[
                "Director of Sales Ops title",
                "5-10 years experience",
                "Wants process automation",
                "Frustrated by manual work",
                "Data-driven decision maker"
              ]} />

              <p className="text-gray-700 mt-3">
                You need BOTH. ICP tells you which companies. Persona tells you who to reach and how to message.
              </p>
            </div>
          </MachineSection>

          <MachineSection title="Common ICP Mistakes">
            <MachineList items={[
              "Too Broad: 'Any company with sales teams' wastes money on non-converting leads",
              "Too Narrow: 'Series B SaaS in SF with 100-150 employees' exhausts leads in a month. Aim for 10,000-50,000 target companies.",
              "Based on Wishful Thinking: 'We want Fortune 500' is aspirational. ICP should reflect who you ACTUALLY close, not who you wish to close.",
              "Never Updated: ICP should evolve as product/business matures. Review quarterly based on new data."
            ]} />
          </MachineSection>

          <MachineSection title="How to Use Your ICP">
            <p className="text-gray-700 mb-3">
              ICP should be the central organizing principle for entire go-to-market motion. Not a document in Google Drive, but actively driving daily decisions:
            </p>
            <MachineList items={[
              "Lead list building: Use firmographic filters to match ICP criteria precisely",
              "Messaging: Craft copy for ICP's specific pain points in their language",
              "Sales prioritization: Score/rank leads by ICP fit, best reps on highest-fit opps",
              "Product roadmap: Build features ICP needs, not random prospect requests",
              "Marketing content: Create resources addressing ICP pain points specifically",
              "Hiring: Hire salespeople with experience selling to your ICP",
              "Partnership decisions: Choose partners serving same ICP (shared audience)"
            ]} />
            <p className="text-gray-700 mt-3">
              Everyone in company (CEO to newest SDR) should know ICP cold. Answer to "who is our ideal customer?" should be specific, consistent, immediate.
            </p>
          </MachineSection>

          <MachineSection title="ICP Template">
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <p className="font-bold">ICP: [Name]</p>

              <div>
                <p className="font-bold text-sm mb-1">Firmographics:</p>
                <MachineList items={[
                  "Industry: _______",
                  "Revenue: _______",
                  "Employees: _______",
                  "Location: _______",
                  "Funding Stage: _______"
                ]} />
              </div>

              <div>
                <p className="font-bold text-sm mb-1">Qualifying Attributes:</p>
                <MachineList items={[
                  "Tech Stack: _______",
                  "Business Model: _______",
                  "Pain Indicators: _______",
                  "Buying Triggers: _______"
                ]} />
              </div>

              <div>
                <p className="font-bold text-sm mb-1">Buying Committee:</p>
                <MachineList items={[
                  "Champion (Title): _______",
                  "Economic Buyer (Title): _______",
                  "Decision Maker (Title): _______"
                ]} />
              </div>

              <div>
                <p className="font-bold text-sm mb-1">Success Metrics:</p>
                <MachineList items={[
                  "Target Reply Rate: _______",
                  "Target Meeting Rate: _______",
                  "Target Close Rate: _______",
                  "Average Deal Size: _______",
                  "Sales Cycle Length: _______"
                ]} />
              </div>
            </div>
          </MachineSection>

          <MachineSection title="Implementation with Cursive">
            <p className="text-gray-700 mb-3">
              Cursive helps define and refine ICP through:
            </p>
            <MachineList items={[
              "Visitor identification: See which companies/titles visit your site in real-time",
              "Intent data: Identify high-intent visitors (pricing pages, product pages, case studies)",
              "Pattern analysis: Compare visitor attributes to current ICP, discover new segments",
              "Done-for-you outreach: From ICP definition to booked meetings in weeks",
              "Free ICP workshop: Crystal clear definition of who you're built for"
            ]} />
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "Cold Email in 2026", href: "/blog/cold-email-2026", description: "What's still working and what's not in modern cold outreach" },
              { label: "AI SDR vs. Human BDR", href: "/blog/ai-sdr-vs-human-bdr", description: "90-day head-to-head comparison of AI and human outbound" },
              { label: "Scaling Outbound", href: "/blog/scaling-outbound", description: "How to scale from 10 to 200+ emails without killing quality" }
            ]} />
          </MachineSection>

          <MachineSection title="Get Started with Cursive">
            <p className="text-gray-700 mb-3">
              Cursive provides visitor identification, intent data, and done-for-you outbound services to help B2B companies define their ICP and convert high-fit prospects.
            </p>
            <MachineList items={[
              { label: "Platform Overview", href: "/platform", description: "Visitor identification, intent data, AI outreach" },
              { label: "Pricing", href: "/pricing", description: "Self-serve marketplace + done-for-you services" },
              { label: "Visitor Identification", href: "/visitor-identification", description: "70% identification rate for B2B traffic" },
              { label: "Book a Demo", href: "/book", description: "Free ICP workshop and targeted list building" }
            ]} />
          </MachineSection>

          <MachineSection title="About the Author">
            <p className="text-gray-700">
              Adam Wolfe is the founder of Cursive. He has helped 500+ B2B companies refine their ICPs and build better pipelines through data-driven targeting and personalized outbound strategies.
            </p>
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
