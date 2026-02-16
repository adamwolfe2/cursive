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
        title: "How to Implement WebMCP on Your B2B SaaS Website (With Real Code)",
        description: "Step-by-step guide to implementing WebMCP on a Next.js B2B site. Includes declarative forms, imperative tool registration, llms.txt, and testing with Chrome 146.",
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
              Engineering
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              How to Implement WebMCP on Your B2B SaaS Website (With Real Code)
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              The definitive implementation guide for WebMCP &mdash; from your first declarative form attribute to a full imperative tool suite. Real code, real patterns, ready to ship.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>February 15, 2026</span>
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

            {/* Section 1: Opening */}
            <p className="lead">
              Google shipped WebMCP in Chrome 146&apos;s early preview, and as of today, almost nobody has published a real implementation guide. We just built one of the most comprehensive WebMCP implementations on any B2B site &mdash; six imperative tools, seven declarative forms, and a full supporting infrastructure stack &mdash; and this is everything we learned, distilled into code you can ship this week.
            </p>

            <p>
              If you haven&apos;t read the background on what WebMCP is or why it matters for B2B, start with our <Link href="/blog/what-is-webmcp-guide">non-technical guide</Link> or the <Link href="/blog/webmcp-ai-agent-ready-lead-generation">deep dive on why we made Cursive agent-ready</Link>. This post assumes you know what WebMCP does and you want to build it. The concepts are framework-agnostic &mdash; the standard is just HTML attributes and browser APIs &mdash; but every example here uses Next.js and React because that&apos;s what most B2B SaaS teams run on. If you&apos;re on Nuxt, Astro, SvelteKit, or even plain HTML, the patterns translate directly.
            </p>

            <p>
              Let&apos;s build.
            </p>

            {/* Section 2: Prerequisites */}
            <h2 id="prerequisites">Prerequisites</h2>

            <p>
              Before writing any code, you need three things set up in your environment:
            </p>

            <p>
              <strong>A modern web framework.</strong> Next.js 14+, Nuxt 3, Astro, SvelteKit &mdash; anything that renders HTML. WebMCP works at the browser level, so it doesn&apos;t care about your server framework. If you can write a <code>&lt;form&gt;</code> tag or execute JavaScript in the browser, you can implement WebMCP. The examples here use Next.js App Router with React, but the declarative API is pure HTML and the imperative API is vanilla JavaScript.
            </p>

            <p>
              <strong>Chrome 146 Canary with the experimental flag.</strong> WebMCP shipped in Chrome 146&apos;s early preview program. Download <a href="https://developer.chrome.com/blog/webmcp-epp" target="_blank" rel="noopener noreferrer">Chrome Canary</a>, navigate to <code>chrome://flags</code>, search for &ldquo;Experimental Web Platform Features,&rdquo; and enable it. Restart the browser. Without this flag, <code>navigator.modelContext</code> will be <code>undefined</code> and none of the imperative APIs will work. The declarative attributes will still be present in the DOM but won&apos;t be consumed by any agent until the flag is on.
            </p>

            <p>
              <strong>Model Context Tool Inspector extension.</strong> This Chrome extension gives you a sidebar panel in DevTools that lists every WebMCP tool registered on the current page &mdash; both declarative (from form attributes) and imperative (from <code>registerTool</code> calls). You can invoke tools directly from the inspector, pass test parameters, and see the structured JSON responses. It&apos;s the single most useful debugging tool for WebMCP development.
            </p>

            <p>
              That&apos;s it. No NPM packages to install, no build plugins to configure, no third-party SDKs. WebMCP is a browser-native standard. Your implementation is just HTML attributes and JavaScript.
            </p>

            {/* Section 3: Step 1 — Declarative API */}
            <h2 id="step-1-declarative-api">Step 1 &mdash; Declarative API: The Quick Win</h2>

            <p>
              The fastest way to make your site agent-ready is the declarative API. If you already have HTML forms on your site &mdash; contact forms, demo requests, newsletter signups &mdash; you can make them WebMCP-compatible in under five minutes per form. No JavaScript required.
            </p>

            <p>
              Here&apos;s a real example: a demo request form. This is the kind of form every B2B SaaS site has.
            </p>

            <pre><code>{`<form
  toolname="requestDemo"
  tooldescription="Request a product demo. Books a 30-minute call with the sales team."
>
  <input
    name="name"
    type="text"
    required
    toolparamdescription="Full name of the person requesting the demo"
  />
  <input
    name="email"
    type="email"
    required
    toolparamdescription="Work email address"
  />
  <input
    name="company"
    type="text"
    toolparamdescription="Company name"
  />
  <button type="submit">Book Demo</button>
</form>`}</code></pre>

            <p>
              Three new attributes do all the work:
            </p>

            <p>
              <strong><code>toolname</code></strong> goes on the <code>&lt;form&gt;</code> element. This is the identifier agents use to discover and call the tool. Name it like you&apos;d name an API endpoint &mdash; clear, action-oriented, camelCase. An agent scanning this page sees &ldquo;requestDemo&rdquo; in its tool list and immediately understands what it does.
            </p>

            <p>
              <strong><code>tooldescription</code></strong> also goes on the <code>&lt;form&gt;</code>. This is the human-readable explanation that helps an agent decide whether to call this tool. Be specific. &ldquo;Request a product demo&rdquo; is good. &ldquo;Request a product demo. Books a 30-minute call with the sales team.&rdquo; is better. The agent uses this description to match user intent &mdash; when someone says &ldquo;I want to see a demo of this product,&rdquo; the agent needs enough context in the description to know this is the right tool.
            </p>

            <p>
              <strong><code>toolparamdescription</code></strong> goes on each <code>&lt;input&gt;</code>. It tells the agent what data this field expects and why. The <code>name</code> attribute provides the parameter key, the <code>type</code> and <code>required</code> attributes provide validation hints, and <code>toolparamdescription</code> provides the semantic context. For fields where the name is already self-explanatory &mdash; like <code>name=&quot;email&quot; type=&quot;email&quot;</code> &mdash; the description adds marginal value but is still good practice for disambiguation (is it a personal email or a work email?).
            </p>

            <p>
              Here&apos;s the key insight: <strong>if your forms already have clean <code>name</code> attributes and proper <code>required</code> fields, you&apos;re 80% of the way there.</strong> The WebMCP declarative API was designed to layer onto existing HTML forms with minimal friction. Most B2B SaaS sites can annotate every form on the site in an afternoon.
            </p>

            <p>
              When an AI agent encounters this form, it doesn&apos;t need to guess which field is the email field by looking at placeholder text or label positioning. It reads the structured attributes, constructs the right parameters, and submits the form programmatically. One clean function call instead of a chain of &ldquo;click this input, type this text, tab to the next field&rdquo; browser interactions.
            </p>

            {/* Section 4: Step 2 — Imperative API */}
            <h2 id="step-2-imperative-api">Step 2 &mdash; Imperative API: The Power Move</h2>

            <p>
              Declarative forms handle actions that already have UI &mdash; submitting a contact form, signing up for a newsletter. But the imperative API is where WebMCP gets genuinely powerful. It lets you register arbitrary JavaScript functions as tools that agents can call to get structured data back, even when there&apos;s no corresponding form or page on your site.
            </p>

            <p>
              Think about the questions a buyer&apos;s AI agent would ask during evaluation: &ldquo;What&apos;s the pricing?&rdquo; &ldquo;How does this compare to Competitor X?&rdquo; &ldquo;What features are in the Pro plan?&rdquo; You can build a tool for each one. Here&apos;s a complete React component that registers a pricing tool:
            </p>

            <pre><code>{`"use client"

import { useEffect } from "react"

export function WebMCPProvider() {
  useEffect(() => {
    if (!navigator.modelContext) return

    navigator.modelContext.registerTool({
      name: "getProductPricing",
      description: "Get current pricing for all plans including features and limits",
      inputSchema: {
        type: "object",
        properties: {
          plan: {
            type: "string",
            description: "Optional: specific plan name (e.g., 'starter', 'pro', 'enterprise')"
          }
        }
      },
      annotations: { readOnlyHint: true },
      execute: async (params) => {
        const plans = [
          {
            name: "Starter",
            price: "$49/mo",
            features: ["1,000 contacts", "Basic analytics", "Email support"]
          },
          {
            name: "Pro",
            price: "$149/mo",
            features: ["10,000 contacts", "Advanced analytics", "Priority support"]
          }
        ]

        if (params.plan) {
          const match = plans.find(p =>
            p.name.toLowerCase() === params.plan.toLowerCase()
          )
          return match || { error: "Plan not found", available: plans.map(p => p.name) }
        }

        return { plans, pricing_page: "https://yoursite.com/pricing" }
      }
    })
  }, [])

  return null
}`}</code></pre>

            <p>
              Let&apos;s walk through every piece of this.
            </p>

            <p>
              <strong><code>name</code> and <code>description</code></strong> serve the same role as in the declarative API &mdash; they&apos;re what agents see in their tool list. The name should be action-oriented and specific: <code>getProductPricing</code>, not <code>pricing</code> or <code>data</code>. The description should include enough context for an agent to decide whether this tool answers the user&apos;s question. &ldquo;Get current pricing for all plans including features and limits&rdquo; tells the agent this tool returns not just prices but also feature breakdowns.
            </p>

            <p>
              <strong><code>inputSchema</code></strong> is a standard JSON Schema definition. This tells the agent what parameters the tool accepts, their types, and whether they&apos;re required. In this example, the <code>plan</code> parameter is optional &mdash; the agent can call the tool with no arguments to get all plans, or pass a specific plan name to filter. The schema is the contract between your tool and every agent that might call it.
            </p>

            <p>
              <strong><code>annotations</code></strong> provide metadata about the tool&apos;s behavior. The <code>readOnlyHint: true</code> annotation tells agents that calling this tool won&apos;t modify any state &mdash; it&apos;s a safe read operation. This matters because agents treat read-only tools differently from stateful ones. A read-only tool can be called speculatively during research. A stateful tool (like booking a demo or submitting a form) requires explicit user confirmation before execution.
            </p>

            <p>
              <strong><code>execute</code></strong> is the function that runs when an agent calls the tool. It receives the parameters the agent passed (validated against your <code>inputSchema</code>), does whatever logic you need, and returns structured data. The return value goes directly back to the agent as JSON. No HTML, no markdown, no rendered templates &mdash; just clean data the agent can parse and present however it wants.
            </p>

            <p>
              The <code>&ldquo;use client&rdquo;</code> directive and <code>useEffect</code> pattern ensure this code only runs in the browser. The feature detection check &mdash; <code>if (!navigator.modelContext) return</code> &mdash; means the component is a no-op in browsers that don&apos;t support WebMCP. Drop this component into your root layout, and it silently registers your tools when the API is available and does nothing when it&apos;s not.
            </p>

            <p>
              In your Next.js layout, you&apos;d include it like this:
            </p>

            <pre><code>{`// app/layout.tsx
import { WebMCPProvider } from "@/components/webmcp-provider"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WebMCPProvider />
        {children}
      </body>
    </html>
  )
}`}</code></pre>

            <p>
              Register as many tools as you need. Each <code>registerTool</code> call adds another entry to the agent&apos;s tool list. We run six imperative tools on <a href="https://www.meetcursive.com">meetcursive.com</a> &mdash; pricing, competitor comparisons, capabilities, demo booking, case studies, and industry use cases &mdash; all registered in a single provider component.
            </p>

            {/* Section 5: Step 3 — Supporting Infrastructure */}
            <h2 id="step-3-supporting-infrastructure">Step 3 &mdash; Supporting Infrastructure</h2>

            <p>
              WebMCP tools are the primary interface for browser-based agents, but a complete agent-readiness strategy includes several supporting layers. These work independently of WebMCP and serve agents that don&apos;t operate in a browser context &mdash; API-based LLMs, search engine crawlers with AI features, and tools like ChatGPT or Perplexity that fetch URLs directly.
            </p>

            <h3 id="llms-txt">llms.txt</h3>

            <p>
              The <code>llms.txt</code> file is an emerging standard &mdash; think of it as <code>robots.txt</code> for AI. Place it at your site root, and it tells language models what your site is about, what tools are available, and where to find structured data. Here&apos;s a real example:
            </p>

            <pre><code>{`# llms.txt — YourSaaS.com

## About
YourSaaS is a B2B analytics platform that helps growth teams
understand pipeline attribution and optimize spend.

## Products
- Starter Plan: $49/mo — 1,000 contacts, basic analytics
- Pro Plan: $149/mo — 10,000 contacts, advanced analytics
- Enterprise: Custom pricing — unlimited contacts, SSO, SLA

## WebMCP Tools Available
- getProductPricing: Returns current pricing for all plans
- requestDemo: Books a 30-minute demo call
- getCapabilities: Returns platform feature overview

## Structured Data Endpoints
- /api/ai-info — Full product JSON
- /sitemap.xml — All pages
- /.well-known/schema.json — JSON-LD schemas

## Contact
- Demo: https://yoursite.com/demo
- Sales: sales@yoursite.com
- Docs: https://docs.yoursite.com`}</code></pre>

            <p>
              This file takes ten minutes to create and immediately gives any LLM a structured overview of your product, whether or not it supports WebMCP. Many AI tools fetch <code>llms.txt</code> as a first step when processing a URL.
            </p>

            <h3 id="api-ai-info">/api/ai-info Endpoint</h3>

            <p>
              A JSON endpoint that returns your complete product information in one request. Any agent or LLM can fetch this URL &mdash; no browser required. Here&apos;s a Next.js route handler:
            </p>

            <pre><code>{`// app/api/ai-info/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    company: "YourSaaS",
    description: "B2B analytics platform for pipeline attribution",
    products: [
      {
        name: "Starter",
        price: "$49/mo",
        features: ["1,000 contacts", "Basic analytics", "Email support"]
      },
      {
        name: "Pro",
        price: "$149/mo",
        features: ["10,000 contacts", "Advanced analytics", "Priority support"]
      }
    ],
    webmcp_tools: [
      "getProductPricing",
      "requestDemo",
      "getCapabilities"
    ],
    links: {
      pricing: "https://yoursite.com/pricing",
      demo: "https://yoursite.com/demo",
      docs: "https://docs.yoursite.com"
    }
  }, {
    headers: {
      "Cache-Control": "public, max-age=3600"
    }
  })
}`}</code></pre>

            <p>
              Cache it for an hour. Update it when your pricing or features change. This endpoint serves as the single source of truth for any AI system that wants to understand your product programmatically.
            </p>

            <h3 id="json-ld">JSON-LD Structured Data</h3>

            <p>
              Structured data has been a best practice for SEO for years, but it takes on new importance in an agentic context. JSON-LD schemas give agents a machine-readable understanding of your pages without requiring any proprietary API. Here&apos;s an example for your pricing page:
            </p>

            <pre><code>{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "YourSaaS",
  "applicationCategory": "BusinessApplication",
  "offers": [
    {
      "@type": "Offer",
      "name": "Starter",
      "price": "49",
      "priceCurrency": "USD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "billingDuration": "P1M"
      }
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "149",
      "priceCurrency": "USD"
    }
  ]
}
</script>`}</code></pre>

            <p>
              JSON-LD complements WebMCP. The structured data is available to search engine crawlers and agents that parse the DOM but don&apos;t execute JavaScript. WebMCP tools serve agents that do execute JavaScript. Together, they cover every agent type.
            </p>

            <h3 id="robots-txt">robots.txt</h3>

            <p>
              Review your <code>robots.txt</code> and make sure you&apos;re not blocking AI crawlers. Several LLM providers use specific user agents &mdash; <code>GPTBot</code>, <code>ClaudeBot</code>, <code>Google-Extended</code>. If you&apos;ve blocked these (some default WordPress configs do), your <code>llms.txt</code> and <code>/api/ai-info</code> endpoint won&apos;t be accessible. Allow the crawlers you want to reach your structured data.
            </p>

            {/* Section 6: Step 4 — Testing */}
            <h2 id="step-4-testing">Step 4 &mdash; Testing Your Implementation</h2>

            <p>
              WebMCP is new enough that there&apos;s no established testing framework yet. Here&apos;s the testing workflow we use at Cursive.
            </p>

            <p>
              <strong>Chrome 146 Canary + experimental flag.</strong> This is your primary testing environment. Navigate to <code>chrome://flags</code>, enable &ldquo;Experimental Web Platform Features,&rdquo; and restart. Open your site. If your imperative tools are registered correctly, you should see a console log confirming registration. We log <code>[WebMCP] Tools registered successfully</code> from our provider component.
            </p>

            <p>
              <strong>Model Context Tool Inspector.</strong> Install this Chrome extension, open DevTools, and navigate to the &ldquo;Model Context&rdquo; tab. It lists every tool on the current page &mdash; both declarative (from annotated forms) and imperative (from <code>registerTool</code> calls). Click any tool to see its schema. Pass test parameters and execute it directly from the inspector. This is the fastest way to verify your tools return the correct JSON.
            </p>

            <p>
              <strong>Chrome DevTools console.</strong> For quick spot checks, open the console and run:
            </p>

            <pre><code>{`// Check if WebMCP is available
