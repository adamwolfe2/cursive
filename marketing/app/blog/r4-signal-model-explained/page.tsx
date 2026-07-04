"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowLeft, Check } from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"

const faqs = [
  {
    question: "What is the R4 Signal Model?",
    answer: "The R4 Signal Model is Cursive's four-layer framework for transforming raw behavioral intent signals into high-confidence buying signals. The four layers are: R1 Relevance (curated 28,000-domain signal feed with +28% relevance over co-op data), R2 Reasoning (URL-level buyer-stage classification at 6x the depth of keyword-only models), R3 Recognition (vertical-aware industry cohort models trained per category), and R4 Restrictions (noise suppression that filters 202,000+ irrelevant visit types including competitors, job seekers, and internal traffic). Together, the four layers convert a raw behavioral signal set into a high-confidence, low-volume list of accounts in active buying stages."
  },
  {
    question: "How does intent data quality affect pipeline conversion rates?",
    answer: "Intent data quality has a direct and compounding effect on pipeline conversion. Low-quality intent data (broad co-op feeds, keyword-only matching, no noise suppression) produces high-volume signal lists where the majority of flagged accounts are not actually in a buying cycle. Sales teams reach out, find low response rates, and lose confidence in the signal. Over time they stop using it. High-quality intent data (curated feeds, URL-level reasoning, vertical cohort models, noise suppression) produces smaller lists with a much higher proportion of genuinely in-market accounts. Teams that have moved from keyword-level to URL-level intent classification typically see conversion rates 3-5x higher on the same outreach volume."
  },
  {
    question: "What is the difference between R1 Relevance and a standard co-op intent network?",
    answer: "A standard co-op intent network aggregates behavioral signals from thousands of publishers who share data in exchange for network access. The selection criteria for publishers is primarily reach and volume, not relevance to B2B buying research. This means signals come from general news sites, entertainment content, and tangentially related properties alongside genuine research destinations. R1 Relevance is a curated 28,000-domain feed built specifically for B2B buying signal relevance. Every domain in the feed is evaluated for its contribution to genuine buyer research signals. The result is a +28% improvement in signal relevance compared to co-op data, meaning fewer false positives and more signals that correspond to actual buying activity."
  },
  {
    question: "How does URL-level buyer-stage classification work?",
    answer: "URL-level buyer-stage classification analyzes the specific page visited — not just whether the page contains target keywords — and combines it with the content type, page structure, and visiting company profile to infer where the buyer is in their purchase decision. A definitional blog post ('What is marketing automation?') signals early-stage awareness. A feature comparison page signals mid-stage active consideration. A pricing page or vendor comparison review signals late-stage evaluation. Keyword-only classification would score all three the same. URL-level classification at 6x depth means the system evaluates multiple signals per URL — topic, content type, intent modifier words, structure, and company context — to produce a buyer-stage score rather than a binary in-market flag."
  },
  {
    question: "What is an industry cohort model in the context of intent data?",
    answer: "An industry cohort model is a machine learning model trained specifically on the buying behavior patterns of a particular industry vertical, rather than on aggregate cross-industry data. Different verticals have different research patterns: a B2B SaaS company evaluating a sales intelligence tool will visit different types of content in a different sequence than a healthcare organization evaluating the same tool. Training a single model on all industries dilutes vertical-specific patterns and produces signals that feel misaligned for sales teams working specific verticals. R3 Recognition trains separate cohort models per industry — B2B SaaS, healthcare, financial services, logistics, and others — so the system understands what 'high intent' looks like within each vertical from day one."
  },
  {
    question: "How does R4 Restrictions filter noise from intent signals?",
    answer: "R4 Restrictions applies a multi-layer suppression filter that removes non-buyer visits from the signal set before scoring and delivery. The filter suppresses: competitor visits (where the visitor's company competes in your category — competitor research is not buyer intent), internal traffic (visits from your own employees and known internal IP ranges), job seeker visits (individuals viewing your careers or company pages rather than product content), student and academic visits (identifiable by institutional email domains and research behavior patterns), and media/press researchers (journalists and analysts researching the category rather than buying). Across a typical intent signal set, R4 Restrictions suppresses 202,000+ irrelevant visit types, dramatically reducing the noise that would otherwise inflate apparent intent scores without producing real buying signals."
  },
  {
    question: "What results can teams expect from the full R4 Signal Model vs. keyword-only intent?",
    answer: "Teams migrating from keyword-only intent data to the full R4 framework typically see two primary improvements. First, signal list size decreases significantly — instead of a 10,000-account 'intent list' that is difficult to work at scale, they receive a 500-account high-confidence list of accounts in genuinely active buying stages. This is a feature, not a limitation: the sales team can actually work through 500 accounts with proper personalization. Second, conversion rates from intent-triggered outreach increase substantially because the accounts receiving outreach are further along in their buying journey. A B2B SaaS case study applying R3 industry cohorts and R4 noise suppression improved audience accuracy from 12% to 94% — meaning 94% of flagged accounts were confirmed in-market vs. 12% previously."
  },
  {
    question: "How does Cursive's Super Pixel fit into the R4 Signal Model?",
    answer: "Cursive's Super Pixel is the on-site identity resolution layer that operates alongside the R4 Signal Model. While R4 processes off-site behavioral signals from Cursive's 28,000-domain feed, the Super Pixel identifies the specific individuals visiting your own website — capturing up to 70% of anonymous visitors by name, email, job title, and company. The two layers are complementary: R4 tells you which companies are actively researching your category across the web; the Super Pixel tells you which specific individuals at those companies are actively researching your product. The intersection of a strong R4 off-site signal and a Super Pixel on-site visit represents a high-confidence, person-level signal that is ready for immediate outreach."
  },
  {
    question: "How does Cursive compare to Bombora or 6sense for intent data quality?",
    answer: "Bombora and 6sense both operate primarily on co-op network models that prioritize coverage and volume over relevance precision. Bombora's co-op network spans thousands of B2B publishers but uses keyword-level topic scoring rather than URL-level buyer-stage classification. 6sense layers AI scoring on top of similar co-op signals and adds account engagement data from marketing automation platforms. Cursive's differentiation is the R4 framework: a curated 28,000-domain feed optimized for relevance (not co-op volume), URL-level classification at 6x depth, vertical cohort models for industry precision, and noise suppression that removes 202,000+ irrelevant visits before scoring. Additionally, Cursive's Super Pixel provides person-level identity resolution that neither Bombora nor 6sense delivers natively at the same fidelity."
  }
]

