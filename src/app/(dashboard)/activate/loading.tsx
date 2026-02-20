export default function ActivateLoading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-zinc-200 rounded" />
        <div className="h-4 w-72 bg-zinc-100 rounded" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="p-6 bg-white border border-zinc-200 rounded-lg space-y-3">
            <div className="h-6 w-6 bg-zinc-200 rounded" />
            <div className="h-5 w-40 bg-zinc-200 rounded" />
            <div className="h-4 w-full bg-zinc-100 rounded" />
            <div className="h-4 w-3/4 bg-zinc-100 rounded" />
            <div className="h-9 w-32 bg-zinc-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
