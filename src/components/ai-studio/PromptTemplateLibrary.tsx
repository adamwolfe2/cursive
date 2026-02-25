'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, Mail, Users, TrendingUp, Target, MessageSquare, Zap } from 'lucide-react'

interface PromptTemplate {
  id: string
  title: string
  description: string
  category: string
  icon: typeof Sparkles
  iconColor: string
  prompt: string
  tags: string[]
}

const TEMPLATES: PromptTemplate[] = [
  {
    id: 'cold-email-sequence',
    title: '5-Step Cold Email Sequence',
    description: 'Generate a complete 5-email cold outreach sequence for a B2B prospect',
    category: 'Email',
    icon: Mail,
    iconColor: 'text-blue-600 bg-blue-50',
    tags: ['cold email', 'B2B', 'sequence'],
    prompt: 'Write a 5-email cold outreach sequence for a B2B SaaS prospect. The prospect is a [JOB_TITLE] at a [COMPANY_SIZE] company in the [INDUSTRY] industry. Our product helps with [VALUE_PROP]. Each email should be short (under 100 words), personalized, and have a clear CTA. Space them 2-3 days apart. Include: email subject, body, and suggested send day.',
  },
  {
    id: 'linkedin-connect',
    title: 'LinkedIn Connection Message',
    description: 'Personalized LinkedIn connection request based on prospect profile',
    category: 'LinkedIn',
    icon: Users,
    iconColor: 'text-indigo-600 bg-indigo-50',
    tags: ['linkedin', 'connection', 'personalized'],
    prompt: 'Write a personalized LinkedIn connection request message for [PROSPECT_NAME] who is a [JOB_TITLE] at [COMPANY_NAME]. They recently [TRIGGER_EVENT]. Keep it under 300 characters. Make it feel genuine, not salesy. Reference something specific about their work or company.',
  },
  {
    id: 'follow-up-email',
    title: 'Post-Demo Follow-Up',
    description: 'Professional follow-up email after a product demo call',
    category: 'Email',
    icon: Mail,
    iconColor: 'text-emerald-600 bg-emerald-50',
    tags: ['follow-up', 'demo', 'closing'],
    prompt: 'Write a professional follow-up email after a product demo call with [PROSPECT_NAME] from [COMPANY]. Key points discussed: [PAIN_POINTS]. Next steps agreed: [NEXT_STEPS]. Include: recap of value props relevant to their pain points, answers to any objections raised, a soft close asking for the next meeting.',
  },
  {
    id: 'breakup-email',
    title: 'Breakup / "Last Chance" Email',
    description: 'Final email to re-engage a cold prospect before removing them',
    category: 'Email',
    icon: MessageSquare,
    iconColor: 'text-orange-600 bg-orange-50',
    tags: ['re-engagement', 'breakup', 'final'],
    prompt: 'Write a "breakup email" — the final email in a cold outreach sequence to [PROSPECT_NAME] at [COMPANY]. They have not responded to previous emails. The email should: be brief (2-3 sentences), acknowledge they may not be interested, close the loop with a simple question, make it easy to respond with a yes or no.',
  },
  {
    id: 'pain-point-email',
    title: 'Pain Point Discovery Email',
    description: 'Open a conversation by addressing a specific industry pain point',
    category: 'Email',
    icon: Target,
    iconColor: 'text-red-600 bg-red-50',
    tags: ['pain point', 'discovery', 'opener'],
    prompt: 'Write a cold email opener that focuses on a specific pain point for [JOB_TITLE] in the [INDUSTRY] industry. The pain point is: [PAIN_POINT]. Our solution addresses this by [HOW_WE_SOLVE_IT]. The email should lead with the pain, not our product. End with an open-ended question to start a conversation. Max 80 words.',
  },
  {
    id: 'referral-ask',
    title: 'Customer Referral Request',
    description: 'Ask a happy customer to introduce you to a prospect',
    category: 'Outreach',
    icon: TrendingUp,
    iconColor: 'text-violet-600 bg-violet-50',
    tags: ['referral', 'warm intro', 'network'],
    prompt: 'Write an email to [CUSTOMER_NAME] who is a happy customer of ours, asking them to introduce us to [PROSPECT_NAME] at [PROSPECT_COMPANY]. Keep it short and easy for them to forward. Make the ask specific but not presumptuous. Include a suggested intro they could use.',
  },
  {
    id: 'personalized-opener',
    title: 'Hyper-Personalized Opener',
    description: 'Generate a highly personalized first line based on prospect research',
    category: 'Email',
    icon: Zap,
    iconColor: 'text-amber-600 bg-amber-50',
    tags: ['personalization', 'opener', 'research'],
    prompt: 'Generate 5 different hyper-personalized opening lines for a cold email to [PROSPECT_NAME], [JOB_TITLE] at [COMPANY]. They recently: [RECENT_ACTIVITY] (e.g., posted on LinkedIn, got funding, launched a product, hired for a role). Each opener should reference this activity naturally and transition into asking about [PAIN_POINT]. Max 2 sentences each.',
  },
  {
    id: 'subject-lines',
    title: 'Subject Line Generator',
    description: 'Generate 10 high-open-rate subject lines for any cold email',
    category: 'Email',
    icon: Sparkles,
    iconColor: 'text-pink-600 bg-pink-50',
    tags: ['subject lines', 'open rate', 'copywriting'],
    prompt: 'Generate 10 high-open-rate email subject lines for a cold email to [JOB_TITLE] in [INDUSTRY]. The email is about [VALUE_PROP]. Include a mix of: curiosity-based, benefit-focused, question format, personalized with their name, and urgency-based. Keep each under 50 characters. Do not use clickbait or ALL CAPS.',
  },
]

const CATEGORIES = ['All', 'Email', 'LinkedIn', 'Outreach']

interface PromptTemplateLibraryProps {
  onSelectPrompt: (prompt: string) => void
}

export function PromptTemplateLibrary({ onSelectPrompt }: PromptTemplateLibraryProps) {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered =
    activeCategory === 'All'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory)

  return (
    <div>
      {/* Category filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
            onClick={() => onSelectPrompt(template.prompt)}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${template.iconColor} shrink-0`}>
                <template.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {template.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {template.description}
                </p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="muted" className="text-xs py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectPrompt(template.prompt)
                }}
              >
                <Sparkles className="h-3 w-3" />
                Use template
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