console.log(navigator.modelContext)

// List all registered tools
const tools = await navigator.modelContext.getTools()
console.log(tools)

// Call a tool manually
const result = await navigator.modelContext.callTool(
  "getProductPricing",
  { plan: "pro" }
)
console.log(result)`}</code></pre>

            <p>
              If <code>navigator.modelContext</code> is <code>undefined</code>, the experimental flag isn&apos;t enabled. If <code>getTools()</code> returns an empty array, your registration code isn&apos;t running &mdash; check that your provider component is mounted and that the <code>useEffect</code> isn&apos;t erroring silently.
            </p>

            <p>
              <strong>Manual agent testing.</strong> The real test is using an actual AI agent. Open Claude in Chrome Canary (or any browser-based agent that supports WebMCP), navigate to your site, and ask it questions your tools should answer. &ldquo;What&apos;s the pricing for the Pro plan?&rdquo; should trigger your pricing tool. &ldquo;Book me a demo&rdquo; should trigger your demo form or booking tool. If the agent falls back to reading the page visually instead of calling your tools, your tool descriptions may not be matching the user&apos;s intent closely enough. Refine the descriptions until the agent consistently selects the right tool.
            </p>

            {/* Section 7: Tool Design Best Practices */}
            <h2 id="tool-design-best-practices">Tool Design Best Practices</h2>

            <p>
              After building and iterating on our WebMCP implementation, we&apos;ve developed a set of design principles that make the difference between tools that agents actually use and tools that get ignored.
            </p>

            <p>
              <strong>Name tools like API endpoints.</strong> Clear, action-oriented, unambiguous. <code>getProductPricing</code> is immediately understandable. <code>pricing</code> is vague &mdash; is it a page, a value, a tool? <code>handlePricingStuff</code> tells the agent nothing. Use the <code>get</code>/<code>create</code>/<code>compare</code>/<code>book</code> verb pattern that every developer already knows from REST APIs.
            </p>

            <p>
              <strong>Write descriptions for the agent, not for developers.</strong> The description field is the primary signal an agent uses to decide whether to call your tool. Include what the tool does, what it returns, and when someone would want to use it. &ldquo;Get current pricing for all plans including features, limits, and annual discount information&rdquo; is significantly better than &ldquo;Returns pricing data.&rdquo; Think about it from the agent&apos;s perspective: it&apos;s scanning a list of tools trying to match a user&apos;s intent. The more context your description provides, the more accurately the agent matches.
            </p>

            <p>
              <strong>Return structured JSON, never HTML or markdown.</strong> Your tool&apos;s return value goes directly to the agent as data. The agent decides how to present it to the user. If you return HTML, the agent has to parse it. If you return markdown, the agent has to interpret formatting. Return plain JSON objects with clear keys and values. The agent will format the presentation.
            </p>

            <p>
              <strong>Include URLs in your responses.</strong> When your tool returns data, include relevant URLs so the agent can navigate users to the right pages. If your pricing tool returns plan details, include a link to the pricing page. If your comparison tool returns a feature matrix, include a link to the full comparison article. Agents use these URLs to provide &ldquo;learn more&rdquo; links and to navigate users deeper into your site.
            </p>

            <pre><code>{`// Good: includes actionable URLs
