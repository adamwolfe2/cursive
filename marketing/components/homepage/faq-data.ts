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
