export default function LeadIngestionLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-zinc-200 rounded" />
        <div className="h-4 w-72 bg-zinc-100 rounded" />
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
        <div className="h-4 w-32 bg-zinc-200 rounded" />
        <div className="h-10 w-full bg-zinc-100 rounded" />
        <div className="h-4 w-32 bg-zinc-200 rounded" />
        <div className="h-10 w-full bg-zinc-100 rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-zinc-100 rounded" />
          <div className="h-10 bg-zinc-100 rounded" />
        </div>
      </div>
    </div>
  )
}