return {
  plans: [...],
  pricing_page: "https://yoursite.com/pricing",
  demo_url: "https://yoursite.com/demo",
  signup_url: "https://yoursite.com/signup"
}

// Bad: data island with no navigation
return {
  plans: [...]
}`}</code></pre>

            <p>
              <strong>Mark read-only tools with <code>readOnlyHint: true</code>.</strong> This annotation tells agents that calling this tool is safe and has no side effects. Pricing lookups, feature comparisons, and capability overviews are read-only. Demo booking and form submissions are stateful. The distinction matters because agents apply different confirmation policies &mdash; a read-only tool can be called without asking the user for permission, while a stateful tool typically requires explicit consent before execution.
            </p>

            <p>
              <strong>Think like a buyer, not like a developer.</strong> The most useful exercise is to sit down and list every question a prospect&apos;s AI assistant would ask during evaluation. How much does it cost? How does it compare to alternatives? What industries do you serve? Can I see results? How do I get started? Each question maps to a tool. If you build tools that answer the <Link href="/blog/ai-agents-replacing-buyer-journey">questions buyers actually ask</Link>, agents will use them. If you build tools based on your internal data model, they won&apos;t.
            </p>

            {/* Final CTA */}
            <h2 id="start-building">Start Building</h2>

            <p>
              WebMCP is one of those rare standards where the first-mover advantage is real and the implementation cost is low. The declarative API takes an afternoon. The imperative API takes a day. The supporting infrastructure &mdash; <code>llms.txt</code>, <code>/api/ai-info</code>, JSON-LD &mdash; takes another day. In three days of engineering time, you can make your entire product accessible to every AI agent that visits your site.
            </p>

            <p>
              We built this for <a href="https://www.meetcursive.com">Cursive</a> and it&apos;s live right now. Visit meetcursive.com with Chrome Canary to see the tools in action. Check out our <Link href="/platform">platform</Link> to see what Cursive does, or browse the <Link href="/pricing">pricing page</Link> to see how the structured data layers work in practice.
            </p>

            <p>
              For the strategic context behind this implementation &mdash; why the <Link href="/blog/ai-agents-replacing-buyer-journey">buyer journey is going agentic</Link> and what that means for your pipeline &mdash; read our companion articles. For the <a href="https://github.com/webmachinelearning/webmcp" target="_blank" rel="noopener noreferrer">full WebMCP specification</a>, the GitHub repo has the latest draft. And <a href="https://venturebeat.com/infrastructure/google-chrome-ships-webmcp-in-early-preview-turning-every-website-into-a" target="_blank" rel="noopener noreferrer">VentureBeat&apos;s coverage</a> provides solid third-party context on the industry implications.
            </p>

            <p>
              The agentic web isn&apos;t coming. It&apos;s here. The question is whether your site is ready for it.
            </p>

          </article>
        </Container>
      </section>

      {/* CTA Section */}
      <DashboardCTA
        headline="See WebMCP"
        subheadline="In Action"
        description="We built this for Cursive and it's live right now. Visit meetcursive.com with Chrome Canary to test our tools, or book a demo to see how we generate leads."
      />

      {/* Related Posts */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <h2 className="text-3xl font-bold mb-8 text-center">Read Next</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link href="/blog/webmcp-ai-agent-ready-lead-generation" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">Why We Made Cursive Agent-Ready</h3>
              <p className="text-sm text-gray-600">The strategy behind our WebMCP implementation</p>
            </Link>
            <Link href="/blog/what-is-webmcp-guide" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">What Is WebMCP?</h3>
              <p className="text-sm text-gray-600">The non-technical guide for marketers and growth teams</p>
            </Link>
            <Link href="/blog/ai-agents-replacing-buyer-journey" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">AI Agents Are Replacing the Buyer Journey</h3>
              <p className="text-sm text-gray-600">Why your next lead won&apos;t fill out a form</p>
            </Link>
          </div>
        </Container>
      </section>
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">How to Implement WebMCP on Your B2B SaaS Website (With Real Code)</h1>

          <p className="text-gray-700 mb-6">
            Definitive implementation guide for WebMCP on B2B SaaS sites. Covers declarative forms, imperative tool registration, llms.txt, /api/ai-info endpoints, and testing with Chrome 146. Framework-agnostic concepts with Next.js/React examples. Published: February 15, 2026.
          </p>

          <MachineSection title="Key Takeaways">
            <MachineList items={[
              "WebMCP has two APIs: Declarative (annotate forms) and Imperative (register JS tools)",
              "Declarative API: Add toolname, tooldescription, toolparamdescription attributes to forms",
              "Imperative API: Use navigator.modelContext.registerTool() to expose JS functions as tools",
              "Supporting infrastructure: llms.txt, /api/ai-info JSON endpoint, JSON-LD structured data",
              "Testing: Chrome 146 Canary + Experimental Web Platform Features flag + Model Context Tool Inspector extension",
              "Implementation time: 30 min for declarative forms, 1 day for imperative tools, 2-3 days total"
            ]} />
          </MachineSection>

          <MachineSection title="Prerequisites">
            <MachineList items={[
              "Modern web framework (Next.js 14+, Nuxt 3, Astro, SvelteKit, or plain HTML)",
              "Chrome 146 Canary with Experimental Web Platform Features flag enabled",
              "Model Context Tool Inspector Chrome extension for debugging",
              "No NPM packages, build plugins, or SDKs required - WebMCP is browser-native"
            ]} />
          </MachineSection>

          <MachineSection title="Step 1: Declarative API (Quick Win - 30 min)">
            <p className="text-gray-700 mb-3">
              Annotate existing HTML forms to make them agent-readable. Three attributes do all the work:
            </p>
            <MachineList items={[
              "toolname: Add to <form> tag - identifier agents use (e.g., 'requestDemo')",
              "tooldescription: Add to <form> tag - explains what form does and outcome",
              "toolparamdescription: Add to each <input> - describes expected data for field"
            ]} />
            <p className="text-gray-700 mt-3">
              Example: Contact form becomes agent-callable by adding these attributes. Agent reads structured attributes, constructs parameters, submits programmatically instead of clicking/typing.
            </p>
          </MachineSection>

          <MachineSection title="Step 2: Imperative API (Power Move - 1 day)">
            <p className="text-gray-700 mb-3">
              Register JavaScript functions as callable tools for agents. Enables structured data responses for any question (pricing, comparisons, features) even without corresponding UI.
            </p>
            <p className="text-gray-700 mb-3">
              <strong>Implementation pattern (React/Next.js):</strong>
            </p>
            <MachineList items={[
              "Create WebMCPProvider component with 'use client' directive",
              "Use useEffect to check if navigator.modelContext exists (feature detection)",
              "Call navigator.modelContext.registerTool() with: name, description, inputSchema (JSON Schema), annotations (readOnlyHint), execute function",
              "Execute function receives validated params, returns structured JSON (not HTML/markdown)",
              "Include component in root layout to auto-register tools on every page"
            ]} />
            <p className="text-gray-700 mt-3">
              Example: getPricing tool accepts optional 'plan' parameter, returns plans array with name/price/features plus pricing_page URL. Agents call tool, get clean JSON, no DOM interaction.
            </p>
          </MachineSection>

          <MachineSection title="Step 3: Supporting Infrastructure">
            <div className="space-y-4">
              <div>
                <p className="font-bold text-gray-900 mb-2">llms.txt (10 min):</p>
                <p className="text-gray-700 mb-2">
                  Plain-text file at site root. Think robots.txt for AI. Sections: About, Products, WebMCP Tools Available, Structured Data Endpoints, Contact.
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-2">/api/ai-info Endpoint (30 min):</p>
                <p className="text-gray-700 mb-2">
                  JSON endpoint returning complete product info: company, description, products array (name/price/features), webmcp_tools list, links object. Cache for 1 hour. Works for agents without browser context.
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-2">JSON-LD Structured Data:</p>
                <p className="text-gray-700 mb-2">
                  Schema.org markup for pages. Example: SoftwareApplication schema for pricing page with Offer objects. Available to search crawlers and agents that parse DOM but don't execute JS. Complements WebMCP.
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-2">robots.txt Review:</p>
                <p className="text-gray-700 mb-2">
                  Ensure AI crawlers (GPTBot, ClaudeBot, Google-Extended) aren't blocked. They need access to llms.txt and /api/ai-info.
                </p>
              </div>
            </div>
          </MachineSection>

          <MachineSection title="Step 4: Testing Your Implementation">
            <MachineList items={[
              "Chrome 146 Canary: Enable 'Experimental Web Platform Features' at chrome://flags, restart browser",
              "Model Context Tool Inspector: Chrome extension shows all tools (declarative + imperative) in DevTools panel. Test tool execution with parameters.",
              "DevTools Console: Check navigator.modelContext exists, run navigator.modelContext.getTools() to list tools, manually call tools with navigator.modelContext.callTool(name, params)",
              "Manual Agent Testing: Use browser-based AI agent (Claude in Chrome Canary), ask questions tools should answer, verify agent calls tools vs. visual scraping",
              "Debugging: If navigator.modelContext undefined = flag not enabled. If getTools() returns empty = registration code not running."
            ]} />
          </MachineSection>

          <MachineSection title="Tool Design Best Practices">
            <MachineList items={[
              "Name tools like API endpoints: getProductPricing (clear, action-oriented, unambiguous)",
              "Write descriptions for agents: Include what tool does, what it returns, when to use it",
              "Return structured JSON only: Never HTML or markdown. Agent formats presentation.",
              "Include URLs in responses: pricing_page, demo_url, signup_url for navigation",
              "Mark read-only tools: readOnlyHint: true for safe operations (pricing lookups, comparisons)",
              "Think like a buyer: Map prospect questions to tools (cost? vs competitors? industries? results? how to start?)"
            ]} />
          </MachineSection>

          <MachineSection title="Implementation Timeline">
            <MachineList items={[
              "Declarative API: 1 afternoon (30-60 min per form)",
              "Imperative API: 1 day (3-6 tools)",
              "Supporting infrastructure: 1 day (llms.txt, /api/ai-info, JSON-LD)",
              "Total: 2-3 days of engineering time for complete implementation"
            ]} />
          </MachineSection>

          <MachineSection title="Cursive Implementation">
            <p className="text-gray-700 mb-3">
              Cursive's live WebMCP implementation on meetcursive.com:
            </p>
            <MachineList items={[
              "6 imperative tools: getPricing, compareCursiveToCompetitor, getCursiveCapabilities, bookDemo, getResults, getIndustries",
              "7 declarative forms: annotated with toolname/tooldescription",
              "Full infrastructure: llms.txt, /api/ai-info, JSON-LD schemas",
              "Test with Chrome Canary at meetcursive.com to see tools in action"
            ]} />
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "What Is WebMCP?", href: "/blog/what-is-webmcp-guide", description: "Non-technical guide for marketers and growth teams" },
              { label: "Why We Made Cursive Agent-Ready", href: "/blog/webmcp-ai-agent-ready-lead-generation", description: "Strategic context for WebMCP implementation" },
              { label: "AI Agents Are Replacing the Buyer Journey", href: "/blog/ai-agents-replacing-buyer-journey", description: "Why buyer journey is going agentic" },
              { label: "WebMCP Specification", href: "https://github.com/webmachinelearning/webmcp", description: "Full spec on GitHub" },
              { label: "VentureBeat Coverage", href: "https://venturebeat.com/infrastructure/google-chrome-ships-webmcp-in-early-preview-turning-every-website-into-a", description: "Industry implications of WebMCP" },
              { label: "Chrome Developer Blog", href: "https://developer.chrome.com/blog/webmcp-epp", description: "Official implementation guide" }
            ]} />
          </MachineSection>

          <MachineSection title="Get Started with Cursive">
            <p className="text-gray-700 mb-3">
              Cursive is WebMCP-ready and live now. Visit meetcursive.com with Chrome Canary to test the tools, or book a demo to see how we generate leads.
            </p>
            <MachineList items={[
              { label: "Platform Overview", href: "/platform", description: "See what Cursive does" },
              { label: "Pricing", href: "/pricing", description: "Self-serve marketplace + done-for-you services" },
              { label: "Book a Demo", href: "/book", description: "See Cursive in real-time" }
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
