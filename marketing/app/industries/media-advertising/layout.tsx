import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Media & Advertising Lead Generation - Identify Advertisers with Cursive',
  description: 'Identify advertisers and agencies evaluating your media platform. Turn anonymous visitors into advertising revenue with AI-powered outreach and intent data.',
  keywords: ['media lead generation', 'advertising lead generation', 'publisher lead generation', 'media buyer identification', 'advertising sales leads'],
  canonical: 'https://www.meetcursive.com/industries/media-advertising',
})

const mediaAdvertisingFAQs = [
  {
    question: 'How does Cursive help media and advertising companies generate revenue leads?',
    answer: 'Cursive identifies up to 70% of anonymous advertisers, agencies, and brand marketers visiting your media platform or advertising rate card pages, turning invisible traffic into a warm pipeline of potential advertising partners. Your sales team can then reach out proactively with personalized sponsorship proposals or advertising packages tailored to what those visitors explored on your site.',
  },
  {
    question: 'How do advertising agencies use Cursive for new business development?',
    answer: 'Advertising agencies use Cursive to identify the brands and marketing directors visiting their agency website — including portfolio pages, capability decks, and pricing sections — so their new business team can follow up with personalized pitches while the prospect is still in active research mode. Combined with intent data from 450 billion+ signals, agencies can also proactively target brands that are showing signs of looking for a new agency relationship.',
  },
  {
    question: 'What intent data does Cursive provide for media buyers?',
    answer: "Cursive's 450 billion+ intent signal database surfaces brands and agencies that are actively researching advertising inventory, programmatic platforms, or specific media channels, giving media sales teams a real-time view of who is in market. This intent data allows media companies to prioritize outreach to the highest-potential advertising prospects and time their outreach to match the buyer's research cycle.",
  },
  {
    question: 'How do media companies identify advertisers actively evaluating platforms?',
    answer: 'Cursive identifies the companies and ad buyers visiting your media platform by matching their digital behavior to its proprietary identity graph, revealing advertiser names, contact information, and the specific ad products or placements they reviewed. Media sales teams use this intelligence to reach out with hyper-relevant proposals that reference the exact inventory or audience segments the advertiser was researching.',
  },
  {
    question: 'How does Cursive's visitor identification help media publishers monetize traffic?',
    answer: 'Media publishers use Cursive to identify the brands and agencies visiting their site and reading their content — traffic that represents a self-selected pool of potential advertising partners already engaged with the publication's audience. By converting this anonymous traffic into identified prospects at a 70% identification rate, publishers can build a proactive advertiser outreach program that dramatically expands their addressable revenue base.',
  },
  {
    question: 'What CRM integrations work best for media companies with Cursive?',
    answer: 'Cursive integrates with HubSpot, Salesforce, and Pipedrive — the most common CRMs used by media and advertising sales teams — so identified advertiser prospects flow directly into existing sales pipelines and activity tracking. Webhook support also enables integration with media-specific ad sales platforms and proposal management tools for a fully connected workflow.',
  },
]

export default function MediaAdvertisingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
          { name: 'Media & Advertising', url: 'https://www.meetcursive.com/industries/media-advertising' },
        ]),
        generateFAQSchema(mediaAdvertisingFAQs),
      ]} />
      {children}
    </>
  )
}
