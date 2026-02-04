export function DemoPeopleSearch() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">People Search</h3>
        <p className="text-gray-600">Find and verify B2B contacts instantly</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by name, company, or title..."
            className="flex-1 px-4 py-2 rounded border border-gray-300 text-sm"
            disabled
          />
          <button className="px-4 py-2 bg-[#007AFF] text-white rounded text-sm whitespace-nowrap">
            Search
          </button>
        </div>
        <div className="text-xs text-gray-600">500M+ verified contacts</div>
      </div>

      <div className="space-y-3">
        {[
          { name: "Sarah Chen", title: "VP Marketing", company: "Acme Corp", badge: "Live", badgeColor: "bg-green-100 text-green-700" },
          { name: "Mike Rodriguez", title: "Head of Sales", company: "TechStart", badge: "Verified", badgeColor: "bg-blue-100 text-[#007AFF]" },
          { name: "Emily Johnson", title: "CEO", company: "GrowthCo", badge: "Enriched", badgeColor: "bg-purple-100 text-purple-700" },
        ].map((contact, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between hover:shadow-sm transition-shadow">
            <div>
              <div className="text-sm text-gray-900 font-medium mb-0.5">{contact.name}</div>
              <div className="text-xs text-gray-600">{contact.title} at {contact.company}</div>
            </div>
            <div className={`px-2 py-1 ${contact.badgeColor} text-xs rounded flex-shrink-0 ml-3`}>
              {contact.badge}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
