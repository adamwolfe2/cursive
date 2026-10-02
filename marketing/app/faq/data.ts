import type { FAQ } from "@/components/homepage/faq-data"
import { faqs as homeFaqs, pricingFaqs } from "@/components/homepage/faq-data"

/*
 * /faq: the homepage and pricing answers (single source, so they cannot drift) plus the questions that
 * do not fit either page. Prices from the approved ladder (.claude/specs/2026-10-01-cursive-pivot.md).
 */
const EXTRA: FAQ[] = [
  {
    question: "How long does it take to get my 25 leads?",
    answer: "About a minute. Paste your website, check the buyer profile we write from it, and the 25 leads are ready. No card and no call.",
  },
  {
    question: "What if I do not have a website?",
    answer: "You can describe what you sell instead, and we build the buyer profile from that.",
  },
  {
    question: "Can I tell Cursive which leads are right?",
    answer: "Yes. Like the good ones and skip the rest. Upload past customers too, and every next batch gets closer to your ideal buyer. Growth tunes batches from both.",
  },
  {
    question: "Who runs the outreach?",
    answer: "Our team does. We write the copy and run LinkedIn and email sequences to your list inside each platform's limits, then hand you the replies.",
  },
  {
    question: "What does the Visitor Pixel do?",
    answer: "It shows which companies visit your site. It is a $97 a month add-on to any step, and we show the visitors we can identify rather than guessing at the rest.",
  },
  {
    question: "Which tools does Cursive connect to?",
    answer: "Leads can be exported, sent by webhook or passed through Zapier to your CRM, inbox or sequencer. The integrations page has setup guides.",
  },
  {
    question: "How do I talk to a person?",
    answer: "Book a call from any page, or email hey@meetcursive.com.",
  },
]

/** Questions in reading order: getting started, how it works, what it costs, then the rest. */
export const allFaqs: FAQ[] = [homeFaqs[0], EXTRA[0], EXTRA[1], homeFaqs[1], EXTRA[2], EXTRA[3], EXTRA[4], EXTRA[5], ...pricingFaqs, homeFaqs[2], homeFaqs[3], homeFaqs[4], EXTRA[6]]
