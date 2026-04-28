'use client'

import { useState, useMemo, type ReactNode } from 'react'
import { Shuffle, Eye, Code, List } from 'lucide-react'

interface SpintaxRendererProps {
  subjectLine: string
  body: string
  previewText?: string
}

type ViewMode = 'spintax' | 'preview' | 'variants'

const MERGE_TAG_PLACEHOLDERS: Record<string, string> = {
  '{{firstName}}': 'Sarah',
  '{{lastName}}': 'Chen',
  '{{companyName}}': 'AcmeTech',
  '{{title}}': 'VP Marketing',
  '{{email}}': 'sarah@acmetech.com',
  '{{phone}}': '(555) 123-4567',
  '{{city}}': 'Austin',
  '{{state}}': 'Texas',
  '{{industry}}': 'SaaS',
  '{{website}}': 'acmetech.com',
}

const SPINTAX_PATTERN = /\{([^{}]+)\}/g
const MERGE_TAG_PATTERN = /\{\{(\w+)\}\}/g
// Catches double-brace spintax like {{a|b|c}} that older copy may have. The
// generation pipeline now prevents this at write time (see sanitizeText in
// copy-generation.ts), but historical drafts in the DB may still contain it.
const DOUBLE_BRACE_SPINTAX_PATTERN = /\{\{([^{}]*\|[^{}]*)\}\}/g

function normalizeDoubleBraceSpintax(text: string): string {
  return text.replace(DOUBLE_BRACE_SPINTAX_PATTERN, '{$1}')
}

function resolveSpintax(text: string, seed: number): string {
  let blockIndex = 0
  const normalized = normalizeDoubleBraceSpintax(text)
  return normalized.replace(SPINTAX_PATTERN, (match, inner: string) => {
    if (inner.startsWith('{') || !inner.includes('|')) {
      return match
    }
    const options = inner.split('|')
    const picked = options[(seed + blockIndex) % options.length]
    blockIndex += 1
    return picked
  })
}

function expandAllSpintax(rawText: string): string[] {
  const text = normalizeDoubleBraceSpintax(rawText)
  const MAX_VARIANTS = 50
  const blocks: string[][] = []
  const segments: string[] = []
  let lastIndex = 0

  const regex = /\{([^{}]+)\}/g
  let execResult = regex.exec(text)

  while (execResult !== null) {
    const inner = execResult[1]
    if (!inner.includes('|')) {
      execResult = regex.exec(text)
      continue
    }

    segments.push(text.slice(lastIndex, execResult.index))
    blocks.push(inner.split('|'))
    lastIndex = execResult.index + execResult[0].length
    execResult = regex.exec(text)
  }

  segments.push(text.slice(lastIndex))

  if (blocks.length === 0) {
    return [text]
  }

  const totalCombinations = blocks.reduce((acc, b) => acc * b.length, 1)
  const limit = Math.min(totalCombinations, MAX_VARIANTS)

  const results: string[] = []

  for (let combo = 0; combo < limit; combo++) {
    let remaining = combo
    const picks: string[] = []

    for (let i = blocks.length - 1; i >= 0; i--) {
      const block = blocks[i]
      picks.unshift(block[remaining % block.length])
      remaining = Math.floor(remaining / block.length)
    }

    let result = ''
    for (let i = 0; i < segments.length; i++) {
      result += segments[i]
      if (i < picks.length) {
        result += picks[i]
      }
    }
    results.push(result)
  }

  return results
}

function highlightSpintax(rawText: string): ReactNode {
  const text = normalizeDoubleBraceSpintax(rawText)
  const parts: ReactNode[] = []
  let lastIndex = 0
  let key = 0

  const combined = /(\{\{(\w+)\}\}|\{([^{}]+)\})/g
  let match = combined.exec(text)

  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      parts.push(
        <span
          key={key}
          className="inline-flex items-center bg-green-100 text-green-700 rounded px-1 mx-0.5 text-sm font-medium"
        >
          {match[0]}
        </span>
      )
    } else if (match[3] && match[3].includes('|')) {
      const options = match[3].split('|')
      parts.push(
        <span
          key={key}
          className="inline-flex items-center bg-blue-100 text-blue-800 rounded px-1 mx-0.5 text-sm font-medium"
        >
          {options.join(' | ')}
        </span>
      )
    } else {
      parts.push(match[0])
    }

    key += 1
    lastIndex = match.index + match[0].length
    match = combined.exec(text)
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

function replaceMergeTags(text: string): string {
  return text.replace(MERGE_TAG_PATTERN, (fullMatch) => {
    return MERGE_TAG_PLACEHOLDERS[fullMatch] ?? fullMatch
  })
}

function countWords(text: string): number {
  const cleaned = text
    .replace(MERGE_TAG_PATTERN, '')
    .replace(SPINTAX_PATTERN, (_, inner: string) => {
      if (inner.includes('|')) {
        return inner.split('|')[0]
      }
      return inner
    })
    .trim()

  if (cleaned.length === 0) {
    return 0
  }

  return cleaned.split(/\s+/).filter(Boolean).length
}

