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
        title: "What Is WebMCP? A Practical Guide for B2B Marketers and Growth Teams",
        description: "Google's WebMCP standard lets AI agents interact with your website through structured tools instead of scraping. Here's what it is, how it works, and why B2B teams should care.",
        author: "Cursive Team",
        publishDate: "2026-02-15",
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
                AI &amp; Automation
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                What Is WebMCP? A Practical Guide for B2B Marketers and Growth Teams
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Google&apos;s WebMCP standard lets AI agents interact with your website through structured tools instead of scraping. Here&apos;s what it is, how it works, and why B2B teams should care.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>February 15, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>8 min read</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Article Content */}
        <section className="py-16 bg-white">
          <Container>
            <article className="max-w-3xl mx-auto prose prose-lg prose-blue">

              {/* Section 1: The 30-Second Version */}
              <p className="lead">
                If you only have thirty seconds, here&apos;s what you need to know: WebMCP is a new web standard from Google and Microsoft that lets your website tell AI agents exactly what it can do. Instead of an agent guessing at your UI by screenshotting pages and parsing HTML, you publish a structured menu of actions the agent can call directly. One standard. One integration point. Every AI agent that supports it gets clean, reliable access to your product information.
              </p>

              <p>
                The simplest analogy is a restaurant. Today, an AI agent trying to understand your website is like someone standing outside a restaurant, pressing their face against the window, trying to read the menu from across the room, guessing which dishes exist based on what they can see on other diners&apos; tables. WebMCP is handing that agent a printed menu with every dish, every price, and a button to place an order. Same restaurant. Radically different experience.
              </p>

              <p>
                That shift matters more than it sounds. Because the next visitor to your website might not be a human at all &mdash; it might be an AI agent evaluating your product on behalf of a prospect. And how your site communicates with that agent will determine whether you make the shortlist or get skipped entirely.
              </p>

              {/* Section 2: Why It Exists */}
              <h2 id="why-webmcp-exists">Why WebMCP Exists</h2>

              <p>
                To understand why WebMCP matters, you need to understand how AI agents interact with websites today. It&apos;s not pretty.
              </p>

              <p>
                When an AI agent &mdash; say, Claude or Gemini operating inside a browser &mdash; needs to gather information from a website, it follows a process that would feel familiar to anyone who&apos;s tried to automate web scraping. The agent takes a screenshot. It sends that screenshot through a vision model to identify text, buttons, links, and layout. It tries to figure out which elements are clickable, which contain the data it needs, and what sequence of actions will get it to the right page. Then it clicks, waits, screenshots again, and repeats.
              </p>

              <p>
                Every step in that pipeline costs tokens. Every screenshot burns compute. Every misidentified button &mdash; an agent clicking &ldquo;Learn More&rdquo; when it meant to click &ldquo;See Pricing&rdquo; &mdash; wastes time and money. Minor design changes can break the entire flow. A/B tests that shift a button from left to right can confuse an agent that was trained on the previous layout. It&apos;s brittle, expensive, and fundamentally the wrong approach to a problem that has an obvious structured solution.
              </p>

              <p>
                WebMCP replaces that entire pipeline with a single structured function call. Instead of screenshotting your pricing page, parsing a CSS grid of cards, and trying to extract numbers from decorative typography, an agent calls <code>getPricing()</code> and gets clean JSON back. According to <a href="https://venturebeat.com/infrastructure/google-chrome-ships-webmcp-in-early-preview-turning-every-website-into-a" target="_blank" rel="noopener noreferrer">early benchmarks reported by VentureBeat</a>, this approach reduces computational overhead by 67% compared to visual agent methods. One function call replaces dozens of browser interactions.
              </p>

              <p>
                The standard was developed jointly by Google and Microsoft under the W3C, which means it has the institutional backing to become a real part of how the web works &mdash; not a niche experiment that disappears in six months. Chrome 146 shipped the early preview. Edge support is expected to follow. The <a href="https://github.com/webmachinelearning/webmcp" target="_blank" rel="noopener noreferrer">spec is public on GitHub</a>, and the developer tooling is already available for testing.
              </p>

              {/* Section 3: The Two APIs */}
              <h2 id="the-two-apis">The Two APIs &mdash; In Plain English</h2>

              <p>
                WebMCP gives you two ways to expose your website&apos;s functionality to AI agents. Think of them as two levels of effort with two levels of power.
              </p>

              <p>
                The <strong>Declarative API</strong> is the low-effort entry point. If you already have HTML forms on your site &mdash; contact forms, demo request forms, search bars, signup flows &mdash; you can make them agent-readable by adding a few attributes. You add <code>toolname</code> and <code>tooldescription</code> to the <code>&lt;form&gt;</code> element, and <code>toolparamdescription</code> to each input where the field name alone isn&apos;t self-explanatory. That&apos;s it. The agent sees your form, reads the descriptions, understands what each field expects, and can submit it programmatically with the right data.
              </p>

              <p>
                The best analogy for the Declarative API is alt text on images. You&apos;re not building anything new. You&apos;re annotating what already exists so that a non-visual consumer &mdash; in this case, an AI agent instead of a screen reader &mdash; can understand and interact with it. If you can add an HTML attribute, you can implement the Declarative API. Thirty minutes of work for most sites.
              </p>

              <p>
                The <strong>Imperative API</strong> is where things get powerful. Instead of annotating existing forms, you register JavaScript functions as callable tools using <code>navigator.modelContext.registerTool()</code>. Each tool has a name, a description, an input schema (what parameters it accepts), and an execute function that returns structured data. An agent discovers your tools, understands what they do from the descriptions, calls them with the right parameters, and gets JSON back.
              </p>

              <p>
                The analogy here is building an API &mdash; except it runs in the browser and is discovered automatically by any AI agent that supports the standard. You&apos;re not building REST endpoints or managing authentication. You&apos;re registering functions that the browser exposes to agents on your behalf. If your pricing lives in a JavaScript object, you can expose it as a tool in twenty lines of code. If your competitor comparison data lives in a CMS, you can fetch it and return it as structured JSON. The agent never touches your DOM. It calls your function and gets clean data.
              </p>

              <p>
                For a deeper technical walkthrough, the <a href="https://developer.chrome.com/blog/webmcp-epp" target="_blank" rel="noopener noreferrer">Chrome developer blog post</a> covers both APIs with code examples and testing instructions.
              </p>

              {/* Section 4: What This Means for B2B Companies */}
              <h2 id="what-this-means-for-b2b">What This Means for B2B Companies</h2>

              <p>
                Here&apos;s where this stops being a technical curiosity and starts being a competitive advantage.
              </p>

              <p>
                AI agents are becoming part of the B2B buyer&apos;s journey. Not hypothetically &mdash; right now. When a VP of Marketing asks their AI assistant to &ldquo;find me a visitor identification platform under $3K a month that integrates with HubSpot,&rdquo; that assistant is going to visit vendor websites, gather information, and build a comparison. The <Link href="/blog/ai-agents-replacing-buyer-journey" className="text-blue-600 hover:underline">buyer&apos;s journey is shifting from human-driven research to agent-driven evaluation</Link>, and the websites that communicate well with those agents will get recommended more often.
              </p>

              <p>
                Think about what happens when an agent evaluates five vendors. It visits each website and tries to extract pricing, features, integrations, and a path to book a demo. The site that exposes all of this through WebMCP tools gives the agent a clean, fast, reliable path. The agent calls <code>getPricing()</code>, gets structured JSON, moves on. The site that doesn&apos;t implement WebMCP forces the agent to screenshot the pricing page, try to parse a complex layout, guess which toggle switches between monthly and annual billing, and hope the numbers it extracts are correct. That&apos;s slower, more expensive, and more error-prone. When the agent is building a comparison table for a human decision-maker, the vendor with clean structured data will be represented accurately. The vendor whose data was scraped from pixel layouts will have gaps, errors, and question marks.
              </p>

              <p>
                This is the structured data moment for the agentic web. In the mid-2010s, companies that added Schema.org markup to their pages won featured snippets, knowledge panels, and rich results in Google. The markup didn&apos;t change what was on the page &mdash; it changed how machines understood it. WebMCP is the same inflection point, except the machines aren&apos;t search engine crawlers. They&apos;re AI agents making purchasing recommendations.
              </p>

              <p>
                Early movers get disproportionate advantage. The first companies in each B2B category to implement WebMCP will train agents to prefer their structured path. As more buyer journeys start with &ldquo;ask my AI assistant to research this,&rdquo; the companies that are already agent-readable will capture a growing share of that traffic. The ones that aren&apos;t will wonder why their pipeline is shrinking even though their human traffic looks the same.
              </p>

              <p>
                At Cursive, we built our entire <Link href="/platform" className="text-blue-600 hover:underline">platform</Link> around the idea that knowing who&apos;s on your website &mdash; and reaching them in real time &mdash; is the highest-leverage growth motion in B2B. That thesis extends naturally to agentic traffic. When an AI agent visits your <Link href="/pricing" className="text-blue-600 hover:underline">pricing page</Link> on behalf of a prospect, that visit is a signal of active evaluation. With <Link href="/visitor-identification" className="text-blue-600 hover:underline">Cursive&apos;s visitor identification</Link>, you see that signal in real time and can act on it before your competitors even know the evaluation is happening.
              </p>

              {/* Section 5: What You Should Do This Week */}
              <h2 id="what-to-do-this-week">What You Should Do This Week</h2>

              <p>
                You don&apos;t need to overhaul your website to start benefiting from the agentic web. Here are five steps, ranked from easiest to most involved, that you can work through over the next few days.
              </p>

              <p>
                <strong>Step 1: Add an <code>llms.txt</code> file to your site root (30 minutes).</strong> Think of this as <code>robots.txt</code> for AI. It&apos;s a plain-text file at <code>yourdomain.com/llms.txt</code> that tells language models what your company does, what products you offer, and where to find key information. No spec to follow, no build step, no framework dependency. Just a text file that gives any LLM a structured entry point to your site. This works today, independent of any browser standard, and every major AI model already checks for it.
              </p>

              <p>
                <strong>Step 2: Create a <code>/api/ai-info</code> JSON endpoint (1 hour).</strong> Build a single API route that returns your product information as structured JSON &mdash; company overview, products, pricing tiers, key stats, customer results, and links to important pages. Any LLM or agent can fetch this URL and get your complete product story in one request. Cache it for an hour, keep it updated when your pricing changes, and you have a universal machine-readable interface to your business that works regardless of whether the agent supports WebMCP.
              </p>

              <p>
                <strong>Step 3: Add <code>toolname</code> and <code>tooldescription</code> to your forms (1 hour).</strong> This is the Declarative API in action. Go through every form on your site &mdash; contact form, demo request, newsletter signup, search bar &mdash; and add the WebMCP attributes. The <code>toolname</code> should be a concise, descriptive name like <code>requestDemo</code> or <code>contactSales</code>. The <code>tooldescription</code> should explain what the form does and what happens when it&apos;s submitted. Add <code>toolparamdescription</code> to any input where the field name alone might be ambiguous. This is the lowest-effort way to make your existing site agent-interactive.
              </p>

              <p>
                <strong>Step 4: Register imperative tools for your core value propositions (half day).</strong> Ask yourself: what would a prospect&apos;s AI assistant want to know? Pricing. How you compare to competitors. What results you&apos;ve driven for similar companies. How to get started. Each of those is a tool. Register them via <code>navigator.modelContext.registerTool()</code> with clear names, descriptions, and input schemas. Return structured JSON. This is where the real differentiation happens &mdash; you&apos;re building the agent experience the same way you once built the mobile experience.
              </p>

              <p>
                <strong>Step 5: Test with Chrome 146 Canary and the Model Context Tool Inspector (1 hour).</strong> Download Chrome Canary, enable the Experimental Web Platform Features flag, and install the Model Context Tool Inspector extension. Load your site, open the inspector panel, and verify that your tools appear, your descriptions are clear, and your functions return the data you expect. This is your agent-side QA process. If the inspector can see your tools and call them successfully, so can any browser-based AI agent.
              </p>

              <p>
                For a full technical implementation guide with code examples, see our <Link href="/blog/webmcp-implementation-guide-b2b-saas" className="text-blue-600 hover:underline">step-by-step WebMCP implementation guide for B2B SaaS</Link>.
              </p>

              {/* Final CTA */}
              <h2 id="the-agentic-web-is-here">The Agentic Web Is Here</h2>

              <p>
                WebMCP isn&apos;t a future trend to watch. It shipped in Chrome 146. The standard is live. The tools are available. The question is whether your website is ready for the agents that are already visiting it.
              </p>

              <p>
                At <a href="https://www.meetcursive.com">Cursive</a>, we&apos;ve already implemented WebMCP across our entire site &mdash; six imperative tools, seven annotated forms, plus <code>llms.txt</code>, a JSON API endpoint, and full structured data coverage. We did it because we believe the companies that build for the agentic web today will have a compounding advantage over the next two years. You can read the full story of what we built and why in our companion article: <Link href="/blog/webmcp-ai-agent-ready-lead-generation" className="text-blue-600 hover:underline">Why We Made Cursive the First AI-Agent-Ready Lead Gen Platform</Link>.
              </p>

              <p>
                If you want to see who&apos;s already visiting your site &mdash; human or AI agent &mdash; and start turning that traffic into pipeline, <a href="/book" target="_blank" rel="noopener noreferrer">book a demo</a> and we&apos;ll show you in real time. The agentic web rewards the companies that are ready for it. Don&apos;t be the one the agents skip.
              </p>

            </article>
          </Container>
        </section>

        {/* CTA Section */}
        <DashboardCTA
          headline="Ready to See Who's"
          subheadline="Visiting Your Site?"
          description="Whether your next prospect arrives in person or sends an AI agent, Cursive identifies them in real-time. Book a free AI audit and see which companies are evaluating you right now."
        />

        {/* Related Posts */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
          <Container>
            <h2 className="text-3xl font-bold mb-8 text-center">Read Next</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Link href="/blog/webmcp-ai-agent-ready-lead-generation" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <h3 className="font-bold mb-2">Why We Made Cursive Agent-Ready</h3>
                <p className="text-sm text-gray-600">How we implemented WebMCP across our entire platform</p>
              </Link>
              <Link href="/blog/ai-agents-replacing-buyer-journey" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <h3 className="font-bold mb-2">Your Next Lead Won&apos;t Fill Out a Form</h3>
                <p className="text-sm text-gray-600">How AI agents are reshaping the B2B buyer&apos;s journey</p>
              </Link>
              <Link href="/blog/webmcp-implementation-guide-b2b-saas" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <h3 className="font-bold mb-2">WebMCP Implementation Guide</h3>
                <p className="text-sm text-gray-600">Step-by-step code for adding WebMCP to your B2B site</p>
              </Link>
            </div>
          </Container>
        </section>
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">What Is WebMCP? A Practical Guide for B2B Marketers</h1>

          <p className="text-gray-700 mb-6">
            WebMCP is a web standard from Google and Microsoft that lets your website tell AI agents exactly what it can do through structured tools instead of screenshotting and scraping HTML. Published: February 15, 2026.
          </p>

          <MachineSection title="Key Takeaways">
            <MachineList items={[
              "WebMCP = Web Model Context Protocol - W3C standard for AI agent interactions",
              "Two APIs: Declarative (annotate forms) and Imperative (register JS tools)",
              "Reduces AI agent computational overhead by 67% vs. visual scraping",
              "Ships in Chrome 146 Canary, Edge support coming, backed by Google/Microsoft/W3C",
              "Early movers gain advantage as AI agents become part of B2B buyer journey"
            ]} />
          </MachineSection>

          <MachineSection title="Why WebMCP Exists">
            <p className="text-gray-700 mb-3">
              Today, AI agents interact with websites by taking screenshots, using vision models to parse layouts, and clicking through UIs. This process is slow, expensive (tokens/compute), brittle (breaks with design changes), and error-prone.
            </p>
            <p className="text-gray-700 mb-3">
              WebMCP replaces visual scraping with structured function calls. Instead of screenshotting a pricing page, an agent calls getPricing() and gets clean JSON. One function call replaces dozens of browser interactions.
            </p>
          </MachineSection>

          <MachineSection title="The Two APIs">
            <div className="space-y-4">
              <div>
                <p className="font-bold text-gray-900 mb-2">Declarative API (Low Effort):</p>
                <MachineList items={[
                  "Annotate existing HTML forms with toolname, tooldescription attributes",
                  "Add toolparamdescription to form inputs for clarity",
                  "No JavaScript required, works like alt text for images",
                  "Implementation time: 30-60 minutes for most sites"
                ]} />
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-2">Imperative API (High Power):</p>
                <MachineList items={[
                  "Register JavaScript functions via navigator.modelContext.registerTool()",
                  "Define tool name, description, input schema (JSON Schema), execute function",
                  "Returns structured JSON to agents",
                  "Like building an API that runs in browser, auto-discovered by agents"
                ]} />
              </div>
            </div>
          </MachineSection>

          <MachineSection title="What This Means for B2B Companies">
            <p className="text-gray-700 mb-3">
              AI agents are becoming part of the B2B buyer journey RIGHT NOW. When a VP asks their AI assistant to find a visitor identification platform under $3K/month that integrates with HubSpot, that agent visits vendor websites and builds a comparison.
            </p>
            <MachineList items={[
              "Sites with WebMCP: Agent calls getPricing(), gets clean JSON, moves on",
              "Sites without WebMCP: Agent screenshots, parses layouts, guesses numbers - slow, error-prone",
              "Accurate structured data = better representation in agent-generated comparisons",
              "Early movers train agents to prefer their structured path",
              "This is the Schema.org moment for the agentic web"
            ]} />
          </MachineSection>

          <MachineSection title="5-Step Implementation Plan">
            <MachineList items={[
              "Step 1: Add llms.txt to site root (30 min) - Plain-text guide for AI models",
              "Step 2: Create /api/ai-info JSON endpoint (1 hour) - Structured product data",
              "Step 3: Add toolname/tooldescription to forms (1 hour) - Declarative API",
              "Step 4: Register imperative tools for pricing/comparisons/results (half day)",
              "Step 5: Test with Chrome 146 Canary + Model Context Tool Inspector (1 hour)"
            ]} />
          </MachineSection>

          <MachineSection title="Browser Support">
            <MachineList items={[
              "Chrome 146 Canary (shipping now with Experimental Web Platform Features flag)",
              "Edge support expected to follow",
              "W3C standard with Google/Microsoft backing",
              "GitHub spec: github.com/webmachinelearning/webmcp"
            ]} />
          </MachineSection>

          <MachineSection title="Cursive Implementation">
            <p className="text-gray-700 mb-3">
              Cursive has already implemented WebMCP across our entire platform: 6 imperative tools (getPricing, compareCursiveToCompetitor, getCursiveCapabilities, bookDemo, getResults, getIndustries), 7 annotated forms, llms.txt, /api/ai-info endpoint, and full structured data.
            </p>
            <p className="text-gray-700">
              Read the full implementation story: <MachineLink href="/blog/webmcp-ai-agent-ready-lead-generation">Why We Made Cursive the First AI-Agent-Ready Lead Gen Platform</MachineLink>
            </p>
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "Why We Made Cursive Agent-Ready", href: "/blog/webmcp-ai-agent-ready-lead-generation", description: "How we implemented WebMCP across our platform" },
              { label: "Your Next Lead Won't Fill Out a Form", href: "/blog/ai-agents-replacing-buyer-journey", description: "How AI agents are reshaping the B2B buyer's journey" },
              { label: "WebMCP Implementation Guide", href: "/blog/webmcp-implementation-guide-b2b-saas", description: "Step-by-step code for adding WebMCP to your B2B SaaS site" },
              { label: "VentureBeat Coverage", href: "https://venturebeat.com/infrastructure/google-chrome-ships-webmcp-in-early-preview-turning-every-website-into-a", description: "Google Chrome Ships WebMCP in Early Preview" },
              { label: "Chrome Developer Blog", href: "https://developer.chrome.com/blog/webmcp-epp", description: "Official WebMCP documentation and code examples" },
              { label: "W3C Spec", href: "https://github.com/webmachinelearning/webmcp", description: "Full technical specification on GitHub" }
            ]} />
          </MachineSection>

          <MachineSection title="Get Started with Cursive">
            <p className="text-gray-700 mb-3">
              Cursive identifies website visitors in real-time - whether they&apos;re human prospects or AI agents evaluating your product. See who&apos;s on your site right now and turn that traffic into pipeline.
            </p>
            <MachineList items={[
              { label: "Platform Overview", href: "/platform", description: "Visitor identification, intent data, AI outreach" },
              { label: "Pricing", href: "/pricing", description: "Self-serve marketplace + done-for-you services" },
              { label: "Visitor Identification", href: "/visitor-identification", description: "70% identification rate for B2B traffic" },
              { label: "Book a Demo", href: "/book", description: "See Cursive in real-time" }
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
