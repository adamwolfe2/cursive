/* Homepage FAQ: rendered by FAQSection and mirrored in the machine view and FAQ schema. Plain module so the
   server page can import it. Short, sourced answers only; claims must match the pricing section. */

export interface FAQ {
  question: string
  answer: string
}

// Short, sourced answers only. Claims here must match the pricing cards and the homepage FAQ schema in app/page.tsx.
export const faqs: FAQ[] = [
  {
    question: "Where do the 25 people come from?",
    answer: "We read your website, work out who buys from you, and match that profile against 400M+ business contacts, multi-sourced and enriched across several databases. You get 25 decision makers who fit, each with a work email and a reason they fit.",
  },
  {
    question: "How accurate are the emails?",
    answer: "Every email is checked before it reaches you. If we cannot verify a work email, that person is left out of your list.",
  },
  {
    question: "What happens after the free 25?",
    answer: "Nothing, unless you want more. Buy credits (100 leads for $49), take 100 leads a month on Starter for $197, or have us run LinkedIn and email outreach to your list from $1,497 a month. All month-to-month.",
  },
  {
    question: "How is Cursive different from ZoomInfo or Apollo?",
    answer: "Databases sell you contacts and leave the rest to you. Cursive starts from who actually buys from you, learns from the leads you like and your past customers, and can run the outreach for you.",
  },
  {
    question: "Is Cursive compliant?",
    answer: "We follow GDPR and CCPA, honor opt-outs, and never sell your data to third parties.",
  },
]

/* /pricing questions. Prices from the approved ladder (.claude/specs/2026-10-01-cursive-pivot.md). */
export const pricingFaqs: FAQ[] = [
  {
    question: "What counts as a lead?",
    answer: "One person who fits your buyer profile: name, title, company, a checked work email and a line on why they fit. If we cannot check a work email, that person is left out and does not count.",
  },
  {
    question: "Do credits expire?",
    answer: "No. Credits roll over month to month, so a 500-lead pack can last as long as you need it to. Credit packs are in early access.",
  },
  {
    question: "Credits or a plan: which should I pick?",
    answer: "Credits suit pulling a list when you need one. Starter suits a steady 25 fresh leads every Monday without thinking about it. Growth adds Cursive learning from the leads you like and your customer list, so each batch gets closer to your best buyers.",
  },
  {
    question: "How does the 14-day Starter trial work?",
    answer: "You get your Monday leads for 14 days before the first charge. Cancel from your billing page before the trial ends and you are not charged.",
  },
  {
    question: "What does done-for-you outreach include?",
    answer: "LinkedIn is $1,497 a month: one sender profile, about 400 connection requests a month inside LinkedIn's limits, with copy written and run by our team. LinkedIn + email is $2,497 a month and adds an email domain and inboxes. Both include Growth leads.",
  },
  {
    question: "What is the operating system?",
    answer: "A dashboard we build for your company that ties together your leads, replies, site visitors, site chat, CRM and any API you use. Setup starts at $2,500, then $500 a month to host and maintain it. We scope it on a call.",
  },
  {
    question: "Is there a contract?",
    answer: "No. Every plan is month-to-month. Cancel any time.",
  },
]
