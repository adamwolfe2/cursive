"use client"

import { motion } from "framer-motion"

export function DashboardPreview() {
  const leads = [
    { name: "Sarah Chen", company: "Salesforce", title: "VP Sales", source: "Website", value: "$85K", status: "Hot" },
    { name: "Michael Rodriguez", company: "Datadog", title: "Director Marketing", source: "LinkedIn", value: "$120K", status: "Warm" },
    { name: "Jessica Park", company: "Cloudflare", title: "Head of Growth", source: "Webinar", value: "$65K", status: "Hot" },
    { name: "David Kim", company: "Monday.com", title: "VP Operations", source: "Direct Mail", value: "$95K", status: "Contacted" },
    { name: "Amanda Foster", company: "HubSpot", title: "Chief Revenue Officer", source: "Website", value: "$150K", status: "Hot" },
  ]

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 flex h-[400px] sm:h-[500px] lg:h-[600px]">
      {/* Sidebar */}
      <div className="hidden sm:flex w-36 lg:w-48 bg-gray-50 border-r border-gray-200 p-3 lg:p-4 flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 flex items-center justify-center">
            <img
              src="/cursive-logo.png"
              alt="Cursive"
              className="w-6 h-6"
              loading="lazy"
            />
          </div>
          <span className="font-semibold text-gray-900">Cursive</span>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { name: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", active: true },
            { name: "Queries", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
            { name: "My Leads", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
            { name: "CRM", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
            { name: "AI Studio", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
            { name: "People Search", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
          ].map((item, i) => (
            <button
              key={i}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                item.active
                  ? "bg-[#007AFF] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-600">Credits</div>
          <div className="text-sm font-semibold text-gray-900">8,420 / 10,000</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl text-gray-900 mb-1">Welcome back, Adam!</h1>
              <p className="text-gray-600">Admin Workspace</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right text-sm hidden sm:block">
                <div className="text-gray-600">hello@meetcursive.com</div>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#007AFF] rounded-full flex items-center justify-center text-white font-medium text-sm sm:text-base">
                A
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
            {[
              { label: "Total Leads", value: "2,847", change: "+12%", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
              { label: "Active Campaigns", value: "12", change: "+3", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
              { label: "Response Rate", value: "42%", change: "+8%", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
              { label: "Meetings Booked", value: "87", change: "+15", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-1 sm:mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">{stat.change}</span>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-light text-gray-900 mb-1">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Recent Leads Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm sm:text-lg font-medium text-gray-900">Recent Leads</h2>
              <button className="text-sm text-[#007AFF] hover:text-[#0066DD] font-medium">
                View all →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Company</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Source</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Value</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-xs text-gray-600 hidden sm:block">{lead.title}</div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {lead.company}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        {lead.value}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          lead.status === "Hot"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : lead.status === "Warm"
                            ? "bg-blue-50 text-blue-600 border border-blue-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
