/**
 * Landing-page testimonials.
 *
 * ⚠️ FICTITIOUS PLACEHOLDER REVIEWS — created for layout/social-proof while
 * real customer reviews are collected. Replace with verified testimonials
 * before any claim-sensitive campaign. Do NOT present these as real customers
 * externally beyond the funnel test phase.
 */

export interface Testimonial {
  name: string
  title: string
  company: string
  quote: string
  /** Star rating, 1-5. All 5 for now. */
  rating: number
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Marcus Bell',
    title: 'Founder',
    company: 'Northwind SaaS',
    quote:
      'We identified 43 companies hitting our pricing page in the first week — people we had no idea were even looking. Two are already in our pipeline.',
    rating: 5,
  },
  {
    name: 'Priya Raman',
    title: 'VP Sales',
    company: 'Ledgerline',
    quote:
      'The pixel paid for itself in 6 days. My reps stopped guessing who to call and started working warm website visitors instead.',
    rating: 5,
  },
  {
    name: 'Devin Carter',
    title: 'Agency Owner',
    company: 'Carter & Co Growth',
    quote:
      'I resell this to every client now. The weekly audience replaced an entire SDR research role — fresh in-market buyers every Monday.',
    rating: 5,
  },
  {
    name: 'Sofia Mendes',
    title: 'Head of Demand Gen',
    company: 'Brightform',
    quote:
      'Install took literally one snippet. By the afternoon we were watching named contacts from target accounts land on the site in real time.',
    rating: 5,
  },
  {
    name: 'Aaron Whitfield',
    title: 'CEO',
    company: 'Stackhouse Labs',
    quote:
      'We booked 7 meetings in our first month purely from visitors the pixel surfaced. Nothing else we tried came close to that ROI.',
    rating: 5,
  },
  {
    name: 'Lena Kovács',
    title: 'Marketing Director',
    company: 'Vireo Health Tech',
    quote:
      'Finally I can prove which companies my campaigns actually drive to the site. The attribution conversation with our board completely changed.',
    rating: 5,
  },
  {
    name: 'Trevor Nash',
    title: 'Co-Founder',
    company: 'Onsite CRM',
    quote:
      'The audience list is scarily accurate. Real titles, real verified emails, built around our exact ICP. We close at 3x off this list.',
    rating: 5,
  },
  {
    name: 'Hannah Okafor',
    title: 'Growth Lead',
    company: 'Paperdove',
    quote:
      'I was skeptical of anonymous-visitor tools — most are junk. This one actually names the person, not just the company. Game changer.',
    rating: 5,
  },
  {
    name: 'Diego Salinas',
    title: 'Founder',
    company: 'Routewise Logistics',
    quote:
      'Our website traffic was a black box for years. Now every visit is a named lead in a dashboard my team checks every morning.',
    rating: 5,
  },
  {
    name: 'Megan Fairbanks',
    title: 'VP Marketing',
    company: 'Cobalt Financial',
    quote:
      'The 24-hour audience promise is real — first list landed overnight and it was better targeted than anything our old data vendor sent.',
    rating: 5,
  },
  {
    name: 'Caleb Yoon',
    title: 'Sales Manager',
    company: 'Tideline Software',
    quote:
      'My SDRs now start every day with a list of companies that visited but did not convert. Our reply rates doubled almost immediately.',
    rating: 5,
  },
  {
    name: 'Rachel Imani',
    title: 'Owner',
    company: 'Imani Media',
    quote:
      'Cancel-any-time made it a no-brainer to try. Three months later I would fight you to keep it. The weekly buyers list is pure gold.',
    rating: 5,
  },
  {
    name: 'Jonah Pressley',
    title: 'Director of RevOps',
    company: 'Halcyon Cloud',
    quote:
      'We piped the identified visitors straight into our CRM. It is like having intent data and visitor identification in one clean feed.',
    rating: 5,
  },
  {
    name: 'Bianca Torres',
    title: 'Founder',
    company: 'Lumen Studio',
    quote:
      'As a small team this is the closest thing to having a full data team. Setup was minutes, value was same-day.',
    rating: 5,
  },
  {
    name: 'Garrett Lowe',
    title: 'Head of Sales',
    company: 'Meridian B2B',
    quote:
      'The quality of the contact data is the best I have seen — verified mobile and business emails, not stale scraped lists.',
    rating: 5,
  },
  {
    name: 'Amara Diallo',
    title: 'CMO',
    company: 'Frostbyte AI',
    quote:
      'We spotted a Fortune 500 logo on our visitor feed, reached out same day, and it turned into our biggest deal of the quarter.',
    rating: 5,
  },
  {
    name: 'Sean Mulligan',
    title: 'Founder',
    company: 'Quayside Consulting',
    quote:
      'Replaced two separate subscriptions with this. Cheaper, faster, and the data is fresher. Should have switched a year ago.',
    rating: 5,
  },
  {
    name: 'Nina Berkovich',
    title: 'Demand Gen Manager',
    company: 'Saplytics',
    quote:
      'The weekly refresh keeps the list from going stale. Every Monday it is new in-market people, not the same names recycled.',
    rating: 5,
  },
  {
    name: 'Oscar Delgado',
    title: 'Partner',
    company: 'Delgado Realty Group',
    quote:
      'Even in real estate this works — I see exactly which prospects are browsing listings and I follow up while they are still warm.',
    rating: 5,
  },
  {
    name: 'Priscilla Adeyemi',
    title: 'VP Growth',
    company: 'Knitwell Commerce',
    quote:
      'Our cost per booked meeting dropped by more than half once we started working website visitors instead of cold lists.',
    rating: 5,
  },
  {
    name: 'Wesley Tan',
    title: 'Founder',
    company: 'Bracket Analytics',
    quote:
      'I expected to babysit the setup. Instead I pasted one line, walked away, and came back to a feed of named buyers. Effortless.',
    rating: 5,
  },
  {
    name: 'Daniela Rossi',
    title: 'Head of Marketing',
    company: 'Ferro Industrial',
    quote:
      'Long sales cycle, niche industry — and it still surfaced the exact procurement people we needed. Genuinely impressed.',
    rating: 5,
  },
  {
    name: 'Kofi Mensah',
    title: 'CEO',
    company: 'Adinkra Apps',
    quote:
      'Support actually replies, the product does what the page says, and the ROI is obvious in the dashboard. Rare combination.',
    rating: 5,
  },
  {
    name: 'Holly Vanterpool',
    title: 'Sales Director',
    company: 'Cedarpoint SaaS',
    quote:
      'We turned anonymous traffic into a six-figure pipeline in one quarter. My only regret is not finding this sooner.',
    rating: 5,
  },
  {
    name: 'Ravi Chandran',
    title: 'Founder',
    company: 'Polaris Outbound',
    quote:
      'The audience built around our ICP was tighter than what our $2k/mo data provider gave us. We churned them and kept this.',
    rating: 5,
  },
  {
    name: 'Emily Stratton',
    title: 'Growth Marketer',
    company: 'Hearthside Co',
    quote:
      'It is the first tool my whole team adopted without me forcing it. They open the visitor dashboard before their inbox now.',
    rating: 5,
  },
  {
    name: 'Mateo Vargas',
    title: 'Co-Founder',
    company: 'Gridline Ventures',
    quote:
      'Clean dashboard, no bloat, just the buyers. Exactly what a busy founder needs. Worth every dollar.',
    rating: 5,
  },
  {
    name: 'Janelle Brooks',
    title: 'VP Revenue',
    company: 'Solstice HR',
    quote:
      'We tied a closed-won deal back to a visitor the pixel identified on day three. That single deal covered a year of the subscription.',
    rating: 5,
  },
]
