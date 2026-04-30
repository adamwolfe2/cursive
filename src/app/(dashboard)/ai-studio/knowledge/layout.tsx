import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Knowledge Base | Cursive',
  description: 'AI-generated company intelligence and knowledge base',
}

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
