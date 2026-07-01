/**
 * Admin — Resellers list (platform-admin gated by the /admin layout).
 * Reads reseller tables via the service-role client (RLS deny-all otherwise).
 */

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ChevronRight, Users, Radio, Send } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { listResellersWithUsage, getResellerSummary } from '@/lib/reseller/admin.service'
import NewResellerButton from './_components/NewResellerButton'

function fmt(n: number | null): string {
  return n == null ? '∞' : n.toLocaleString()
}

export default async function AdminResellersPage() {
  const [resellers, summary] = await Promise.all([listResellersWithUsage(), getResellerSummary()])

  return (
    <div>
      <PageHeader
        title="Resellers"
        description="White-label partners, their pixels, usage, and delivery health."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Resellers' }]}
        actions={<NewResellerButton />}
      />

      <div className="px-6 py-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard icon={<Users className="h-4 w-4" />} label="Resellers" value={`${summary.activeResellers}/${summary.resellers}`} sub="active / total" />
          <SummaryCard icon={<Radio className="h-4 w-4" />} label="Pixels" value={`${summary.activePixels}/${summary.pixels}`} sub="active / total" />
          <SummaryCard icon={<Send className="h-4 w-4" />} label="Delivered today" value={summary.deliveredToday.toLocaleString()} sub="across all pixels" />
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-[11px] uppercase tracking-wider text-zinc-400">
                <th className="px-4 py-2.5 font-medium">Reseller</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Pixels</th>
                <th className="px-4 py-2.5 font-medium">Cap / period</th>
                <th className="px-4 py-2.5 font-medium">Delivered (period)</th>
                <th className="px-4 py-2.5 font-medium">Lifetime</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {resellers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                    No resellers yet.
                  </td>
                </tr>
              )}
              {resellers.map((r) => (
                <tr key={r.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/resellers/${r.id}`} className="font-medium text-zinc-900 hover:underline">
                      {r.name}
                    </Link>
                    <div className="text-[11px] text-zinc-400">{r.period_kind} period</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status === 'active' ? 'success' : 'destructive'} size="sm" dot>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {r.active_pixel_count}/{r.pixel_count}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{fmt(r.lead_cap_per_period)}</td>
                  <td className="px-4 py-3 text-zinc-700">{r.leads_delivered_period.toLocaleString()}</td>
                  <td className="px-4 py-3 text-zinc-700">{r.leads_delivered_lifetime.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/resellers/${r.id}`} className="inline-flex text-zinc-400 hover:text-zinc-900">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-zinc-900">{value}</div>
      <div className="text-[11px] text-zinc-400">{sub}</div>
    </div>
  )
}
