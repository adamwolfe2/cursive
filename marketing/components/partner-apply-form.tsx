"use client"

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { APPLY_API } from "@/lib/partner-program"

const AUDIENCE_SIZES = [
  { value: "under_500", label: "Under 500" },
  { value: "500_2k", label: "500 – 2,000" },
  { value: "2k_10k", label: "2,000 – 10,000" },
  { value: "10k_50k", label: "10,000 – 50,000" },
  { value: "50k_plus", label: "50,000+" },
] as const

const CHANNELS = [
  "Outbound email",
  "LinkedIn",
  "Newsletter",
  "Community / Slack",
  "Paid ads",
  "Network / referrals",
  "Content / SEO",
  "Other",
] as const

export function PartnerApplyForm() {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [channels, setChannels] = useState<string[]>([])

  const toggleChannel = (c: string) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)

    if (channels.length === 0) {
      setError("Pick at least one channel you'll use.")
      return
    }

    const payload = {
      firstName: String(form.get("firstName") || "").trim(),
      lastName: String(form.get("lastName") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim() || undefined,
      website: String(form.get("website") || "").trim() || undefined,
      audienceSize: String(form.get("audienceSize") || "under_500"),
      audienceTypes: channels,
      promotionPlan: String(form.get("promotionPlan") || "").trim(),
    }

    if (payload.promotionPlan.length < 10) {
      setError("Tell us a bit more about how you'll drive traffic (at least a sentence).")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(APPLY_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Something went wrong. Please try again.")
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
        <h3 className="text-lg font-medium text-gray-900">Application received</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
          Thanks — we review every application personally. If it&apos;s a fit, you&apos;ll get an email
          with your partner code and a link to your portal to sign the agreement and grab your links.
        </p>
      </div>
    )
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">First name</label>
          <input name="firstName" required maxLength={100} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Last name</label>
          <input name="lastName" required maxLength={100} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input name="email" type="email" required maxLength={255} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Phone (optional)</label>
          <input name="phone" maxLength={50} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Website / main channel (optional)
          </label>
          <input name="website" placeholder="https://" maxLength={500} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Your reach / audience size</label>
          <select name="audienceSize" defaultValue="2k_10k" className={inputCls}>
            {AUDIENCE_SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          How will you drive traffic? (pick all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => {
            const active = channels.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleChannel(c)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Tell us your plan to promote Cursive
        </label>
        <textarea
          name="promotionPlan"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          placeholder="e.g. I run a 12k-subscriber B2B newsletter and do outbound to agency owners…"
          className={inputCls}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Submitting…" : "Apply to become a partner"}
      </button>
      <p className="mt-3 text-center text-xs text-gray-400">
        By applying you agree to our partner terms. No cost to join.
      </p>
    </form>
  )
}
