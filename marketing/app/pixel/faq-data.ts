import type { FAQ } from "@/components/homepage/faq-data"

/* /pixel questions. No match rates or database sizes: we state what the Pixel does and where it stops. */
export const pixelFaqs: FAQ[] = [
  {
    question: "How does the Visitor Pixel work?",
    answer:
      "You add one snippet to your site. When someone visits, the Pixel tries to match the visit to a company and, where it can, a person, then lists them with the pages they viewed.",
  },
  {
    question: "Will it identify every visitor?",
    answer:
      "No. Plenty of visits cannot be matched to a company or person, and we do not guess. You see the visitors we can identify, not a padded list.",
  },
  {
    question: "How much does it cost?",
    answer: "$97 a month, month-to-month, as an add-on to any step. Cancel any time.",
  },
  {
    question: "Do I need the Pixel to get leads?",
    answer:
      "No. The free 25 leads, credits and plans work without it. The Pixel adds a second signal: who is already on your site.",
  },
  {
    question: "How does it fit with the operating system?",
    answer:
      "In the operating system, Pixel visitors appear in the same dashboard as your leads, replies and site chat, so you can see who is warm in one place.",
  },
]