const relatedPosts = [
  {
    title: "Why Intent Data Fails — And How to Fix It",
    description: "The 6 structural failure modes of legacy intent platforms and how to diagnose which one is hurting your ROI.",
    href: "/blog/why-intent-data-fails"
  },
  {
    title: "Intent Score Acceleration",
    description: "How to use real-time intent signals and visitor identification to accelerate pipeline velocity.",
    href: "/blog/intent-score-acceleration"
  },
  {
    title: "B2B Lead Generation Guide 2026",
    description: "The complete B2B lead generation playbook covering inbound, outbound, intent data, and visitor identification.",
    href: "/blog/b2b-lead-generation-guide-2026"
  },
]

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateFAQSchema({ faqs })} />
      <StructuredData data={generateBlogPostSchema({
        title: "The R4 Signal Model: How Cursive Turns Raw Intent Into High-Confidence Buying Signals",
        description: "The R4 Signal Model explains how Cursive processes raw behavioral signals into high-confidence buying intent. Four layers: Relevance, Reasoning, Recognition, and Restrictions.",
        author: "Cursive Team",
        publishDate: "2026-06-12",
        image: "https://www.meetcursive.com/cursive-logo.png"
      })} />

      <HumanView>
        {/* Header */}
        <section className="py-12 bg-white">
          <Container>
            <div className="max-w-3xl mx-auto">
              <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="inline-block px-3 py-1 bg-primary text-white rounded-full text-sm font-medium mb-4">
                Technology
              </div>
              <h1 className="text-5xl font-bold mb-6">
                The R4 Signal Model: How Cursive Turns Raw Intent Into High-Confidence Buying Signals
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Raw behavioral data is not intent data. The gap between a page visit and a confident buying
                signal is the gap most intent platforms fail to close. The R4 Signal Model is Cursive's
                framework for closing it — four processing layers that transform high-volume, low-confidence
                signals into a short list of accounts in genuine active buying stages.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>June 12, 2026</span>
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

              <p>
                When a company visits a review site, reads a product comparison article, or searches for
                vendor alternatives, that behavioral signal has genuine value — it suggests the company is
                actively thinking about a purchase decision. The challenge is that the same category of signal
                (a page visit, a content consumption event) is also generated by competitors doing research,
                students writing papers, journalists covering the industry, and job seekers evaluating career
                options. Without processing, raw behavioral signals are too noisy to act on.
              </p>

              <p>
                Most intent data platforms solve the noise problem incompletely. They aggregate signals at
                scale, run them through keyword-matching models, and deliver a list of accounts scored
                "high intent" — without addressing the fundamental question of whether those signals represent
                genuine buying activity. The result is a conversion problem that the industry has largely
                attributed to sales execution rather than signal quality.
              </p>

              <p>
                The R4 Signal Model is Cursive's answer to the signal quality problem. It is a four-layer
                processing framework that every signal passes through before reaching a customer's sales team.
                Each layer addresses a specific failure mode in how raw behavioral data is turned into
                actionable buying signals.
              </p>

              <div className="not-prose bg-primary/5 rounded-xl p-6 my-8 border border-primary/15">
                <h3 className="font-bold text-lg mb-4">The Four Layers of R4</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">R1</div>
                    <div>
                      <p className="font-semibold text-gray-900">Relevance</p>
                      <p className="text-sm text-gray-600">28,000-domain curated signal feed — +28% relevance over co-op data</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">R2</div>
                    <div>
                      <p className="font-semibold text-gray-900">Reasoning</p>
                      <p className="text-sm text-gray-600">URL-level buyer-stage classification at 6x depth of keyword-only models</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">R3</div>
                    <div>
                      <p className="font-semibold text-gray-900">Recognition</p>
                      <p className="text-sm text-gray-600">Industry cohort models — vertical-aware from day one</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">R4</div>
                    <div>
                      <p className="font-semibold text-gray-900">Restrictions</p>
                      <p className="text-sm text-gray-600">Noise suppression — filters 202,000+ irrelevant visit types</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2>R1 — Relevance: The Signal Feed</h2>

              <p>
                The quality of an intent data output is bounded by the quality of its input. If the signal
                feed is broad and indiscriminate, no amount of downstream processing can fully recover the
                accuracy lost at the source. This is the fundamental problem with co-op data networks.
              </p>

              <p>
                Co-op networks work by recruiting thousands of publishers to share their audience behavioral
                data in exchange for access to the aggregate pool. The incentive for publishers to join is
                the size of the network; the incentive for the platform is coverage. Both incentives push
                toward volume rather than relevance. The result is a signal network where a significant
                proportion of observed behaviors are generated by visitors to sites that have nothing to
                do with B2B buying research.
              </p>

              <p>
                Consider what happens when a general technology news publication is in the co-op. Their
                readers are primarily curious technologists, industry observers, and general readers —
                not buyers in active evaluation cycles. When one of those readers clicks on an article
                mentioning CRM software, that click becomes an "intent signal" that flows downstream to
                every CRM vendor subscribed to the network. The reader was not evaluating CRM; they were
                reading tech news. But they have now been scored as in-market.
              </p>

              <p>
                Cursive's R1 Relevance layer is a curated signal feed built from 28,000 domains selected
                specifically for their contribution to genuine B2B buying research. The selection criteria
                are not reach or traffic volume — they are the behavioral characteristics of the audiences
                visiting those domains, the nature of the content produced, and the correlation between
                signals from those domains and confirmed purchase decisions.
              </p>

              <div className="not-prose bg-gray-50 rounded-xl p-6 my-6 border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">R1 by the numbers:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">28,000</p>
                    <p className="text-xs text-gray-600">Curated domains in the signal feed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">+28%</p>
                    <p className="text-xs text-gray-600">Relevance improvement over co-op data</p>
                  </div>
                </div>
              </div>

              <p>
                The +28% relevance improvement over co-op data means that a larger proportion of signals
                that enter the R4 pipeline correspond to actual buying research activity — before any
                additional processing has been applied. This is the feed quality advantage that downstream
                layers then amplify.
              </p>

              <h2>R2 — Reasoning: Buyer-Stage Classification</h2>

              <p>
                Even with a high-quality curated feed, a behavioral signal is underspecified without
                context about what it means for buyer intent. Two visitors from the same company can
                generate signals from the same domain category — one is doing preliminary awareness
                research with no near-term purchase decision, the other is actively comparing vendors
                in the final stages of evaluation. Keyword-only models score both identically.
              </p>

              <p>
                R2 Reasoning applies URL-level buyer-stage classification to every signal before scoring.
                Rather than flagging that a page about "marketing automation" was visited, the model
                examines the specific URL, its content structure, and the visiting company's profile to
                classify the buyer stage.
              </p>

              <p>
                The buyer-stage taxonomy used by R2 spans five stages:
              </p>

              <div className="not-prose overflow-x-auto my-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="border border-gray-300 p-3 text-left font-bold">Stage</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Signal Characteristics</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Example Content Types</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Relative Score Weight</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">1. Awareness</td>
                      <td className="border border-gray-300 p-3">Definitional, educational content</td>
                      <td className="border border-gray-300 p-3">"What is X", introductory guides</td>
                      <td className="border border-gray-300 p-3 text-gray-500">Low</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-3 font-medium">2. Consideration</td>
                      <td className="border border-gray-300 p-3">Category research, use-case content</td>
                      <td className="border border-gray-300 p-3">Best practices, industry reports, ROI calculators</td>
                      <td className="border border-gray-300 p-3 text-yellow-600">Medium</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">3. Active Evaluation</td>
                      <td className="border border-gray-300 p-3">Vendor-specific research, comparisons</td>
                      <td className="border border-gray-300 p-3">Comparison pages, G2/Capterra listings, case studies</td>
                      <td className="border border-gray-300 p-3 text-orange-600">High</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-3 font-medium">4. Shortlisting</td>
                      <td className="border border-gray-300 p-3">Pricing, feature detail, alternatives research</td>
                      <td className="border border-gray-300 p-3">Pricing pages, "[vendor] alternative" queries, demo requests</td>
                      <td className="border border-gray-300 p-3 text-green-600">Very High</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">5. Decision</td>
                      <td className="border border-gray-300 p-3">Contract, security, compliance research</td>
                      <td className="border border-gray-300 p-3">Security documentation, contract templates, implementation guides</td>
                      <td className="border border-gray-300 p-3 text-primary">Critical</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                The "6x depth" reference describes the number of signal attributes the R2 model evaluates
                per URL compared to keyword-only systems. A keyword system evaluates one attribute: keyword
                presence. R2 evaluates six: topic classification, content type, intent modifier language,
                page structure signals, visiting company firmographic context, and historical correlation
                of similar URL patterns with confirmed purchase events. Each attribute is weighted and
                combined into a buyer-stage score that is substantially more predictive than keyword
                presence alone.
              </p>

              <div className="not-prose bg-gray-50 rounded-xl p-6 my-6 border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Case study — Automotive dealership network:</p>
                <p className="text-sm text-gray-600 mb-3">
                  A regional automotive dealership group applied R2 URL-level buyer-stage classification
                  to their existing intent signal set. The previous keyword-level model had flagged
                  a broad pool of accounts as "auto services in-market." After applying URL-level
                  staging, 22% of the flagged audience was reclassified as active buyers — visitors
                  who were specifically researching vehicle acquisition timelines, financing options,
                  and specific inventory searches rather than general automotive content. The 22%
                  reclassified as active buyers converted at 4.1x the rate of the broader keyword-matched
                  pool when outreach was concentrated on them.
                </p>
              </div>

              <h2>R3 — Recognition: Industry Cohort Models</h2>

              <p>
                A model trained on aggregate cross-industry data learns the average buyer research pattern
                across all verticals. This average is useful in the general case but systematically wrong
                for specific industries. B2B SaaS buyers evaluating a sales intelligence tool read different
                content, in a different sequence, on different platforms, than healthcare administrators
                evaluating a patient communication tool — even if both are technically "in-market" for
                software with similar feature categories.
              </p>

              <p>
                The implication is that a single aggregate model will produce different error rates across
                different industry verticals. Verticals that closely match the aggregate pattern (typically
                the highest-volume industries that dominated the training data) will see better signal quality.
                Verticals that diverge from the aggregate pattern will see systematically worse signal quality
                — false positives and false negatives that reflect the aggregate model's blind spots.
              </p>

              <p>
                R3 Recognition addresses this by training separate industry cohort models per vertical.
                Each cohort model learns the research patterns specific to buyers in that industry —
                the sites they visit, the content types they consume at each buying stage, the sequence
                of signals that historically predicts a purchase decision. The model is vertical-aware
                from day one, which means customers in specific verticals receive signals calibrated
                to their buyers rather than calibrated to the generic B2B buyer.
              </p>

              <div className="not-prose bg-gray-50 rounded-xl p-6 my-6 border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Case study — B2B SaaS platform:</p>
                <p className="text-sm text-gray-600 mb-3">
                  A B2B SaaS company selling sales intelligence software migrated from a cross-industry
                  aggregate intent model to Cursive's R3 vertical cohort model for the B2B SaaS segment.
                  Before migration, audience accuracy — defined as the percentage of flagged accounts
                  confirmed to be in active evaluation — was 12%. After applying R3 industry cohort
                  modeling and R4 noise suppression, audience accuracy improved to 94%. The signal list
                  delivered was smaller in absolute number but 7.8x more likely to contain genuine buyers,
                  resulting in a 4.3x improvement in outreach-to-meeting conversion.
                </p>
              </div>

              <h2>R4 — Restrictions: Noise Suppression</h2>

              <p>
                Even with a curated feed, URL-level classification, and vertical cohort models, a
                meaningful portion of behavioral signals in any intent dataset are generated by non-buyers.
                Competitors researching the market. Job seekers evaluating companies. Students and academics
                doing course research. Journalists and analysts covering the industry. Internal employees
                generating signals from their own company's IP ranges. Each of these visitor categories
                produces behavioral signals that look superficially similar to buyer research but represent
                no purchase intent.
              </p>

              <p>
                R4 Restrictions is the suppression layer that identifies and removes these signal types
                before they reach scoring or delivery. The filter operates across several suppression categories:
              </p>

              <ul>
                <li>
                  <strong>Competitor suppression:</strong> Companies whose firmographic profile places them
                  in the same vendor category as the product being tracked are suppressed. A competitor
                  researching your pricing page is doing competitive intelligence, not evaluating a purchase.
                </li>
                <li>
                  <strong>Internal traffic suppression:</strong> Known internal IP ranges, employee email
                  domains, and behavioral patterns consistent with internal traffic are removed to prevent
                  your own organization's activity from inflating apparent intent.
                </li>
                <li>
                  <strong>Job seeker suppression:</strong> Visitors whose behavioral pattern is consistent
                  with career research (careers page visits, Glassdoor cross-referencing, company culture
                  content) rather than product research are filtered.
                </li>
                <li>
                  <strong>Academic and student suppression:</strong> Institutional email domains, university
                  IP ranges, and behavioral patterns consistent with coursework or academic research are removed.
                </li>
                <li>
                  <strong>Media and analyst suppression:</strong> Known media company domains, analyst firm
                  IP ranges, and behavioral patterns consistent with editorial research are filtered.
                </li>
              </ul>

              <div className="not-prose bg-gray-50 rounded-xl p-6 my-6 border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">R4 Restrictions by the numbers:</p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-gray-700">202,000+ irrelevant visit types suppressed across a representative signal set</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-gray-700">Competitor visits identified and removed before scoring</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-gray-700">Internal traffic suppressed to prevent self-inflation of intent scores</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-gray-700">Job seeker, academic, and media researcher visits filtered pre-delivery</p>
                  </div>
                </div>
              </div>

              <p>
                The practical effect of R4 Restrictions is a substantial reduction in signal volume combined
                with a substantial increase in signal precision. What was a list of 10,000 "intent accounts"
                from a co-op feed with keyword matching becomes a list of 500 high-confidence accounts after
                all four R4 layers have been applied. The 500 accounts are in genuine active buying stages.
                The remaining 9,500 were noise.
              </p>

              <h2>How the Four Layers Compound</h2>

              <p>
                The R4 layers are not independent filters applied in sequence — they are compounding
                quality multipliers. A signal that passes R1 (came from a relevant domain) is then
                enriched by R2 (buyer-stage classified), refined by R3 (scored against vertical-specific
                patterns), and cleaned by R4 (non-buyers removed). Each layer adds information and removes
                uncertainty. The combined effect is substantially larger than any single layer.
              </p>

              <div className="not-prose overflow-x-auto my-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="border border-gray-300 p-3 text-left font-bold">Processing Stage</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Hypothetical Signal Set</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Raw co-op data</td>
                      <td className="border border-gray-300 p-3">100,000 behavioral events</td>
                      <td className="border border-gray-300 p-3 text-gray-500">Baseline — no filtering</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-3 font-medium">After R1 Relevance</td>
                      <td className="border border-gray-300 p-3">~72,000 events</td>
                      <td className="border border-gray-300 p-3 text-primary">Irrelevant publisher domains removed</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">After R2 Reasoning</td>
                      <td className="border border-gray-300 p-3">~28,000 events at Stage 3+</td>
                      <td className="border border-gray-300 p-3 text-primary">Low buyer-stage signals deprioritized</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-3 font-medium">After R3 Recognition</td>
                      <td className="border border-gray-300 p-3">~18,000 events matching vertical pattern</td>
                      <td className="border border-gray-300 p-3 text-primary">Non-vertical-match signals removed</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">After R4 Restrictions</td>
                      <td className="border border-gray-300 p-3">~5,000 high-confidence events</td>
                      <td className="border border-gray-300 p-3 text-green-700">Non-buyer visitors suppressed — delivery-ready</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-2">Illustrative example. Exact ratios vary by industry vertical, target ICP, and signal set composition.</p>
              </div>

              <h2>The Super Pixel: On-Site Identity Layer</h2>

              <p>
                The R4 Signal Model processes off-site behavioral signals — activity on the 28,000-domain
                curated feed. Cursive's Super Pixel is the complementary on-site layer: a first-party
                visitor identification pixel that identifies the specific individuals visiting your website.
              </p>

              <p>
                The two layers are designed to work together. Off-site R4 signals tell you which companies
                are actively researching your category across the web. The Super Pixel tells you which
                specific individuals at those companies are actively researching your product directly.
                A company that appears in your R4 signal set (off-site intent) and whose employee visits
                your pricing page or comparison content (on-site Super Pixel) represents a high-confidence
                convergent signal: a named individual at an account that is both category-researching
                and product-evaluating.
              </p>

              <p>
                The Super Pixel achieves a 70% visitor identification rate — meaning 70% of anonymous
                visitors to your website are identified by name, email, job title, and company rather
                than remaining anonymous. For a website receiving 10,000 monthly visitors from ICP
                accounts, this represents approximately 7,000 named, contactable leads per month that
                would otherwise leave as anonymous sessions.
              </p>

              <div className="not-prose bg-primary/5 rounded-xl p-6 my-8 border border-primary/15">
                <h3 className="font-bold text-base mb-3">Convergent Signal Example</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">R4 detects Acme Corp visiting multiple comparison and pricing pages for your category (Stage 4 — Shortlisting)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">Super Pixel identifies Sarah Chen, VP of Revenue at Acme Corp, visiting your pricing page the same week</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">Result: a named, person-level lead at a confirmed high-intent account — delivered with email, title, and visit context for immediate outreach</p>
                  </div>
                </div>
              </div>

              <h2>Signal Quality as a Compounding Advantage</h2>

              <p>
                The case for the R4 Signal Model is ultimately a case for signal quality as a compounding
                advantage. Teams that operate on high-noise intent signals spend sales cycles reaching
                accounts that are not in a buying stage, burning outreach capacity on false positives,
                and progressively losing confidence in the tooling. Teams that operate on high-quality
                signals spend the same outreach capacity on accounts that are genuinely in active evaluation,
                see higher response rates, build faster pipeline, and compound their advantage as the model
                learns from those outcomes.
              </p>

              <p>
                The difference between a 10,000-account intent list at 12% buyer accuracy and a 500-account
                list at 94% buyer accuracy is not just a difference in list size. It is a difference in
                what happens to the sales team that has to work those lists. The first team works through
                10,000 accounts, finds that the vast majority are not in a buying cycle, and eventually
                de-prioritizes the intent data workflow. The second team works through 500 accounts, finds
                that most are genuinely evaluating, builds confidence in the signal, and scales the workflow.
              </p>

              <p>
                Signal quality is where the leverage is. The R4 model is Cursive's approach to delivering
                it consistently.
              </p>

              <p>
                If you want to see what R4 signal quality looks like on your own traffic,{" "}
                <Link href="/visitor-estimate" className="text-primary hover:underline">
                  run a free estimate of how many named leads your site is generating and losing
                </Link>.
                Or{" "}
                <Link href="/get-leads" className="text-primary hover:underline">
                  start with the Super Pixel
                </Link>{" "}
                and layer in the full R4 off-site signal model from there.
              </p>

              <p>
                For context on the specific failure modes that R4 was designed to address,{" "}
                <Link href="/blog/why-intent-data-fails" className="text-primary hover:underline">
                  read the companion post on why intent data fails
                </Link>.
              </p>
            </article>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/5">
          <Container>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">See what R4 signal quality looks like on your traffic</h2>
              <p className="text-gray-600 mb-8">
                Get a free estimate of how many named leads your site is generating, and see the quality
                difference between co-op intent data and Cursive's curated signal model.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button asChild size="lg">
                  <Link href="/get-leads">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/visitor-estimate">Run Free Estimate</Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>

        <SimpleRelatedPosts posts={relatedPosts} />
      </HumanView>

      <MachineView>
        <MachineContent>
          <MachineSection title="The R4 Signal Model: How Cursive Turns Raw Intent Into High-Confidence Buying Signals">
            The R4 Signal Model is Cursive's four-layer processing framework for transforming raw behavioral
            intent signals into high-confidence buying signals. The four layers are R1 Relevance, R2 Reasoning,
            R3 Recognition, and R4 Restrictions.

            R1 RELEVANCE — The Signal Feed: Most intent data platforms operate on co-op data networks that
            aggregate signals from thousands of unrelated publishers, prioritizing volume over relevance.
            R1 Relevance is a curated 28,000-domain signal feed built specifically for B2B buying signal
            quality. Selection criteria are the behavioral characteristics of domain audiences and their
            correlation with confirmed purchase decisions, not traffic volume. R1 produces a +28% relevance
            improvement over co-op data — meaning more signals entering the pipeline correspond to actual
            buying research.

            R2 REASONING — URL-Level Buyer-Stage Classification: Keyword-only intent models treat all
            page visits containing target keywords as equivalent signals regardless of buyer stage. R2
            Reasoning applies URL-level buyer-stage classification at 6x the depth of keyword-only models.
            The six signal attributes evaluated per URL are: topic classification, content type, intent
            modifier language, page structure signals, visiting company firmographic context, and historical
            correlation with confirmed purchase events. The result is a buyer-stage score spanning five
            stages (Awareness, Consideration, Active Evaluation, Shortlisting, Decision) rather than a
            binary in-market flag. Automotive dealership case study: R2 reclassified 22% of a broad
            keyword-matched audience as active buyers, who converted at 4.1x the rate of the broader pool.

            R3 RECOGNITION — Industry Cohort Models: An aggregate cross-industry intent model learns the
            average buyer research pattern across all verticals, which is systematically wrong for specific
            industries. R3 Recognition trains separate cohort models per industry vertical — B2B SaaS,
            healthcare, financial services, logistics, and others. Each model learns the research patterns
            specific to buyers in that vertical. B2B SaaS case study: migrating from an aggregate model to
            R3 vertical cohort modeling improved audience accuracy from 12% to 94% (combined with R4
            suppression), producing a 4.3x improvement in outreach-to-meeting conversion.

            R4 RESTRICTIONS — Noise Suppression: Even with a curated feed, URL-level classification, and
            vertical cohort models, a meaningful proportion of behavioral signals are generated by non-buyers:
            competitors doing market research, job seekers evaluating companies, students doing coursework,
            journalists covering the industry, and internal employees. R4 Restrictions identifies and removes
            these signal types before scoring and delivery. Suppression categories: competitor visits,
            internal traffic, job seeker visits, academic and student visits, media and analyst visits.
            Across a representative signal set, R4 suppresses 202,000+ irrelevant visit types. The practical
            effect: a 10,000-account intent list from co-op keyword matching becomes a 500-account
            high-confidence list — the right 500 accounts in active buying stages.

            THE SUPER PIXEL — On-Site Identity Layer: Cursive's Super Pixel is the complementary on-site
            layer that identifies specific individuals visiting your website. The Super Pixel achieves 70%
            visitor identification rate — name, email, job title, and company for 70% of anonymous visitors.
            It operates alongside the R4 off-site signal model: R4 identifies accounts researching your
            category across 28,000 domains; the Super Pixel identifies specific individuals researching your
            product directly. Convergent signals (R4 off-site + Super Pixel on-site) represent the
            highest-confidence buying signals in the Cursive system.

            Signal quality compounds over time. Teams operating on high-quality R4 signals build pipeline
            faster, maintain confidence in the tooling, and improve as the feedback loop connects outreach
            outcomes back to signal weights. The gap between a 12% accurate intent list and a 94% accurate
            intent list is not just list size — it is the difference between a sales team that trusts and
            scales the workflow and one that abandons it.

            <MachineLink href="/get-leads">Get Started with Cursive</MachineLink>
            <MachineLink href="/visitor-estimate">Run a Free Visitor Estimate</MachineLink>
            <MachineLink href="/blog/why-intent-data-fails">Why Intent Data Fails</MachineLink>
            <MachineLink href="/blog/intent-score-acceleration">Intent Score Acceleration</MachineLink>
            <MachineLink href="/pricing">Cursive Pricing</MachineLink>
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
