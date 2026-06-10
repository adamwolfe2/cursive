/**
 * Generic instant-paint skeleton for route-level loading.tsx files. Renders a
 * neutral wireframe (header + stat row + list) immediately while the server
 * component streams in, so navigation feels instant instead of a blank flash.
 */
export function RouteSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 p-1">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-zinc-200" />
        <div className="h-4 w-72 rounded bg-zinc-100" />
      </div>

      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-zinc-100 bg-zinc-50"
          />
        ))}
      </div>

      {/* Content list */}
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-zinc-100" />
        ))}
      </div>
    </div>
  )
}
