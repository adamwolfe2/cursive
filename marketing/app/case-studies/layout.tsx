import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Case Studies - Customer Success Stories',
  description: 'See how B2B companies use Cursive to identify website visitors, build targeted audiences, and generate qualified leads. Real results from real customers across multiple industries.',
  keywords: ['case studies', 'customer stories', 'B2B success stories', 'lead generation results', 'visitor identification case study', 'marketing ROI', 'customer testimonials'],
  canonical: 'https://www.meetcursive.com/case-studies',
})

export default function CaseStudiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
