'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Zap, BarChart3, Webhook, FileDown, Globe } from 'lucide-react'

const STORAGE_KEY = 'cursive_whats_new_seen_v3'

const FEATURES = [
  {
    icon: BarChart3,
    color: 'text-blue-600 bg-blue-50',
    title: 'Campaign analytics & trends',
    desc: 'Open rate, click rate, and reply rate trends are now tracked per campaign step.',
  },
  {
    icon: Webhook,
    color: 'text-primary bg-primary/10',
    title: 'Webhook delivery logs',
    desc: 'See delivery history, response codes, and retry status for each webhook endpoint.',
  },
  {
    icon: FileDown,
    color: 'text-emerald-600 bg-emerald-50',
    title: 'CSV export with date filters',
    desc: 'Export any segment of your leads with custom date ranges and columns.',
  },
  {
    icon: Globe,
    color: 'text-primary bg-primary/10',
    title: 'Integration sync health',
    desc: 'HubSpot & Salesforce now show last sync time and error counts in real time.',
  },
  {
    icon: Zap,
    color: 'text-amber-600 bg-amber-50',
    title: 'Credit auto-recharge',
    desc: 'Set a low-balance threshold and your credits recharge automatically overnight.',
  },
  {
    icon: Sparkles,
    color: 'text-primary bg-primary/10',
    title: 'AI email sequence generator',
    desc: 'Generate a full 5-step email sequence from a single prompt in AI Studio.',
  },
]

export function WhatsNewModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) setOpen(true)
    } catch {
      // Ignore SSR / privacy mode errors
    }
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>What&apos;s new in Cursive</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what we&apos;ve shipped in the last few weeks.
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${f.color} shrink-0`}>
                <f.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleDismiss}>
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
