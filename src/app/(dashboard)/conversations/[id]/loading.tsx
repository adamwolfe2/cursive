export default function ConversationDetailLoading() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-100 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-gray-200 rounded-lg" />
          <div className="h-8 w-20 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-hidden p-4 space-y-4">
        {/* Outbound message */}
        <div className="flex justify-end">
          <div className="max-w-[70%] space-y-1.5">
            <div className="h-24 w-80 bg-blue-50 rounded-xl border border-blue-100" />
            <div className="h-3 w-24 bg-gray-100 rounded ml-auto" />
          </div>
        </div>
        {/* Inbound reply */}
        <div className="flex justify-start">
          <div className="max-w-[70%] space-y-1.5">
            <div className="h-16 w-72 bg-gray-100 rounded-xl" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        </div>
        {/* Another outbound */}
        <div className="flex justify-end">
          <div className="max-w-[70%] space-y-1.5">
            <div className="h-12 w-64 bg-blue-50 rounded-xl border border-blue-100" />
            <div className="h-3 w-24 bg-gray-100 rounded ml-auto" />
          </div>
        </div>
      </div>

      {/* Reply composer */}
      <div className="border-t border-gray-200 p-4">
        <div className="h-24 w-full bg-gray-100 rounded-xl" />
        <div className="flex justify-end mt-3">
          <div className="h-9 w-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
