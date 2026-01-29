// Keyboard Shortcuts Help Dialog
// Shows available keyboard shortcuts for the CRM table

'use client'

import { useState } from 'react'
import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Shortcut {
  keys: string[]
  description: string
}

const SHORTCUTS: Record<string, Shortcut[]> = {
  'Table Navigation': [
    { keys: ['↑', '↓'], description: 'Navigate between rows' },
    { keys: ['←', '→'], description: 'Navigate between columns' },
    { keys: ['Space'], description: 'Select/deselect row' },
    { keys: ['Shift', 'Space'], description: 'Select range of rows' },
    { keys: ['Ctrl/⌘', 'A'], description: 'Select all rows' },
  ],
  'Inline Editing': [
    { keys: ['Enter'], description: 'Open inline editor' },
    { keys: ['Esc'], description: 'Cancel editing' },
    { keys: ['Tab'], description: 'Move to next field' },
    { keys: ['Shift', 'Tab'], description: 'Move to previous field' },
  ],
  'Actions': [
    { keys: ['Ctrl/⌘', 'F'], description: 'Focus search' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
  ],
}

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Keyboard shortcuts">
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and interact with the CRM more efficiently.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(SHORTCUTS).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-3">{category}</h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex gap-1 items-center">
                          <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
          Press <Badge variant="outline" className="font-mono mx-1">?</Badge> anywhere to toggle
          this help dialog.
        </div>
      </DialogContent>
    </Dialog>
  )
}
