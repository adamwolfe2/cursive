export function DemoMarketplace() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">Lead Marketplace</h3>
        <p className="text-gray-600">AI-curated, pre-verified lead lists ready to purchase</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          { title: "SaaS Founders - Series A", leads: "500", price: "$250", verified: "99%", tag: "Popular" },
          { title: "VP Marketing - Tech", leads: "1,000", price: "$450", verified: "98%", tag: "New" },
        ].map((list, i) => (
          <div key={i} className="bg-gradient-to-br from-blue-50 to-transparent rounded-xl p-6 border border-blue-200 hover:shadow-lg hover:border-[#007AFF] transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="text-sm text-gray-900 font-medium">{list.title}</div>
              <span className="px-2 py-1 bg-[#007AFF] text-white text-xs rounded">
                {list.tag}
              </span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Total Leads</span>
                <span className="text-gray-900 font-medium">{list.leads}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Verified</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-green-700 font-medium">{list.verified}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-blue-100">
              <div className="text-xl text-[#007AFF] font-medium">{list.price}</div>
              <button className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm hover:bg-[#0066DD] transition-colors">
                Purchase
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-900 font-medium">What's Included</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Full name and title", "Verified email address", "Company details", "LinkedIn profile"].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-700 bg-white rounded px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
