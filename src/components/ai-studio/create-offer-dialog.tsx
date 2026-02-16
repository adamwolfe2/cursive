/**
 * Create Offer Dialog Component
 * Modal for manually creating new offers/products/services
 */

'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface CreateOfferDialogProps {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateOfferDialog({
  workspaceId,
  open,
  onOpenChange,
  onSuccess,
}: CreateOfferDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pricing, setPricing] = useState('')

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; pricing?: string }) => {
      const res = await fetch('/api/ai-studio/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace: workspaceId,
          ...data,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create offer')
      }

      return res.json()
    },
    onSuccess: () => {
      toast.success('Offer created successfully!')
      queryClient.invalidateQueries({ queryKey: ['offers', workspaceId] })
      if (onSuccess) onSuccess()
      handleClose()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      name,
      description,
      pricing: pricing || undefined,
    })
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setPricing('')
    onOpenChange(false)
  }

  const isValid = name.trim().length > 0 && description.trim().length >= 10

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Offer</DialogTitle>
            <DialogDescription>
              Add a new product or service to your brand workspace. This will be available
              for targeting in your campaigns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Offer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Premium Consulting Package"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what this offer includes, key benefits, and who it's for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/1000 characters (minimum 10)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricing">Pricing (Optional)</Label>
              <Input
                id="pricing"
                placeholder="e.g., $99/month or Starting at $1,499"
                value={pricing}
                onChange={(e) => setPricing(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Add pricing information to display alongside the offer
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Offer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
