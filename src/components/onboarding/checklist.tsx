'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface ChecklistItem {
  id: string
  title: string
  description: string
  href: string
  completed: boolean
}

const CHECKLIST_ITEMS: Omit<ChecklistItem, 'completed'>[] = [
  {
    id: 'profile',
    title: 'Complete your profile',
    description: 'Add your company details and contact information',
    href: '/settings/client-profile',
  },
  {
    id: 'team',
    title: 'Invite team members',
    description: 'Add collaborators to your workspace',
    href: '/settings/team',
  },
  {
    id: 'credits',
    title: 'Purchase marketplace credits',
    description: 'Buy credits to unlock lead purchases',
    href: '/marketplace/credits',
  },
  {
    id: 'leads',
    title: 'Browse marketplace leads',
    description: 'Find and purchase high-quality leads',
    href: '/marketplace',
  },
  {
    id: 'routing',
    title: 'Set up lead preferences',
    description: 'Configure your lead targeting and preferences',
    href: '/my-leads/preferences',
  },
]

export function OnboardingChecklist() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [items, setItems] = useState<ChecklistItem[]>([])

  useEffect(() => {
    // Check if checklist was dismissed
    const dismissed = localStorage.getItem('onboarding_checklist_dismissed')
    if (dismissed === 'true') {
      setIsVisible(false)
      return
    }

    // Load completion state from localStorage
    const savedState = localStorage.getItem('onboarding_checklist')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        const itemsWithState = CHECKLIST_ITEMS.map((item) => ({
          ...item,
          completed: parsed[item.id] || false,
        }))
        setItems(itemsWithState)
      } catch {
        // Invalid saved state, use defaults
        setItems(CHECKLIST_ITEMS.map((item) => ({ ...item, completed: false })))
      }
    } else {
      setItems(CHECKLIST_ITEMS.map((item) => ({ ...item, completed: false })))
    }

    setIsVisible(true)
  }, [])

  const toggleItemCompletion = (itemId: string) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    setItems(updatedItems)

    // Save to localStorage
    const state = updatedItems.reduce(
      (acc, item) => {
        acc[item.id] = item.completed
        return acc
      },
      {} as Record<string, boolean>
    )
    localStorage.setItem('onboarding_checklist', JSON.stringify(state))
  }

  const dismiss = () => {
    localStorage.setItem('onboarding_checklist_dismissed', 'true')
    setIsVisible(false)
  }

  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length
  const progressPercent = (completedCount / totalCount) * 100

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-border rounded-lg overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-background/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-background border border-border rounded-lg flex items-center justify-center p-1.5 shadow-sm">
            <Image
              src="/cursive-logo.png"
              alt="Cursive Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Get Started with Cursive</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Complete these steps to unlock the full platform
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[13px] font-medium text-primary">
              {completedCount} of {totalCount} completed
            </div>
            <div className="w-32 h-2 bg-muted rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-lg transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={dismiss}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-lg transition-colors"
            aria-label="Dismiss checklist"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Checklist Items */}
      {isExpanded && (
        <div className="px-6 py-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-4 p-4 rounded-lg transition-all border ${
                item.completed
                  ? 'bg-background/50 border-border'
                  : 'bg-background border-primary/20'
              }`}
            >
              <button
                onClick={() => toggleItemCompletion(item.id)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  item.completed
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground hover:border-primary'
                }`}
              >
                {item.completed && (
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-[14px] font-medium ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                >
                  {item.title}
                </h4>
                <p className="text-[13px] text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              <Link
                href={item.href}
                className="flex-shrink-0 h-8 px-3 text-[12px] font-medium border border-border bg-background text-foreground hover:bg-muted rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                {item.completed ? 'Revisit' : 'Start'}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {isExpanded && completedCount === totalCount && (
        <div className="px-6 py-4 bg-primary/10 border-t border-primary/20">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-foreground">All done!</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                You're all set. Start exploring the platform.
              </p>
            </div>
            <button
              onClick={dismiss}
              className="h-9 px-4 text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
