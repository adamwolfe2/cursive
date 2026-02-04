export function DemoPipelineDashboard() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">Pipeline Dashboard</h3>
        <p className="text-gray-600">Live email metrics and outbound performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Emails Sent</div>
          <div className="text-2xl text-[#007AFF]">2,847</div>
          <div className="text-xs text-gray-600 mt-1">Last 30 days</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Pipeline Value</div>
          <div className="text-2xl text-[#007AFF]">$2.4M</div>
          <div className="text-xs text-green-600 mt-1">↑ 18%</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Open Rate</div>
          <div className="text-2xl text-[#007AFF]">67%</div>
          <div className="text-xs text-green-600 mt-1">↑ +4.1%</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Active Responses</div>
          <div className="text-2xl text-[#007AFF]">341</div>
          <div className="text-xs text-gray-600 mt-1">12% reply rate</div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-900 mb-4">Top Lead Sources</div>
        <div className="space-y-3">
          {[
            { source: "Website", percent: 35, color: "#007AFF" },
            { source: "Pixel Tracking", percent: 28, color: "#0066DD" },
            { source: "Organic Search", percent: 18, color: "#66B3FF" },
            { source: "Email Campaigns", percent: 12, color: "#99CCFF" },
            { source: "Paid Ads", percent: 7, color: "#CCE5FF" },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-700">{item.source}</span>
                <span className="text-gray-900 font-medium">{item.percent}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
