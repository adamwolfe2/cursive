/**
 * Reseller API Docs — auto-generated from src/lib/reseller/docs.ts
 * Public, static, zero-hand-holding partner onboarding reference.
 */

import type { Metadata } from 'next'
import {
  RESELLER_API_BASE,
  RESELLER_API_ABSOLUTE_BASE,
  RESELLER_ENDPOINTS,
  OUTBOUND_WEBHOOK_SCHEMA,
  RESELLER_QUICKSTART,
  RESELLER_RATE_LIMITS,
  SIGNATURE_VERIFICATION_SAMPLES,
} from '@/lib/reseller/docs'

export const metadata: Metadata = {
  title: 'Cursive Reseller API',
  description: 'Programmatically create pixels and route identified leads into your own product.',
  // Pre-GA: reachable by direct URL for partners, but not indexed by search engines.
  robots: { index: false, follow: false },
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-gray-50 p-4 text-sm text-gray-800 ring-1 ring-gray-200">
      <code>{children}</code>
    </pre>
  )
}

export default function ResellerDocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-gray-900">
      <h1 className="text-3xl font-semibold tracking-tight">Cursive Reseller API</h1>
      <p className="mt-3 text-gray-600">
        Create pixels for your customers and route each identified lead into your own product.
        Base URL <code className="rounded bg-gray-100 px-1.5 py-0.5">{RESELLER_API_ABSOLUTE_BASE}</code>.
        Authenticate with <code className="rounded bg-gray-100 px-1.5 py-0.5">Authorization: Bearer &lt;api_key&gt;</code>.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Quickstart</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-gray-700">
          {RESELLER_QUICKSTART.map((s) => (
            <li key={s}>{s.replace(/^\d+\.\s*/, '')}</li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Endpoints</h2>
        <div className="mt-4 space-y-6">
          {RESELLER_ENDPOINTS.map((e) => (
            <div key={`${e.method} ${e.path}`} className="rounded-lg ring-1 ring-gray-200 p-5">
              <div className="flex items-center gap-3">
                <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">{e.method}</span>
                <code className="text-sm">{e.path}</code>
              </div>
              <p className="mt-2 text-sm text-gray-600">{e.summary}</p>
              <p className="mt-2 text-xs text-gray-500">Auth: {e.auth}</p>
              {e.request && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500">Request</p>
                  <Code>{JSON.stringify(e.request, null, 2)}</Code>
                </div>
              )}
              {e.response && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500">Response</p>
                  <Code>{JSON.stringify(e.response, null, 2)}</Code>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Lead webhook payload</h2>
        <p className="mt-2 text-sm text-gray-600">
          For each identified lead we POST this to your <code>destination_url</code>.
        </p>
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500">Headers</p>
          <Code>{JSON.stringify(OUTBOUND_WEBHOOK_SCHEMA.headers, null, 2)}</Code>
          <p className="mt-2 text-xs text-gray-500">{OUTBOUND_WEBHOOK_SCHEMA.signature_note}</p>
        </div>
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500">Body</p>
          <Code>{JSON.stringify(OUTBOUND_WEBHOOK_SCHEMA.body, null, 2)}</Code>
        </div>
        <p className="mt-3 text-sm text-gray-600">{OUTBOUND_WEBHOOK_SCHEMA.throttled_note}</p>
        <p className="mt-1 text-sm text-gray-600">{OUTBOUND_WEBHOOK_SCHEMA.delivery_note}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Verify the signature</h2>
        <p className="mt-2 text-sm text-gray-600">
          Recompute <code className="rounded bg-gray-100 px-1.5 py-0.5">{'HMAC-SHA256(signing_secret, `${t}.${raw_body}`)'}</code>{' '}
          and compare, in constant time, to the <code>v1=</code> value in{' '}
          <code>X-Cursive-Signature</code>. Use the <strong>raw</strong> request body bytes — do not
          re-serialize the JSON first.
        </p>
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500">Node.js (Express)</p>
          <Code>{SIGNATURE_VERIFICATION_SAMPLES.node}</Code>
        </div>
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500">Python (Flask)</p>
          <Code>{SIGNATURE_VERIFICATION_SAMPLES.python}</Code>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Rate limits</h2>
        <div className="mt-4 space-y-3">
          {RESELLER_RATE_LIMITS.map((r) => (
            <div key={r.scope} className="rounded-lg ring-1 ring-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-800">{r.scope}</p>
              <p className="mt-1 text-sm text-gray-700">{r.limit}</p>
              <p className="mt-1 text-xs text-gray-500">On exceed: {r.on_exceed}</p>
              <p className="mt-1 text-xs text-gray-500">{r.why}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-12 text-xs text-gray-400">
        Machine-readable version: <code>{RESELLER_API_BASE}/openapi</code>
      </p>
    </main>
  )
}
