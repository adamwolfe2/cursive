// Inline Tags Editor
// Click to add/remove tags from leads

'use client'

import { useState, useRef } from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  FloatingPortal,
} from '@floating-ui/react'
import { X, Plus, Loader2, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useUpdateLead } from '@/lib/hooks/use-leads'
import { cn } from '@/lib/utils'

interface InlineTagsEditProps {
  leadId: string
  currentTags: string[]
  commonTags?: string[] // Suggested tags from workspace
}

export function InlineTagsEdit({
  leadId,
  currentTags,
  commonTags = [],
}: InlineTagsEditProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tags, setTags] = useState<string[]>(currentTags)
  const [inputValue, setInputValue] = useState('')
  const updateMutation = useUpdateLead()
  const inputRef = useRef<HTMLInputElement>(null)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  // Filter common tags to show only those not already added
  const suggestedTags = commonTags.filter((tag) => !tags.includes(tag))

  const handleAddTag = async (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (!trimmedTag || tags.includes(trimmedTag)) return

    const newTags = [...tags, trimmedTag]
    setTags(newTags)
    setInputValue('')

    await updateMutation.mutateAsync({
      id: leadId,
      updates: { tags: newTags },
    })

    // Focus input after adding
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove)
    setTags(newTags)

    await updateMutation.mutateAsync({
      id: leadId,
      updates: { tags: newTags },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      handleAddTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      e.preventDefault()
      handleRemoveTag(tags[tags.length - 1])
    }
  }

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className={cn(
          'inline-flex items-center gap-1 rounded-md transition-colors hover:bg-muted/50 px-2 py-1 -mx-2 -my-1 min-h-[28px] flex-wrap',
          updateMutation.isPending && 'opacity-50 cursor-wait'
        )}
        disabled={updateMutation.isPending}
        aria-label="Edit tags"
      >
        {tags.length > 0 ? (
          <>
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </>
        ) : (
          <span className="text-muted-foreground text-sm flex items-center gap-1">
            <Tag className="h-3 w-3" />
            Add tags
          </span>
        )}
        {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
      </button>

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} initialFocus={inputRef}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 w-[280px] rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
            >
              {/* Current tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs gap-1 pr-1 hover:bg-secondary/80"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full hover:bg-background/50 p-0.5"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Input for new tag */}
              <div className="flex items-center gap-2 mb-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type to add tag..."
                  className="h-8 text-sm"
                />
                {inputValue.trim() && (
                  <button
                    onClick={() => handleAddTag(inputValue)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8"
                    aria-label="Add tag"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Suggested tags */}
              {suggestedTags.length > 0 && (
                <>
                  <div className="text-xs text-muted-foreground mb-1.5">Suggested tags</div>
                  <div className="flex flex-wrap gap-1">
                    {suggestedTags.slice(0, 6).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleAddTag(tag)}
                        className="inline-flex items-center rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="text-xs text-muted-foreground mt-2">
                Press Enter to add • Backspace to remove
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}
