export default function ReferralsLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-7 w-40 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-12 w-full bg-gray-100 rounded-lg" />
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="h-4 w-36 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
