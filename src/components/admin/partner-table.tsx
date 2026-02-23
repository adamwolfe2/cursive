'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { Check, X, ExternalLink, Loader2, Eye, Search } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

interface Partner {
  id: string
  company_name: string
  contact_email: string
  contact_name: string
  website: string | null
  status: string
  tier: string | null
  quality_score: number | null
  total_leads_uploaded: number | null
  total_leads_sold: number | null
  available_balance: number | null
  suspension_reason: string | null
  created_at: string
}

interface PartnerTableProps {
  partners: Partner[]
  showApprovalActions?: boolean
  showStats?: boolean
  showReason?: boolean
}

export function PartnerTable({
  partners,
  showApprovalActions,
  showStats,
  showReason,
}: PartnerTableProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? partners.filter((p) => {
        const q = search.toLowerCase()
        return (
          p.company_name.toLowerCase().includes(q) ||
          p.contact_name.toLowerCase().includes(q) ||
          p.contact_email.toLowerCase().includes(q)
        )
      })
    : partners

  const handleApprove = async (partnerId: string) => {
    setLoading(partnerId)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/approve`, {
        method: 'POST',
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (partnerId: string) => {
    if (!rejectReason.trim()) return

    setLoading(partnerId)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (res.ok) {
        setRejectReason('')
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  const colCount = 3 + (showStats ? 2 : 0) + (showReason ? 1 : 0)

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by company, name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {search && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {partners.length} partners
        </p>
      )}
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Contact</TableHead>
          {showStats && <TableHead>Tier/Score</TableHead>}
          {showStats && <TableHead>Stats</TableHead>}
          {showReason && <TableHead>Reason</TableHead>}
          <TableHead>Applied</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((partner) => (
          <TableRow key={partner.id}>
            <TableCell>
              <div>
                <p className="font-medium">{partner.company_name}</p>
                {partner.website && (
                  <a
                    href={partner.website}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    {partner.website} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </TableCell>
            <TableCell>
              <p>{partner.contact_name}</p>
              <p className="text-xs text-muted-foreground">{partner.contact_email}</p>
            </TableCell>
            {showStats && (
              <>
                <TableCell>
                  <Badge variant="outline">{partner.tier || 'Bronze'}</Badge>
                  <span className="ml-2 text-sm">{partner.quality_score || 0}/100</span>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{partner.total_leads_uploaded || 0} uploaded</p>
                  <p className="text-xs text-muted-foreground">
                    {partner.total_leads_sold || 0} sold
                  </p>
                </TableCell>
              </>
            )}
            {showReason && (
              <TableCell>
                <p className="max-w-xs truncate text-sm text-muted-foreground">
                  {partner.suspension_reason || '-'}
                </p>
              </TableCell>
            )}
            <TableCell>{format(new Date(partner.created_at), 'MMM d, yyyy')}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/partners/${partner.id}`}>
                    <Eye className="mr-1 h-4 w-4" /> View
                  </Link>
                </Button>
                {showApprovalActions && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(partner.id)}
                      disabled={loading === partner.id}
                    >
                      {loading === partner.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="mr-1 h-4 w-4" /> Approve
                        </>
                      )}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject {partner.company_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <Button
                            variant="destructive"
                            onClick={() => handleReject(partner.id)}
                            disabled={!rejectReason.trim() || loading === partner.id}
                          >
                            {loading === partner.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Confirm Rejection
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
        {filtered.length === 0 && (
          <TableRow>
            <TableCell colSpan={colCount} className="py-8 text-center text-muted-foreground">
              {search ? `No partners matching "${search}"` : 'No partners found'}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
    </div>
  )
}
