export default function NotificationsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-5 w-36 bg-zinc-200 rounded" />
        <div className="h-3 w-64 bg-zinc-100 rounded" />
      </div>

      {/* Notification preferences */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
            <div className="space-y-1">
              <div className="h-4 w-40 bg-zinc-200 rounded" />
              <div className="h-3 w-56 bg-zinc-100 rounded" />
            </div>
            <div className="h-6 w-11 bg-zinc-200 rounded-full" />
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <div className="h-10 w-28 bg-zinc-200 rounded-lg" />
      </div>
    </div>
  )
}
