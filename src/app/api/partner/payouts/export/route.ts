import { NextRequest, NextResponse } from "next/server"
import { sanitizeCsvValue } from "@/lib/utils/csv-sanitizer"
import { createClient } from "@/lib/supabase/server"
import { safeError } from "@/lib/utils/log-sanitizer"
import { getCurrentUser } from "@/lib/auth/helpers"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const apiKey = request.headers.get("X-API-Key")

    let partnerId: string | null = null

    // Try session-based auth first (for logged-in partners)
    const user = await getCurrentUser()

    if (user) {
      if (user.linked_partner_id) {
        partnerId = user.linked_partner_id
      } else {
        return NextResponse.json(
          { error: "No partner account linked to your user" },
          { status: 403 }
        )
      }
    } else if (apiKey) {
      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("api_key", apiKey)
        .eq("is_active", true)
        .maybeSingle()

      if (!partner) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
      }
      partnerId = partner.id
    } else {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("id, name")
      .eq("id", partnerId)
      .eq("is_active", true)
      .maybeSingle()

    if (partnerError || !partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    const currentYear = new Date().getFullYear()
    const yearStart = `${currentYear}-01-01T00:00:00.000Z`
    const yearEnd = `${currentYear}-12-31T23:59:59.999Z`

    const { data: payouts, error: payoutsError } = await supabase
      .from("payout_requests")
      .select("id, amount, status, requested_at, notes")
      .eq("partner_id", partner.id)
      .gte("requested_at", yearStart)
      .lte("requested_at", yearEnd)
      .order("requested_at", { ascending: false })

    if (payoutsError) {
      safeError("[Payout Export] Failed to fetch payout history:", payoutsError)
      return NextResponse.json(
        { error: "Failed to fetch payout history" },
        { status: 500 }
      )
    }

    const ytdEarnings = (payouts || [])
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const csvRows: string[] = ["Date,Amount,Status,Description,Reference"]

    for (const payout of payouts || []) {
      const date = new Date(payout.requested_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      const amount = Number(payout.amount).toFixed(2)
      const status =
        payout.status.charAt(0).toUpperCase() + payout.status.slice(1)
      const description = payout.notes
        ? `"${sanitizeCsvValue(String(payout.notes)).replace(/"/g, '""')}"`
        : "Partner payout"
      const reference = payout.id

      csvRows.push(`${date},${amount},${status},${description},${reference}`)
    }

    csvRows.push(``)
    csvRows.push(`YTD Total Earnings (Completed),${ytdEarnings.toFixed(2)},,,`)

    const csvContent = csvRows.join("\n")

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="earnings-${currentYear}.csv"`,
      },
    })
  } catch (error) {
    safeError("[Payout Export] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
