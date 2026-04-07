'use client'

const SENTIMENT_STYLES: Record<string, string> = {
  new: 'bg-gray-100 text-gray-600',
  positive: 'bg-green-100 text-green-700',
  interested: 'bg-green-100 text-green-700',
  neutral: 'bg-gray-100 text-gray-600',
  negative: 'bg-red-100 text-red-700',
  not_interested: 'bg-red-100 text-red-700',
  question: 'bg-yellow-100 text-yellow-700',
  out_of_office: 'bg-orange-100 text-orange-700',
  unsubscribe: 'bg-red-200 text-red-800',
}

interface SentimentBadgeProps {
  readonly sentiment: string
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const label = sentiment.replace(/_/g, ' ')
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SENTIMENT_STYLES[sentiment] || 'bg-gray-100 text-gray-600'}`}
    >
      {label}
    </span>
  )
}
