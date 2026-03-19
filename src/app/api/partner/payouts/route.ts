import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { safeError } from "@/lib/utils/log-sanitizer"
import { getCurrentUser } from "@/lib/auth/helpers"
import { handleApiError } from "@/lib/utils/api-error-handler"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const apiKey = request.headers.get("X-API-Key")

    let partnerId: string | null = null

    // Try session-based auth first (for logged-in partners)
    const user = await getCurrentUser()

    if (user) {
      // User is logged in - get their linked partner
      if (user.linked_partner_id) {
        partnerId = user.linked_partner_id
      } else {
        return NextResponse.json(
          { error: "No partner account linked to your user" },
          { status: 403 }
        )
      }
    } else if (apiKey) {
      // Fallback to API key auth (for server-to-server integrations)
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
        { error: "Authentication required - please log in or provide API key" },
        { status: 401 }
      )
    }

    // Fetch partner data
    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("id, name, total_earnings, pending_balance, available_balance, payout_threshold, stripe_account_id, stripe_onboarding_complete")
      .eq("id", partnerId)
      .eq("is_active", true)
      .maybeSingle()

    if (partnerError || !partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    // Get payout history
    const { data: payoutHistory } = await supabase
      .from("payout_requests")
      .select("id, amount, status, requested_at, processed_at, notes")
      .eq("partner_id", partner.id)
      .order("requested_at", { ascending: false })
      .limit(50)

    // Calculate lifetime paid
    const { data: completedPayouts } = await supabase
      .from("payout_requests")
      .select("amount")
      .eq("partner_id", partner.id)
      .eq("status", "completed")

    const lifetimePaid = completedPayouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

    return NextResponse.json({
      success: true,
      partner_name: partner.name,
      stats: {
        total_earnings: Number(partner.total_earnings || 0),
        pending_balance: Number(partner.pending_balance || 0),
        available_balance: Number(partner.available_balance || 0),
        lifetime_paid: lifetimePaid,
        payout_threshold: Number(partner.payout_threshold || 50),
        stripe_connected: !!partner.stripe_account_id && partner.stripe_onboarding_complete,
      },
      payout_history: payoutHistory || [],
    })
  } catch (error: unknown) {
    safeError("Partner payouts error:", error)
    return handleApiError(error)
  }
}
