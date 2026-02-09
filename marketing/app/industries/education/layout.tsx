import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Education Lead Generation & Visitor Identification',
  description: 'Identify prospective students browsing your program pages. Turn anonymous website visitors into enrolled students with AI-powered outreach for colleges, universities, and online education providers.',
  keywords: ['education lead generation', 'student recruitment leads', 'enrollment marketing', 'higher education visitor identification', 'college website visitor tracking', 'online education lead gen', 'university prospecting'],
  canonical: 'https://meetcursive.com/industries/education',
})

export default function EducationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'Education', url: 'https://meetcursive.com/industries/education' },
      ])} />
      {children}
    </>
  )
}
