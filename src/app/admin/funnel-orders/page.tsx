import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/admin'
import { listOrders } from '@/lib/funnel/order.service'
import { FunnelOrdersTable } from './FunnelOrdersTable'

export const dynamic = 'force-dynamic'

export default async function FunnelOrdersAdminPage() {
  // Auth via canonical requireAdmin (matches the middleware's role check):
  // accepts platform_admins.is_active=true OR users.role IN ('owner','admin').
  // On failure we redirect to /dashboard, NOT /login — otherwise a signed-in
  // non-admin user gets bounced from the page to /login, where they're
  // already authenticated so /login redirects back to this page, and so on
  // forever. /dashboard is always a safe terminal destination.
  try {
    await requireAdmin()
  } catch {
    redirect('/dashboard')
  }

  const orders = await listOrders({ limit: 200 })

  const pending = orders.filter((o) => o.status === 'awaiting_delivery')
  const recent = orders.filter((o) => o.status !== 'awaiting_delivery')

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Funnel Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          VSL funnel buyers — pixel installs are automated; audience deliveries
          are manual. Mark delivered to email the buyer their Google Sheet
          link.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Awaiting delivery ({pending.length})
        </h2>
        <FunnelOrdersTable orders={pending} kind="pending" />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          All orders ({recent.length})
        </h2>
        <FunnelOrdersTable orders={recent} kind="all" />
      </section>
    </div>
  )
}
