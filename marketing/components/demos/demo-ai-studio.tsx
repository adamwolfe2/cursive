export function DemoAIStudio() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">AI Studio</h3>
        <p className="text-gray-600">Train AI on your brand, generate personalized campaigns</p>
      </div>

      {/* URL Input */}
      <div className="bg-white rounded-lg p-4 border-2 border-[#007AFF] shadow-sm">
        <div className="text-xs text-gray-600 mb-2">Enter Your Website URL</div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            disabled
            value="https://acmecorp.com"
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900"
          />
          <button className="px-4 py-2 bg-[#007AFF] text-white rounded text-sm whitespace-nowrap">
            Analyze
          </button>
        </div>
      </div>

      {/* Processing Steps */}
      <div className="space-y-2">
        {[
          { label: "Crawled your site", status: "complete" },
          { label: "Collected brand assets", status: "complete" },
          { label: "Collected your logo", status: "complete" },
          { label: "Creating media assets", status: "active" },
        ].map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              step.status === "complete"
                ? "bg-green-50 border-green-200"
                : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
            }`}
          >
            {step.status === "complete" ? (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-5 h-5 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            <span className="text-sm text-gray-900">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Knowledge Base */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm text-gray-900 font-medium">Brand Knowledge Base Created</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white rounded p-2">
            <div className="text-gray-600">Voice & Tone</div>
            <div className="text-gray-900">Professional, data-driven</div>
          </div>
          <div className="bg-white rounded p-2">
            <div className="text-gray-600">Target Audience</div>
            <div className="text-gray-900">B2B SaaS founders</div>
          </div>
        </div>
      </div>

      {/* Generated Campaign */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-900 font-medium">Personalized Email Campaign Ready</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Ready</span>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-transparent rounded p-3 text-xs">
          <div className="text-gray-900 mb-1">Subject: Quick question about Acme's growth</div>
          <div className="text-gray-600">
            Hi [Name], noticed you're scaling Acme's sales team...
          </div>
        </div>
      </div>
    </div>
  )
}
