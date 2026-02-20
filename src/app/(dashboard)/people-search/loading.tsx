export default function PeopleSearchLoading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-zinc-200 rounded" />
        <div className="h-4 w-72 bg-zinc-100 rounded" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1 h-10 bg-zinc-100 rounded-lg" />
        <div className="h-10 w-24 bg-zinc-200 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 bg-white border border-zinc-200 rounded-lg flex items-center gap-4">
            <div className="h-10 w-10 bg-zinc-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-zinc-200 rounded" />
              <div className="h-3 w-56 bg-zinc-100 rounded" />
            </div>
            <div className="h-8 w-20 bg-zinc-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
