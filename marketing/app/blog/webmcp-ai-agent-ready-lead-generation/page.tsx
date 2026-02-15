import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import { Metadata } from "next"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import Link from "next/link"

export const metadata: Metadata = {
  title: "First AI-Agent-Ready Lead Gen Platform | Cursive",
  description: "Google shipped WebMCP in Chrome 146 — AI agents now interact with websites through structured tools. Here's why we implemented it and what it means for B2B.",
  keywords: "WebMCP, AI agent website, agentic web, AI-powered lead generation, browser AI agents, WebMCP implementation, visitor identification AI",

  openGraph: {
    title: "First AI-Agent-Ready Lead Gen Platform | Cursive",
    description: "Google shipped WebMCP in Chrome 146 — AI agents now interact with websites through structured tools. Here's why we implemented it and what it means for B2B.",
    type: "article",
    url: "https://www.meetcursive.com/blog/webmcp-ai-agent-ready-lead-generation",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Diagram showing an AI agent calling structured WebMCP tools on meetcursive.com — getCursivePricing, compareCursiveToCompetitor, bookCursiveDemo — with JSON responses flowing back, contrasted against a traditional agent struggling to parse a marketing page visually",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "First AI-Agent-Ready Lead Gen Platform | Cursive",
    description: "Google shipped WebMCP in Chrome 146 — AI agents now interact with websites through structured tools. Here's why we implemented it and what it means for B2B.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/webmcp-ai-agent-ready-lead-generation",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateBlogPostSchema({
        title: "Why We Made Cursive the First AI-Agent-Ready Lead Gen Platform (And What WebMCP Means for B2B)",
        description: "Google shipped WebMCP in Chrome 146 — a new standard that lets AI agents interact with websites through structured tools instead of guessing at buttons. Here's why we implemented it on day one.",
        author: "Cursive Team",
        publishDate: "2026-02-15",
        image: "https://www.meetcursive.com/cursive-logo.png",
      })} />

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
              Why We Made Cursive the First AI-Agent-Ready Lead Gen Platform (And What WebMCP Means for B2B)
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Google just shipped WebMCP in Chrome 146. Your website&apos;s next visitor might be an AI agent evaluating you on behalf of a prospect. We built for that future today.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>February 15, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>9 min read</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Article Content */}
      <section className="py-16 bg-white">
        <Container>
          <article className="max-w-3xl mx-auto prose prose-lg prose-blue">

            {/* Section 1: The Hook */}
            <p className="lead">
              Something shifted this week, and most B2B companies missed it entirely.
            </p>

            <p>
              Google shipped <a href="https://developer.chrome.com/blog/webmcp-epp" target="_blank" rel="noopener noreferrer">WebMCP in Chrome 146&apos;s early preview</a> &mdash; a new W3C standard that lets AI agents interact with websites through structured tools instead of guessing at buttons and scraping text off screens. When a VP of Sales asks Claude or Gemini to &ldquo;find me a visitor identification tool under $2K a month and book a demo,&rdquo; the agent that gets dispatched to your website isn&apos;t admiring your hero image or reading your testimonials. It&apos;s trying to parse your DOM, locate the pricing data, figure out which button triggers a booking flow, and extract something structured from a page that was built entirely for human eyes.
            </p>

            <p>
              WebMCP changes that equation. And we just implemented it across <a href="https://www.meetcursive.com">meetcursive.com</a>.
            </p>

            {/* Section 2: What WebMCP Actually Is */}
            <h2 id="what-is-webmcp">What WebMCP Actually Is</h2>

            <p>
              WebMCP stands for Web Model Context Protocol. It&apos;s a joint <a href="https://github.com/webmachinelearning/webmcp" target="_blank" rel="noopener noreferrer">W3C standard</a> developed by Google and Microsoft that gives websites a way to publish a structured &ldquo;tool menu&rdquo; that AI agents can call directly &mdash; no screen parsing, no DOM guessing, no visual interpretation of pixel layouts.
            </p>

            <p>
              The mental model is simple. Today, when an AI agent visits your website, it takes a screenshot, runs it through a vision model, tries to identify clickable elements, and attempts to navigate your site the way a confused human would. It&apos;s slow, expensive (each screenshot costs tokens), and fragile &mdash; a minor design change can break the entire flow. WebMCP replaces that entire pipeline with a single structured function call.
            </p>

            <p>
              The standard exposes two APIs. The <strong>Declarative API</strong> lets you add attributes directly to existing HTML forms &mdash; <code>toolname</code>, <code>tooldescription</code>, <code>toolparamdescription</code> &mdash; so agents understand what each form does and what each field expects without guessing. The <strong>Imperative API</strong> lets you register JavaScript functions as callable tools via <code>navigator.modelContext.registerTool()</code>, where agents call your functions and get clean JSON back.
            </p>

            <p>
              The result is a <a href="https://venturebeat.com/infrastructure/google-chrome-ships-webmcp-in-early-preview-turning-every-website-into-a" target="_blank" rel="noopener noreferrer">67% reduction in computational overhead</a> compared to visual agent approaches. One function call replaces dozens of browser interactions. And it&apos;s model-agnostic: Claude, Gemini, ChatGPT, or any browser-based agent that supports the standard can call the same tools.
            </p>

            <p>
              Dan Petrovic, a technical SEO researcher, called it &ldquo;the biggest shift in technical SEO since structured data.&rdquo; He&apos;s not wrong. Just as schema.org markup let search engines understand your pages without parsing natural language, WebMCP lets AI agents understand your product without parsing pixels.
            </p>

            {/* Section 3: Why This Matters for Lead Gen */}
            <h2 id="why-this-matters-for-lead-generation">Why This Matters for Lead Generation</h2>

            <p>
              Here&apos;s the thesis: <strong>the buyer&apos;s journey is going agentic.</strong>
            </p>

            <p>
              Think about how enterprise software gets evaluated today. A VP of Marketing needs a visitor identification platform. They ask their team to research options. Somebody spends three hours opening tabs, comparing pricing pages, reading G2 reviews, and building a spreadsheet. That process is already being delegated to AI assistants, and WebMCP accelerates the transition by making it dramatically more reliable.
            </p>

            <p>
              When that agent visits multiple vendor websites, something interesting happens. The site that exposes structured tools &mdash; pricing, feature comparisons, capability breakdowns, demo booking &mdash; as callable functions gives the agent a clean, reliable path. The agent calls <code>getCursivePricing</code>, gets structured JSON with every tier, every feature, every price point. It calls <code>compareCursiveToCompetitor</code> with &ldquo;ZoomInfo&rdquo; and gets a feature-by-feature breakdown. It calls <code>bookCursiveDemo</code> and gets a cal.com URL it can present to the human. Total time: seconds.
            </p>

            <p>
              The site that doesn&apos;t implement WebMCP forces the agent to screenshot the pricing page, try to parse a grid of cards with CSS gradients, hope the toggle between &ldquo;monthly&rdquo; and &ldquo;annual&rdquo; billing is clickable, and extract numbers from decorative typography. That&apos;s slower, more expensive, and more error-prone. When agents are comparing five vendors on behalf of a prospect, they&apos;ll naturally prefer the structured path.
            </p>

            <p>
              Now consider what <a href="/visitor-identification">Cursive already does</a>. We track when humans visit your website and identify them in real-time &mdash; name, company, email, pages viewed. We turn anonymous traffic into actionable pipeline. The same principle applies to agentic traffic. When an AI agent visits your pricing page on behalf of a prospect, that visit is a signal of intent. The prospect is actively evaluating. The company that sees that signal and responds first wins the deal.
            </p>

            <p>
              The competitive moat here is real. In a world where agents do the initial vendor evaluation, the first company in each category to implement WebMCP has a structural advantage. The agent experience becomes an optimization surface &mdash; just like SEO was for search engines in 2008, just like mobile responsiveness was for Google&apos;s mobile-first index in 2016. The companies that ignore it don&apos;t disappear overnight, but they fall behind steadily as more buyer journeys start with an AI assistant rather than a Google search.
            </p>

            {/* Section 4: What We Built */}
            <h2 id="what-we-built">What We Built</h2>

            <p>
              We didn&apos;t just add a few meta tags. We built a comprehensive agent interface across meetcursive.com that exposes Cursive&apos;s entire value proposition as structured, callable tools.
            </p>

            <h3 id="imperative-tools">Six Imperative WebMCP Tools</h3>

            <p>
              These are JavaScript functions registered via <code>navigator.modelContext.registerTool()</code> that any browser-based AI agent can call directly:
            </p>

            <p>
              <strong><code>getCursivePricing</code></strong> returns structured pricing for both our self-serve marketplace (credit packages from $0.60/lead) and managed <a href="/services">service tiers</a> (Data at $1,000/mo, Outbound at $2,500/mo, Pipeline at $5,000/mo), including annual discounts, feature lists, and signup URLs.
            </p>

            <p>
              <strong><code>compareCursiveToCompetitor</code></strong> accepts a competitor name and returns a feature-by-feature comparison. We currently support ten competitors: ZoomInfo, Apollo, Clearbit, 6sense, Warmly, RB2B, Leadfeeder, Demandbase, Instantly, and Smartlead. Each comparison includes identification rates, starting prices, whether AI outreach is included, and a link to our detailed comparison page.
            </p>

            <p>
              <strong><code>getCursiveCapabilities</code></strong> returns a structured overview of the <a href="/platform">platform</a> across six product categories: visitor identification, <a href="/intent-audiences">intent data</a>, AI outreach, audience builder, direct mail, and integrations.
            </p>

            <p>
              <strong><code>bookCursiveDemo</code></strong> returns a cal.com booking URL with context about what to expect on the call, plus alternative actions like the free audit and marketplace signup.
            </p>

            <p>
              <strong><code>getCursiveResults</code></strong> serves <a href="/case-studies">case study data</a> filterable by metric type &mdash; revenue generated, ROAS, pipeline created.
            </p>

            <p>
              <strong><code>getCursiveIndustries</code></strong> returns industry-specific use cases and landing page URLs for nine verticals, from B2B software to financial services to media and advertising.
            </p>

            <p>
              Here&apos;s what the competitor comparison tool registration looks like in practice:
            </p>

            <pre><code>{`navigator.modelContext.registerTool({
  name: "compareCursiveToCompetitor",
  description: "Compare Cursive against competitors like ZoomInfo, Apollo, Clearbit...",
  inputSchema: {
    type: "object",
    properties: {
      competitor: {
        type: "string",
        description: "Competitor name (e.g., ZoomInfo, Apollo, Clearbit)"
      }
    },
    required: ["competitor"]
  },
  annotations: { readOnlyHint: true },
  execute: async (params) => {
    // Returns structured comparison data as JSON
    return {
      cursive: { visitor_id_rate: "70%", starting_price: "$1,000/mo", ... },
      competitor: { name: params.competitor, visitor_id_rate: "~30-40%", ... },
      full_comparison_url: "https://www.meetcursive.com/blog/..."
    }
  }
})`}</code></pre>

            <p>
              One function call. Structured input, structured output. No screenshots, no DOM parsing, no guessing which card contains which tier.
            </p>

            <h3 id="declarative-forms">Declarative Forms</h3>

            <p>
              We annotated seven existing forms across the site with WebMCP declarative attributes. Our contact form, free audit request, custom audience builder, exit-intent popups, newsletter subscription, and <a href="/pricing">pricing tier selector</a> all carry <code>toolname</code> and <code>tooldescription</code> attributes on the form element, with <code>toolparamdescription</code> on each input. An agent encountering our contact form doesn&apos;t have to guess what &ldquo;Message&rdquo; means &mdash; it reads the attribute and knows it&apos;s for &ldquo;a message describing what you need help with (e.g., demo request, pricing question, partnership inquiry).&rdquo;
            </p>

            <h3 id="supporting-infrastructure">Supporting Infrastructure</h3>

            <p>
              WebMCP tools are the headliner, but agent discoverability requires a full stack. We also ship:
            </p>

            <p>
              An <strong><code>llms.txt</code></strong> file at the site root &mdash; the emerging standard (think <code>robots.txt</code> for AI) that tells language models what the site is about, what tools are available, and where to find structured data.
            </p>

            <p>
              A <strong><code>/api/ai-info</code></strong> endpoint that returns Cursive&apos;s complete product information as a single JSON response. Any LLM or agent can fetch this URL and get products, services, pricing, stats, customer results, and available WebMCP tools in one request, cached for one hour. This works regardless of whether the agent supports WebMCP &mdash; it&apos;s just HTTP.
            </p>

            <p>
              <strong>JSON-LD structured data</strong> across every key page: Organization and SoftwareApplication schemas on the homepage, Product and FAQPage schemas on pricing, Service schemas on the services page, and BlogPosting schemas on every article.
            </p>

            <p>
              <strong>Semantic HTML with section IDs</strong> on the homepage (<code>#hero</code>, <code>#products</code>, <code>#pricing</code>, <code>#case-studies</code>, <code>#industries</code>, <code>#faq</code>) so agents can navigate directly to relevant sections without scrolling through the entire page.
            </p>

            {/* Section 5: What This Means for Your Website */}
            <h2 id="what-this-means-for-your-website">What This Means for Your Website</h2>

            <p>
              AI agents are already visiting your website. Per Imperva&apos;s 2025 report, 51% of web traffic is now automated. Most of that is traditional bots, but the share attributable to AI agents &mdash; LLMs dispatched to browse, evaluate, and take action on behalf of humans &mdash; is growing fast. The question isn&apos;t whether to optimize for agents. It&apos;s when.
            </p>

            <p>
              If you want to start today, here&apos;s the practical path. First, create an <code>llms.txt</code> file and a <code>/api/ai-info</code> JSON endpoint. This takes thirty minutes and immediately gives any LLM a structured way to understand your product, independent of any browser standard. Second, if you have forms on your site &mdash; contact forms, demo requests, signup flows &mdash; add WebMCP declarative attributes. Another thirty minutes. Add <code>toolname</code> and <code>tooldescription</code> to the <code>&lt;form&gt;</code> element, <code>name</code> attributes to every input (you should have these already), and <code>toolparamdescription</code> where the field name alone isn&apos;t self-explanatory. Third, for real differentiation, register imperative tools that expose your product&apos;s core value proposition. What would a prospect&apos;s AI assistant want to ask? Pricing, comparisons, capabilities, how to get started. Those are your tools.
            </p>

            <p>
              The companies that build their agent interface now will have the same advantage that early SEO adopters had in 2010. Not because Google is going to rank WebMCP-enabled sites higher (though structured data has historically correlated with better search visibility). But because when AI agents become a meaningful share of your website traffic &mdash; evaluating your product on behalf of prospects &mdash; the site that gives them a structured, reliable path will consistently outperform the site that forces them to guess.
            </p>

            {/* Section 6: CTA */}
            <h2 id="see-it-in-action">See It in Action</h2>

            <p>
              If you want to see WebMCP working, visit <a href="https://www.meetcursive.com">meetcursive.com</a> with Chrome 146 Canary and the <a href="https://developer.chrome.com/blog/webmcp-epp" target="_blank" rel="noopener noreferrer">Experimental Web Platform Features</a> flag enabled. Open DevTools, check the console for &ldquo;[WebMCP] Cursive tools registered successfully,&rdquo; and install the Model Context Tool Inspector extension to see all six tools in the sidebar.
            </p>

            <p>
              If you want Cursive to identify who&apos;s visiting <em>your</em> site &mdash; human or agent &mdash; <a href="https://cal.com/cursive/30min" target="_blank" rel="noopener noreferrer">book a free AI audit</a>. We&apos;ll show you exactly which companies are on your site right now, what pages they&apos;re viewing, and how to reach them before your competitors do.
            </p>

            <p>
              The agentic web is here. Your move.
            </p>

          </article>
        </Container>
      </section>

      {/* CTA Section */}
      <DashboardCTA
        headline="Ready to See Who's"
        subheadline="Visiting Your Site?"
        description="Human or AI agent — Cursive identifies your website visitors in real-time. Book a free AI audit and see which companies are researching your product right now."
      />

      {/* Related Posts */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <h2 className="text-3xl font-bold mb-8 text-center">Read Next</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link href="/blog/what-is-webmcp-guide" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">What Is WebMCP?</h3>
              <p className="text-sm text-gray-600">A practical guide for B2B marketers and growth teams</p>
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
    </main>
  )
}
