/**
 * Admin — Marketplace Install Demo
 *
 * Visual playground for the GHL/Shopify install flow. Lets an admin simulate
 * a marketplace OAuth callback with any site URL and watch the whole
 * provisionFromInstall() pipeline light up: workspace created, pixel
 * provisioned, magic-link issued.
 *
 * Use this before the real GHL/Shopify marketplace listings go live to
 * smoke-test the pipeline on a preview/production URL.
 */

'use client'

import { useState } from 'react'

type Result = {
  install: { id: string; isNew: boolean }
  workspace: { id: string; slug: string; name: string }
  pixel: { id: string; installUrl: string; snippet: string }
  apiKey: { id: string; plainKey: string } | null
  portalUrl: string
}

export default function InstallDemoPage() {
  const [source, setSource] = useState<'ghl' | 'shopify'>('shopify')
  const [externalId, setExternalId] = useState('demo-shop.myshopify.com')
  const [externalName, setExternalName] = useState('Demo Shop')
  const [installerEmail, setInstallerEmail] = useState('demo+install@meetcursive.com')
  const [siteUrl, setSiteUrl] = useState('https://demo-shop.com')

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/admin/install-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          externalId,
          externalName,
          installerEmail,
          siteUrl,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? `Request failed: ${res.status}`)
      }

      setResult(json.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function applyPreset(preset: 'ghl' | 'shopify') {
    if (preset === 'ghl') {
      setSource('ghl')
      setExternalId(`demo-location-${crypto.randomUUID().slice(0, 8)}`)
      setExternalName('Demo GHL Sub-Account')
      setSiteUrl('https://demo-agency-client.com')
    } else {
      setSource('shopify')
      setExternalId(`demo-shop-${crypto.randomUUID().slice(0, 8)}.myshopify.com`)
      setExternalName('Demo Shopify Store')
      setSiteUrl('https://demo-shop.com')
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Marketplace Install Demo</h1>
        <p className="mt-1 text-sm text-gray-600">
          Simulates the OAuth callback → provisioning pipeline that fires when a user
          installs Cursive from the GHL or Shopify marketplace. Creates a real workspace,
          provisions a real pixel, issues a real magic-link. Safe to run repeatedly —
          same external ID returns the same workspace (idempotent).
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="font-medium">How to read the result</div>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Workspace ID → new tenant created in Supabase</li>
          <li>Pixel ID + Install URL → real pixel provisioned, ready to paste into any site</li>
          <li>API Key (csk_...) → workspace-scoped key for extension/MCP use (shown once)</li>
          <li>Portal URL → click it, you land in the new workspace&apos;s dashboard signed in</li>
        </ol>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => applyPreset('shopify')}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Shopify preset
        </button>
        <button
          type="button"
          onClick={() => applyPreset('ghl')}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          GHL preset
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <Field label="Source">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as 'ghl' | 'shopify')}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="shopify">Shopify</option>
            <option value="ghl">GoHighLevel</option>
          </select>
        </Field>

        <Field label="External ID" hint="Shopify: shop_domain.myshopify.com · GHL: location_id">
          <input
            type="text"
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
          />
        </Field>

        <Field label="External Name" hint="Shown as the Cursive workspace name">
          <input
            type="text"
            value={externalName}
            onChange={(e) => setExternalName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </Field>

        <Field label="Installer Email" hint="Where the magic-link would be sent on a real install">
          <input
            type="email"
            value={installerEmail}
            onChange={(e) => setInstallerEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </Field>

        <Field label="Site URL" hint="The site the pixel will deploy to">
          <input
            type="url"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Provisioning…' : 'Run install'}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="font-medium">Install failed</div>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">{error}</pre>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="font-medium text-green-900">
              Install {result.install.isNew ? 'created' : 'reactivated'}
            </div>
            <div className="mt-1 text-sm text-green-800">
              {result.install.isNew
                ? 'New workspace, pixel, API key, and install row were provisioned.'
                : 'This external ID was already installed — returned existing workspace + pixel.'}
            </div>
          </div>

          <ResultCard label="Workspace">
            <Row k="ID" v={result.workspace.id} mono />
            <Row k="Name" v={result.workspace.name} />
            <Row k="Slug" v={result.workspace.slug} mono />
          </ResultCard>

          <ResultCard label="Pixel (provisioned in AudienceLab)">
            <Row k="Pixel ID" v={result.pixel.id} mono />
            <Row k="Install URL" v={result.pixel.installUrl} mono wrap />
            <div className="mt-2">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Embed snippet</div>
              <pre className="mt-1 overflow-x-auto rounded bg-gray-900 p-3 text-xs text-green-300">
                {result.pixel.snippet}
              </pre>
            </div>
          </ResultCard>

          {result.apiKey && (
            <ResultCard label="Workspace API key (shown once — save it now)">
              <Row k="Key ID" v={result.apiKey.id} mono />
              <Row k="Plain key" v={result.apiKey.plainKey} mono wrap />
            </ResultCard>
          )}

          <ResultCard label="Portal redirect (the user-facing result)">
            <p className="mb-3 text-sm text-gray-600">
              On a real install, this URL replaces the OAuth callback&apos;s response. The user
              is signed in and lands on /dashboard in the new workspace.
            </p>
            <a
              href={result.portalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Open portal as installer →
            </a>
            <div className="mt-3 break-all rounded bg-gray-100 p-2 font-mono text-xs text-gray-700">
              {result.portalUrl}
            </div>
          </ResultCard>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  )
}

function ResultCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      {children}
    </div>
  )
}

function Row({ k, v, mono, wrap }: { k: string; v: string; mono?: boolean; wrap?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 last:border-b-0">
      <span className="text-sm text-gray-600">{k}</span>
      <span
        className={`text-right text-sm text-gray-900 ${mono ? 'font-mono' : ''} ${wrap ? 'break-all' : ''}`}
      >
        {v}
      </span>
    </div>
  )
}
