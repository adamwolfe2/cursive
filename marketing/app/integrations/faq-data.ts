import type { FAQ } from "@/components/homepage/faq-data"

/* /integrations questions. Matches the homepage line: leads go out by export, webhook or Zapier. */
export const integrationsFaqs: FAQ[] = [
  {
    question: "How do leads get into my CRM or sequencer?",
    answer:
      "Export them as a CSV, send them by webhook, or pass them through Zapier. The guides on this page show the field mapping for each tool.",
  },
  {
    question: "Is there an API?",
    answer:
      "Webhooks and an API cover tools without a guide. Talk to us about what you want to connect and we will tell you how.",
  },
  {
    question: "Are these one-click connections?",
    answer:
      "Most guides use a webhook or Zapier rather than a one-click app, so setup takes a few minutes of mapping fields. On the operating system we build the connections for you.",
  },
  {
    question: "Does it cost extra?",
    answer:
      "No. Sending leads out is part of every plan. Having us build and maintain connections inside a dashboard is part of the operating system, from $2,500 setup plus $500 a month.",
  },
  {
    question: "Can you connect a tool that is not listed?",
    answer:
      "Usually, through a webhook or Zapier. Book a call and tell us the tool.",
  },
]
