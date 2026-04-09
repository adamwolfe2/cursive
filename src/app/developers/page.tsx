import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Cursive API — Developer Documentation',
  description: 'Integrate Cursive lead enrichment, email verification, and contact discovery into your tools via our REST API.',
}

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/ext/lookup',
    title: 'Person Lookup',
    description: 'Look up a person by name and company. Returns verified email, phone, job title, company data, and social profiles from our 280M+ identity graph.',
    cost: '1 credit',
    request: `{
  "first_name": "Jensen",
  "last_name": "Huang",
  "company": "NVIDIA",
  "domain": "nvidia.com"
}`,
    response: `{
  "data": {
    "first_name": "Jensen",
    "last_name": "Huang",
    "email": "jhuang@nvidia.com",
    "phone": "+1-408-555-0100",
    "company_name": "NVIDIA",
    "company_domain": "nvidia.com",
    "job_title": "CEO",
    "linkedin_url": "linkedin.com/in/jensenhuan",
    "company_industry": "Semiconductors",
    "company_size": "26000+",
    "source": "audiencelab"
  },
  "credits_used": 1
}`,
  },
  {
    method: 'POST',
    path: '/api/ext/company',
    title: 'Company Lookup',
    description: 'Look up a company by domain. Returns firmographic data including name, industry, employee count, and description.',
    cost: '1 credit',
    request: `{
  "domain": "nvidia.com"
}`,
    response: `{
  "data": {
    "domain": "nvidia.com",
    "name": "NVIDIA",
    "description": "NVIDIA is a computing company...",
    "industry": "Technology"
  },
  "credits_used": 1
}`,
  },
  {
    method: 'POST',
    path: '/api/ext/verify-email',
    title: 'Email Verification',
    description: 'Verify if an email address is valid, catch-all, or invalid. Checks format, MX records, disposable domains, role-based addresses, and runs MillionVerifier verification.',
    cost: '1 credit',
    request: `{
  "email": "john@example.com"
}`,
    response: `{
  "data": {
    "email": "john@example.com",
    "status": "valid",
    "confidence": 95,
    "checks": {
      "format": true,
      "disposable": false,
      "role_based": false
    }
  },
  "credits_used": 1
}`,
  },
  {
    method: 'POST',
    path: '/api/ext/save-lead',
    title: 'Save Lead',
    description: 'Save an enriched contact to your Cursive workspace. Automatically deduplicates by email.',
    cost: 'Free',
    request: `{
  "first_name": "Jensen",
  "last_name": "Huang",
  "email": "jhuang@nvidia.com",
  "company_name": "NVIDIA",
  "job_title": "CEO"
}`,
    response: `{
  "data": {
    "id": "uuid-of-created-lead",
    "duplicate": false
  },
  "message": "Lead saved to workspace"
}`,
  },
  {
    method: 'GET',
    path: '/api/ext/credits',
    title: 'Check Credits',
    description: 'Check your workspace credit balance and plan.',
    cost: 'Free',
    request: 'No request body needed',
    response: `{
  "data": {
    "remaining": 487,
    "plan": "free",
    "workspace_id": "your-workspace-uuid"
  }
}`,
  },
]

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${colors[method] || 'bg-gray-100 text-gray-700'}`}>
      {method}
    </span>
  )
}

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/cursive-logo.png" alt="Cursive" width={100} height={32} className="h-7 w-auto" />
            <span className="text-sm font-medium text-gray-400">/</span>
            <span className="text-sm font-semibold text-gray-900">API Docs</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/settings/api-keys" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Get API Key
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Cursive API</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Integrate real-time lead enrichment, email verification, and contact discovery into your tools. Powered by 280M+ identity profiles with 95%+ accuracy.
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-gray-900 rounded-xl p-6 mb-12">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Start</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">1. Get your API key from <Link href="/settings/api-keys" className="text-blue-400 hover:text-blue-300">Settings &gt; API Keys</Link></p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">2. Make your first request:</p>
              <pre className="text-sm text-green-400 overflow-x-auto">
{`curl -X POST https://leads.meetcursive.com/api/ext/lookup \\
  -H "x-cursive-api-key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"first_name": "Jensen", "last_name": "Huang", "company": "NVIDIA"}'`}
              </pre>
            </div>
          </div>
        </div>

        {/* Auth */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Authentication</h2>
          <p className="text-gray-600 mb-3">
            All API requests require an API key sent in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">x-cursive-api-key</code> header.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <pre className="text-sm text-gray-800 font-mono">
{`Headers:
  x-cursive-api-key: your_api_key_here
  Content-Type: application/json`}
            </pre>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            API keys are scoped to your workspace. Generate one at{' '}
            <Link href="/settings/api-keys" className="text-blue-600 hover:underline">Settings &gt; API Keys</Link>.
          </p>
        </div>

        {/* Rate Limits */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rate Limits</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">60</p>
              <p className="text-sm text-gray-500">requests per minute</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">1,000</p>
              <p className="text-sm text-gray-500">requests per day</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Rate limits are per API key. Contact us for higher limits.
          </p>
        </div>

        {/* Endpoints */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Endpoints</h2>
          <div className="space-y-8">
            {ENDPOINTS.map((endpoint) => (
              <div key={endpoint.path} className="border border-gray-200 rounded-xl overflow-hidden" id={endpoint.path.replace(/\//g, '-').slice(1)}>
                {/* Endpoint header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-1">
                    <MethodBadge method={endpoint.method} />
                    <code className="text-sm font-mono font-semibold text-gray-900">{endpoint.path}</code>
                    <span className="ml-auto text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                      {endpoint.cost}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mt-2">{endpoint.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{endpoint.description}</p>
                </div>

                {/* Request / Response */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                  <div className="p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Request</p>
                    <pre className="text-xs text-gray-800 font-mono bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre">
                      {endpoint.request}
                    </pre>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Response</p>
                    <pre className="text-xs text-gray-800 font-mono bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre">
                      {endpoint.response}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MCP Server */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">MCP Server (for AI agents)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Cursive ships a <strong>Model Context Protocol</strong> server that exposes the
            AudienceLab identity graph as tools any MCP-compatible AI agent can call — Claude
            Desktop, Claude Code, Cursor, Rox, and custom agents. The server speaks standard
            JSON-RPC 2.0 over HTTP POST.
          </p>

          <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-1">
                <MethodBadge method="POST" />
                <code className="text-sm font-mono font-semibold text-gray-900">/api/mcp</code>
                <span className="ml-auto text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                  scope: mcp:access
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mt-2">MCP JSON-RPC Endpoint</h3>
              <p className="text-sm text-gray-600 mt-1">
                Single endpoint serving all MCP methods: <code>initialize</code>,{' '}
                <code>tools/list</code>, <code>tools/call</code>, <code>ping</code>.
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Tools shipped
              </p>
              <ul className="text-sm text-gray-700 space-y-2 mb-4">
                <li>
                  <code className="font-mono text-xs bg-gray-50 px-1.5 py-0.5 rounded">enrich_person</code>
                  {' '}— Enrich a person by email, phone, or name → returns personal/business emails,
                  mobile phone, company, job title, seniority, demographics, and SHA-256 hashed
                  email identifiers.
                </li>
                <li>
                  <code className="font-mono text-xs bg-gray-50 px-1.5 py-0.5 rounded">lookup_company</code>
                  {' '}— Look up a company by name or domain → returns firmographics (industry,
                  SIC/NAICS, employee count, revenue, HQ, LinkedIn).
                </li>
              </ul>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Install in Claude Code
              </p>
              <pre className="text-xs text-gray-800 font-mono bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre mb-4">
{`claude mcp add cursive --transport http https://leads.meetcursive.com/api/mcp \\
  --header "Authorization: Bearer <YOUR_CURSIVE_API_KEY>"`}
              </pre>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Direct JSON-RPC call
              </p>
              <pre className="text-xs text-gray-800 font-mono bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre">
{`curl -X POST https://leads.meetcursive.com/api/mcp \\
  -H "Authorization: Bearer <YOUR_CURSIVE_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "enrich_person",
      "arguments": { "email": "jensen@nvidia.com" }
    }
  }'`}
              </pre>

              <p className="text-xs text-gray-500 mt-4">
                Rate limits: <strong>60 MCP calls per minute per workspace</strong> (outer) plus{' '}
                <strong>30 enrichment calls per minute per workspace</strong> (per-tool). Create
                an API key scoped <code>mcp:access</code> at{' '}
                <Link href="/settings/api-keys" className="text-blue-600 hover:underline">
                  Settings → API Keys
                </Link>.
              </p>
            </div>
          </div>
        </div>

        {/* Error Codes */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error Codes</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">Code</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-2 font-mono">200</td><td className="px-4 py-2 text-gray-600">Success</td></tr>
                <tr><td className="px-4 py-2 font-mono">400</td><td className="px-4 py-2 text-gray-600">Bad request — invalid input</td></tr>
                <tr><td className="px-4 py-2 font-mono">401</td><td className="px-4 py-2 text-gray-600">Unauthorized — invalid or missing API key</td></tr>
                <tr><td className="px-4 py-2 font-mono">402</td><td className="px-4 py-2 text-gray-600">Insufficient credits — purchase more at /marketplace</td></tr>
                <tr><td className="px-4 py-2 font-mono">403</td><td className="px-4 py-2 text-gray-600">Forbidden — API key missing required scope</td></tr>
                <tr><td className="px-4 py-2 font-mono">429</td><td className="px-4 py-2 text-gray-600">Rate limited — too many requests</td></tr>
                <tr><td className="px-4 py-2 font-mono">500</td><td className="px-4 py-2 text-gray-600">Server error — try again</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Questions? Contact <a href="mailto:support@meetcursive.com" className="text-blue-600 hover:underline">support@meetcursive.com</a>
          </p>
        </div>
      </main>
    </div>
  )
}
