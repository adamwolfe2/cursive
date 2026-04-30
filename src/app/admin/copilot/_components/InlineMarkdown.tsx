'use client'

/**
 * Minimal inline markdown renderer. Handles:
 *   - **bold**
 *   - *italic*
 *   - `code`
 *   - line breaks
 *
 * Intentionally does NOT handle headings, lists, or links —
 * the system prompt steers the model toward clean prose.
 * Anything else renders as literal text.
 */

import { Fragment, memo } from 'react'

type Token =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }

const PATTERN = /(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)|(`([^`]+)`)/g

function tokenize(line: string): Token[] {
  const out: Token[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  PATTERN.lastIndex = 0
  while ((m = PATTERN.exec(line)) !== null) {
    if (m.index > lastIndex) {
      out.push({ type: 'text', value: line.slice(lastIndex, m.index) })
    }
    if (m[2] !== undefined) out.push({ type: 'bold', value: m[2] })
    else if (m[4] !== undefined) out.push({ type: 'italic', value: m[4] })
    else if (m[6] !== undefined) out.push({ type: 'code', value: m[6] })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < line.length) {
    out.push({ type: 'text', value: line.slice(lastIndex) })
  }
  return out
}

export const InlineMarkdown = memo(function InlineMarkdown({
  text,
}: {
  text: string
}) {
  // Strip accidental heading markers and separator lines that the model
  // sometimes emits — we want clean prose, not structured markdown.
  const cleaned = text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*-{3,}\s*$/gm, '')
    .replace(/^\s*={3,}\s*$/gm, '')

  const lines = cleaned.split('\n')

  return (
    <>
      {lines.map((line, i) => {
        const tokens = tokenize(line)
        return (
          <Fragment key={i}>
            {tokens.map((t, j) => {
              if (t.type === 'bold')
                return <strong key={j} className="font-semibold text-foreground">{t.value}</strong>
              if (t.type === 'italic')
                return <em key={j}>{t.value}</em>
              if (t.type === 'code')
                return (
                  <code
                    key={j}
                    className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground/80"
                  >
                    {t.value}
                  </code>
                )
              return <Fragment key={j}>{t.value}</Fragment>
            })}
            {i < lines.length - 1 && <br />}
          </Fragment>
        )
      })}
    </>
  )
})
