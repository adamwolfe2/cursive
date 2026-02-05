'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  headings: Heading[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    )

    // Observe all heading elements
    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -80 // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveId(id)
    }
  }

  if (headings.length === 0) return null

  return (
    <nav
      className="sticky top-24 hidden lg:block print:hidden"
      aria-label="Table of contents"
    >
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          On This Page
        </h2>
        <ul className="space-y-2 border-l-2 border-gray-200">
          {headings.map((heading) => (
            <li key={heading.id} className={cn(heading.level === 3 && 'ml-4')}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                className={cn(
                  'block py-1 px-3 text-sm transition-colors border-l-2 -ml-[2px]',
                  activeId === heading.id
                    ? 'border-[#007AFF] text-[#007AFF] font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-400'
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
