export function DemoVisitorTracking() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">Visitor Tracking</h3>
        <p className="text-gray-600">Install pixel, identify visitors, capture leads in real-time</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-3xl text-[#007AFF] mb-1">127</div>
          <div className="text-sm text-gray-600">Visitors Identified Today</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-3xl text-[#007AFF] mb-1">8</div>
          <div className="text-sm text-gray-600">Live Visitors Now</div>
        </div>
      </div>

      {/* Live Visitors */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h4 className="text-gray-900">Live Visitors on Your Site</h4>
        </div>

        <div className="space-y-3">
          {[
            { name: "Sarah Johnson", email: "sarah.j@acmecorp.com", phone: "(555) 234-5678", location: "San Francisco, CA", page: "/pricing" },
            { name: "Mike Chen", email: "m.chen@techstart.io", phone: "(555) 789-0123", location: "New York, NY", page: "/features" },
            { name: "Emily Rodriguez", email: "emily@saasco.com", phone: "(555) 456-7890", location: "Austin, TX", page: "/demo" },
          ].map((visitor, i) => (
            <div key={i} className="bg-gradient-to-r from-blue-50 to-transparent rounded-lg p-3 border border-blue-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-gray-900 font-medium">{visitor.name}</div>
                  <div className="text-xs text-gray-600">{visitor.location}</div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Live
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-gray-600">{visitor.email}</div>
                <div className="text-gray-600">{visitor.phone}</div>
                <div className="text-[#007AFF]">Viewing: {visitor.page}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
