'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({ value, onChange, placeholder = 'Type and press Enter...', className }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
  }

  const removeTag = (index: number) => {
    const next = [...value]
    next.splice(index, 1)
    onChange(next)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (pasted.includes(',')) {
      e.preventDefault()
      const tags = pasted.split(',').map((t: string) => t.trim()).filter(Boolean)
      const unique = tags.filter((t: string) => !value.includes(t))
      onChange([...value, ...unique])
      setInputValue('')
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0',
        'min-h-[44px] sm:min-h-[40px] cursor-text w-full overflow-hidden',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeTag(index)
            }}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-200 hover:text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
            aria-label={`Remove ${tag}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          if (inputValue.trim()) {
            addTag(inputValue)
          }
        }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="min-w-0 w-[120px] max-w-full flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        aria-label={placeholder}
      />
    </div>
  )
}
