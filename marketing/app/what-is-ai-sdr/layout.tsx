import { generateMetadata as genMeta } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = genMeta({
  title: 'What is an AI SDR? Complete Guide to AI Sales Development (2026)',
  description: 'Learn what an AI SDR is, how AI sales development representatives work, capabilities, ROI analysis, implementation guide, and how they compare to human SDRs in 2026.',
  keywords: [
    'AI SDR',
    'AI sales development representative',
    'AI sales development',
    'automated prospecting',
    'AI outbound sales',
    'AI cold email',
    'sales automation AI',
    'AI BDR',
    'automated sales outreach',
    'AI sales agent',
  ],
  canonical: 'https://www.meetcursive.com/what-is-ai-sdr',
})

const aiSdrFAQs = [
  {
    question: 'What is an AI SDR?',
    answer: 'An AI SDR (AI Sales Development Representative) is software that automates the prospecting and outreach work traditionally done by human SDRs. An AI SDR identifies target accounts, researches prospects, writes personalized outreach emails and LinkedIn messages, manages follow-up sequences, and hands off interested prospects to human closers — all automatically, at scale, 24/7.',
  },
  {
    question: 'How does an AI SDR work?',
    answer: 'AI SDRs combine visitor identification (knowing who is on your site), intent data (knowing who is actively researching your category), and AI-generated personalization to send the right message at the right time. The AI analyzes prospect data (job title, company, recent activity), generates a personalized opening line, selects the right email template variation, and schedules follow-up based on engagement signals.',
  },
  {
    question: 'What can an AI SDR do that a human SDR cannot?',
    answer: 'An AI SDR can operate 24/7 without fatigue, personalize messages for thousands of prospects simultaneously, react in real-time to website visits (sending a follow-up within minutes of a prospect visiting your pricing page), maintain perfectly consistent follow-up cadences, and A/B test copy variations across thousands of sends. At the cost of one human SDR ($5-8k/mo fully loaded), an AI SDR can run 10-50x the outreach volume.',
  },
  {
    question: 'What are the limitations of AI SDRs?',
    answer: 'AI SDRs struggle with highly complex, custom-crafted outreach that requires deep research on specific individuals. They are less effective for outbound to senior enterprise buyers who expect highly personalized, senior-to-senior communication. They also cannot handle complex multi-stakeholder negotiations or relationship-based selling. Best results come from using AI SDRs for top-of-funnel prospecting with human reps handling later-stage conversations.',
  },
  {
    question: 'How much does an AI SDR cost compared to a human SDR?',
    answer: 'A human SDR costs $60,000-$90,000/year in base salary plus benefits, management overhead, and ramp time — totaling $8,000-$15,000/month fully loaded. AI SDR platforms range from $1,000-$5,000/month for comprehensive solutions. Most companies see AI SDRs deliver 5-10x the outreach volume at 20-30% of the cost of a human SDR.',
  },
  {
    question: 'What is the difference between an AI SDR and email automation?',
    answer: 'Traditional email automation sends the same sequence to everyone on a list. AI SDRs use real-time data signals (website visits, intent signals, LinkedIn activity) to trigger outreach at the right moment, generate personalized content for each prospect using AI, and adjust follow-up timing based on engagement. The core difference: email automation is scheduled and static; AI SDRs are dynamic and signal-driven.',
  },
  {
    question: 'How do I measure AI SDR performance?',
    answer: 'Key AI SDR metrics: reply rate (benchmark: 3-8% for cold outreach), positive reply rate (benchmark: 1-3%), meetings booked per 1,000 contacts touched, cost per meeting booked (benchmark: $100-$300 for SMB, $300-$800 for enterprise), and pipeline influenced. Compare to human SDR benchmarks: typically 8-15 meetings booked per SDR per month.',
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'What is an AI SDR?', url: 'https://www.meetcursive.com/what-is-ai-sdr' },
        ]),
        generateFAQSchema(aiSdrFAQs),
      ]} />
      {children}
    </>
  )
}
