"use client"

import { Check, FileSpreadsheet, Linkedin, Mail, ThumbsDown, ThumbsUp } from "lucide-react"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"

/*
 * One small live demo per rung: find (the learning loop), reach (an outreach thread), run (the dashboard).
 * Each steps through a fixed script while on screen, then holds the last frame and loops. Under reduced motion
 * they render finished. All data is illustrative and labeled as an example.
 */

const REDUCED = "(prefers-reduced-motion: reduce)"
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

/** Steps 0..last while visible, holds the last step for `hold` ms, then restarts. Reduced motion: always last. */
function useScript(last: number, every: number, hold = 3200) {
  const ref = useRef<HTMLDivElement>(null)
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false)
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (still || !visible) return
    const t = window.setTimeout(() => setStep((s) => (s >= last ? 0 : s + 1)), step >= last ? hold : every)
    return () => window.clearTimeout(t)
  }, [step, visible, still, last, every, hold])

  return { ref, step: still ? last : step }
}

const FRAME =
  "overflow-hidden rounded-[22px] border border-[#e3e9f2] bg-white shadow-[0_30px_70px_-34px_rgb(12_31_69/0.35),0_2px_6px_-2px_rgb(12_31_69/0.06)]"

function FrameHead({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex h-12 items-center justify-between gap-3 border-b border-[#eef1f5] px-5">
      <span className="truncate text-[13px] font-semibold text-[#111827]">{title}</span>
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.08em] text-[#9ca3af]">{note}</span>
    </div>
  )
}

/* ---------- 1. Find them: likes, skips and a customer list teach the next batch ---------- */

const BATCH: Array<[name: string, role: string, vote: "up" | "down"]> = [
  ["Rachel J.", "VP of Engineering, Ledgerline · 120 people", "up"],
  ["Sam T.", "Founder, Pixelcraft Agency · 8 people", "down"],
  ["Marcus O.", "CTO, Shipfast · Series A", "up"],
  ["Priya R.", "Head of Engineering, Northwind · 210 people", "up"],
]
const LEARNED = ["More Series A–C", "51–500 people", "Fewer agencies", "Like your 212 customers"]

export function DemoFind() {
  // 0: list in · 1-4: votes land · 5: CSV added · 6-9: learned chips · 10: next batch ready
  const { ref, step } = useScript(10, 650)
  return (
    <div ref={ref} className={FRAME} aria-hidden="true">
      <FrameHead title="Batch 2 of your leads" note="Example" />
      <ul className="divide-y divide-[#f1f4f8] px-5">
        {BATCH.map(([name, role, vote], i) => {
          const voted = step >= i + 1
          return (
            <li key={name} className="flex h-14 items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[12px] font-semibold text-[#0066DD]">
                {name[0]}
              </span>
              <span className={`min-w-0 flex-1 transition-opacity duration-500 ${voted && vote === "down" ? "opacity-40" : ""}`}>
                <span className="block truncate text-[13px] font-semibold text-[#111827]">{name}</span>
                <span className="block truncate text-[12px] text-[#6b7280]">{role}</span>
              </span>
              <span
                className={`grid h-8 w-8 place-items-center rounded-full transition-colors duration-300 ${
                  voted && vote === "up" ? "bg-[#007AFF] text-white" : "text-[#cbd5e1]"
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
              </span>
              <span
                className={`grid h-8 w-8 place-items-center rounded-full transition-colors duration-300 ${
                  voted && vote === "down" ? "bg-[#0f172a] text-white" : "text-[#cbd5e1]"
                }`}
              >
                <ThumbsDown className="h-4 w-4" />
              </span>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-[#eef1f5] bg-[#fbfcfe] px-5 py-4">
        <div className={`flex items-center gap-2 text-[12.5px] transition-opacity duration-500 ${step >= 5 ? "opacity-100" : "opacity-0"}`}>
          <FileSpreadsheet className="h-4 w-4 text-[#007AFF]" />
          <span className="font-medium text-[#111827]">customers.csv</span>
          <span className="text-[#6b7280]">212 past buyers added</span>
        </div>
        <p className="mt-3 text-[12px] font-medium text-[#4b5563]">What Cursive learned</p>
        <div className="mt-2 flex min-h-[3.75rem] flex-wrap content-start gap-1.5">
          {LEARNED.map((l, i) =>
            step >= 6 + i ? (
              <span key={l} className="fl-rise rounded-full border border-[#d6e6ff] bg-[#f3f8ff] px-2.5 py-0.5 text-[12px] font-medium text-[#0f172a]">
                {l}
              </span>
            ) : null,
          )}
        </div>
        <p className={`mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-[#0066DD] transition-opacity duration-500 ${step >= 10 ? "opacity-100" : "opacity-0"}`}>
          <Check className="h-4 w-4" /> Batch 3 is tuned to what you liked
        </p>
      </div>
    </div>
  )
}

/* ---------- 2. Reach them: we run LinkedIn and email to the same list ---------- */

const THREAD: Array<{ ch: "in" | "mail" | "reply"; when: string; text: string }> = [
  { ch: "in", when: "Mon", text: "Connection request sent to Rachel J." },
  { ch: "in", when: "Tue", text: "Rachel accepted. First message sent, written for her team’s growth." },
  { ch: "mail", when: "Thu", text: "Email follow-up with a two-line case for a call." },
  { ch: "reply", when: "Thu", text: "Thursday at 2 works. Send the invite." },
]

export function DemoReach() {
  const { ref, step } = useScript(THREAD.length, 1000)
  return (
    <div ref={ref} className={FRAME} aria-hidden="true">
      <FrameHead title="Outreach to Rachel J., Ledgerline" note="Example" />
      <ol className="relative px-5 py-5">
        <span className="absolute bottom-8 left-[2.15rem] top-8 w-px bg-[#e3e9f2]" />
        {THREAD.map((m, i) => {
          const shown = step >= i + 1
          const Icon = m.ch === "mail" ? Mail : m.ch === "in" ? Linkedin : Check
          return (
            <li key={i} className={`relative flex min-h-[4.5rem] gap-3 transition-opacity duration-500 ${shown ? "opacity-100" : "opacity-0"}`}>
              <span
                className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${
                  m.ch === "reply" ? "border-[#007AFF] bg-[#007AFF] text-white" : "border-[#e3e9f2] bg-white text-[#4b5563]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9ca3af]">
                  {m.ch === "reply" ? "Reply" : m.ch === "in" ? "LinkedIn" : "Email"} · {m.when}
                </p>
                {m.ch === "reply" ? (
                  <p className="mt-1.5 inline-block rounded-2xl rounded-tl-md bg-[#007AFF] px-3.5 py-2 text-[14px] font-medium text-white">
                    {m.text}
                  </p>
                ) : (
                  <p className="mt-1 text-[13px] text-[#374151]">{m.text}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ---------- 3. Run it: one dashboard for leads, replies, visitors, chat and CRM ---------- */

const TILES: Array<[label: string, value: number]> = [
  ["New leads this week", 125],
  ["Replies", 14],
  ["Site visitors named", 38],
  ["Calls booked", 5],
]
const SOURCES = ["Leads", "Outbound", "Visitor Pixel", "Site chat", "CRM", "Your API"]

export function DemoRun() {
  const { ref, step } = useScript(SOURCES.length + 1, 450, 4200)
  return (
    <div ref={ref} className={FRAME} aria-hidden="true">
      <FrameHead title="Your company dashboard" note="Example" />
      <div className="grid grid-cols-2 gap-px bg-[#eef1f5]">
        {TILES.map(([label, value], i) => (
          <div key={label} className="bg-white px-5 py-4">
            <p className="text-[12px] text-[#6b7280]">{label}</p>
            <p
              className={`mt-1 text-[28px] font-light tabular-nums leading-none tracking-[-0.02em] transition-colors duration-500 ${
                step >= 1 ? (i === 3 ? "text-[#007AFF]" : "text-[#0f172a]") : "text-[#e5e7eb]"
              }`}
            >
              {step >= 1 ? value : 0}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-[#eef1f5] bg-[#fbfcfe] px-5 py-4">
        <p className="text-[12px] font-medium text-[#4b5563]">Connected</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SOURCES.map((s, i) => {
            const on = step >= i + 2
            return (
              <span
                key={s}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors duration-300 ${
                  on ? "border-[#d6e6ff] bg-[#f3f8ff] text-[#0f172a]" : "border-[#eef1f5] text-[#cbd5e1]"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-[#007AFF]" : "bg-[#e5e7eb]"}`} />
                {s}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
