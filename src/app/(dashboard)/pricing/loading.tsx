export default function PricingLoading() {
  return (
    <div className="space-y-8 animate-pulse p-6">
      <div className="text-center space-y-2">
        <div className="h-8 w-48 bg-zinc-200 rounded mx-auto" />
        <div className="h-4 w-72 bg-zinc-100 rounded mx-auto" />
      </div>
      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`p-6 border rounded-xl space-y-4 ${i === 2 ? 'border-primary/30' : 'border-zinc-200'} bg-white`}>
            <div className="h-5 w-24 bg-zinc-200 rounded" />
            <div className="h-9 w-32 bg-zinc-200 rounded" />
            <div className="h-4 w-full bg-zinc-100 rounded" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-zinc-200 rounded-full flex-shrink-0" />
                  <div className="h-3 w-full bg-zinc-100 rounded" />
                </div>
              ))}
            </div>
            <div className="h-10 w-full bg-zinc-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