const TAB_CONFIG: { mode: ViewMode; label: string; icon: typeof Code }[] = [
  { mode: 'spintax', label: 'Spintax View', icon: Code },
  { mode: 'preview', label: 'Preview', icon: Eye },
  { mode: 'variants', label: 'All Variants', icon: List },
]

export default function SpintaxRenderer({
  subjectLine,
  body,
  previewText,
}: SpintaxRendererProps) {
  const [mode, setMode] = useState<ViewMode>('spintax')
  const [seed, setSeed] = useState(0)

  const resolvedSubject = useMemo(
    () => replaceMergeTags(resolveSpintax(subjectLine, seed)),
    [subjectLine, seed]
  )

  const resolvedBody = useMemo(
    () => replaceMergeTags(resolveSpintax(body, seed)),
    [body, seed]
  )

  const subjectVariants = useMemo(
    () => expandAllSpintax(subjectLine),
    [subjectLine]
  )

  const spintaxWordCount = useMemo(() => countWords(body), [body])
  const previewWordCount = useMemo(
    () => resolvedBody.trim().split(/\s+/).filter(Boolean).length,
    [resolvedBody]
  )

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-border bg-muted/30">
        {TAB_CONFIG.map(({ mode: tabMode, label, icon: Icon }) => (
          <button
            key={tabMode}
            type="button"
            onClick={() => setMode(tabMode)}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors
              ${
                mode === tabMode
                  ? 'text-foreground border-b-2 border-primary bg-card'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {mode === 'spintax' && (
          <SpintaxView
            subjectLine={subjectLine}
            body={body}
            previewText={previewText}
            wordCount={spintaxWordCount}
          />
        )}

        {mode === 'preview' && (
          <PreviewView
            resolvedSubject={resolvedSubject}
            resolvedBody={resolvedBody}
            previewText={previewText ? replaceMergeTags(resolveSpintax(previewText, seed)) : undefined}
            wordCount={previewWordCount}
            onShuffle={() => setSeed((s) => s + 1)}
          />
        )}

        {mode === 'variants' && (
          <VariantsView
            subjectVariants={subjectVariants}
            subjectLine={subjectLine}
            body={body}
            previewText={previewText}
          />
        )}
      </div>
    </div>
  )
}

function SpintaxView({
  subjectLine,
  body,
  previewText,
  wordCount,
}: {
  subjectLine: string
  body: string
  previewText?: string
  wordCount: number
}) {
  return (
    <>
      {previewText && (
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
            Preview Text
          </p>
          <div className="text-sm leading-relaxed">
            {highlightSpintax(previewText)}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
          Subject Line
        </p>
        <div className="text-sm font-medium leading-relaxed">
          {highlightSpintax(subjectLine)}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
          Body
        </p>
        <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-3 leading-relaxed">
          {highlightSpintax(body)}
        </div>
      </div>

      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground">
          {wordCount} words
        </span>
      </div>
    </>
  )
}

function PreviewView({
  resolvedSubject,
  resolvedBody,
  previewText,
  wordCount,
  onShuffle,
}: {
  resolvedSubject: string
  resolvedBody: string
  previewText?: string
  wordCount: number
  onShuffle: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          Email Preview
        </p>
        <button
          type="button"
          onClick={onShuffle}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <Shuffle className="h-3 w-3" />
          Shuffle
        </button>
      </div>

      {previewText && (
        <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
            Preview Text
          </p>
          <p className="text-sm text-muted-foreground italic">{previewText}</p>
        </div>
      )}

      <div className="rounded-md border border-border bg-background shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs text-muted-foreground mb-0.5">Subject</p>
          <p className="text-sm font-semibold text-foreground">{resolvedSubject}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {resolvedBody}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground">
          {wordCount} words
        </span>
      </div>
    </>
  )
}

function VariantsView({
  subjectVariants,
  subjectLine,
  body,
  previewText,
}: {
  subjectVariants: string[]
  subjectLine: string
  body: string
  previewText?: string
}) {
  const totalPossible = useMemo(() => {
    let count = 1
    const regex = /\{([^{}]+)\}/g
    let match = regex.exec(subjectLine)
    while (match !== null) {
      const inner = match[1]
      if (inner.includes('|')) {
        count *= inner.split('|').length
      }
      match = regex.exec(subjectLine)
    }
    return count
  }, [subjectLine])

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Subject Line Variants
          </p>
          <span className="text-xs text-muted-foreground">
            {subjectVariants.length}
            {totalPossible > subjectVariants.length
              ? ` of ${totalPossible}`
              : ''}{' '}
            variant{totalPossible === 1 ? '' : 's'}
          </span>
        </div>

        <div className="rounded-md border border-border divide-y divide-border/50 max-h-64 overflow-y-auto">
          {subjectVariants.map((variant, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 px-3 py-2 text-sm"
            >
              <span className="text-xs text-muted-foreground font-mono shrink-0 pt-0.5 w-6 text-right">
                {idx + 1}.
              </span>
              <span className="text-foreground">{variant}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
          Body
        </p>
        <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-3 leading-relaxed">
          {highlightSpintax(body)}
        </div>
      </div>

      {previewText && (
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
            Preview Text
          </p>
          <div className="text-sm leading-relaxed">
            {highlightSpintax(previewText)}
          </div>
        </div>
      )}
    </>
  )
}
