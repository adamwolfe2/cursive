// Settings page loading skeleton

export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-28 bg-zinc-200 rounded" />
        <div className="h-4 w-64 bg-zinc-100 rounded" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b border-zinc-200 pb-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-5 w-20 bg-zinc-100 rounded" />
        ))}
      </div>

      {/* Form skeleton */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-200 rounded" />
          <div className="h-10 w-full bg-zinc-100 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-zinc-200 rounded" />
          <div className="h-10 w-full bg-zinc-100 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-zinc-200 rounded" />
          <div className="h-24 w-full bg-zinc-100 rounded-lg" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-28 bg-zinc-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
