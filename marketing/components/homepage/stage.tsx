import type { ReactNode } from "react"

/**
 * The light Cursive-blue backdrop every homepage moment sits on: a pale blue wash with one soft brand-blue bloom.
 * One look for the hero and each product frame, so the page reads as one calm system.
 */
export function Stage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative isolate overflow-hidden rounded-[28px] border border-[#e3eeff] bg-[#f3f8ff] ${className}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 60% at 50% 0%, rgb(0 122 255 / 0.12), transparent 70%)," +
            "linear-gradient(180deg, #eef5ff 0%, #f8fbff 100%)",
        }}
      />
      {children}
    </div>
  )
}
