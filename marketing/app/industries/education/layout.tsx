import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Education Marketing Solutions',
  description: 'Student recruitment and enrollment marketing for colleges, universities, and online education providers.',
  keywords: ['education marketing', 'student recruitment', 'enrollment marketing', 'higher education marketing', 'college marketing'],
  canonical: 'https://meetcursive.com/industries/education',
})

export default function EducationLayout({ children }: { children: React.ReactNode }) {
  return children
}
