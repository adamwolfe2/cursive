"use client"

import { useView } from '@/lib/view-context'

interface ViewWrapperProps {
  children: React.ReactNode
}

/**
 * HumanView — Always renders children in DOM for SSR.
 * Uses CSS to hide when machine view is active.
 */
export function HumanView({ children }: ViewWrapperProps) {
  const { view } = useView()
  return (
    <div className={view !== 'human' ? 'hidden' : ''} data-view="human">
      {children}
    </div>
  )
}

/**
 * MachineView — Always renders children in DOM for SSR/SEO.
 * Content is screen-reader-only by default (accessible to crawlers),
 * becomes visible when machine view is active via ?view=machine.
 */
export function MachineView({ children }: ViewWrapperProps) {
  const { view } = useView()
  return (
    <div
      className={
        view === 'machine'
          ? 'machine-view bg-white text-gray-900 font-mono text-sm leading-relaxed border-t border-gray-200'
          : 'sr-only'
      }
      data-view="machine"
    >
      {children}
    </div>
  )
}

interface MachineContentProps {
  children: React.ReactNode
  className?: string
}

export function MachineContent({ children, className = '' }: MachineContentProps) {
  return (
    <div className={`max-w-3xl mx-auto px-6 py-12 ${className}`}>
      {children}
    </div>
  )
}

interface MachineSectionProps {
  title: string
  children: React.ReactNode
}

export function MachineSection({ title, children }: MachineSectionProps) {
  return (
    <section className="mb-10">
      <h2 className="text-lg text-gray-900 mb-4 font-bold">## {title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

interface MachineLinkProps {
  href: string
  children: React.ReactNode
}

export function MachineLink({ href, children }: MachineLinkProps) {
  return (
    <a href={href} className="text-[#007AFF] hover:text-[#0066DD] transition-colors underline">
      [{children}]({href})
    </a>
  )
}

interface MachineListProps {
  items: string[] | { label: string; href?: string; description?: string }[]
}

export function MachineList({ items }: MachineListProps) {
  return (
    <ul className="space-y-2 ml-4">
      {items.map((item, i) => {
        if (typeof item === 'string') {
          return (
            <li key={i} className="before:content-['•'] before:mr-2 before:text-gray-400">
              {item}
            </li>
          )
        }
        return (
          <li key={i} className="before:content-['•'] before:mr-2 before:text-gray-400">
            {item.href ? (
              <>
                <MachineLink href={item.href}>{item.label}</MachineLink>
                {item.description && (
                  <span className="text-gray-600 block ml-4 mt-1 text-xs">{item.description}</span>
                )}
              </>
            ) : (
              <>
                {item.label}
                {item.description && (
                  <span className="text-gray-600 block ml-4 mt-1 text-xs">{item.description}</span>
                )}
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}
