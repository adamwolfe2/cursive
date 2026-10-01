import type { ReactNode } from "react"

/**
 * The brand backdrop every homepage moment sits on: Cursive blue fading to deep navy, with two soft light blooms.
 * One look, used for the hero and each product frame, so the page reads as one system.
 */
export function Stage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative isolate overflow-hidden rounded-[28px] bg-[#0a3d9e] ${className}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 78% 18%, rgb(120 182 255 / 0.55), transparent 70%)," +
            "radial-gradient(55% 60% at 12% 92%, rgb(4 22 66 / 0.85), transparent 70%)," +
            "linear-gradient(160deg, #1f7bff 0%, #0b55d9 42%, #08307f 100%)",
        }}
      />
      {children}
    </div>
  )
}
