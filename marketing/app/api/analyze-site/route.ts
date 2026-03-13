import { NextRequest, NextResponse } from 'next/server'

// SSRF protection: allowlist of safe characters for domain names
// Rejects IPs, localhost, internal hostnames, and path traversal
function isSafeDomain(domain: string): boolean {
  // Must look like a valid public hostname: letters, digits, hyphens, dots only
  // No IP addresses, no localhost, must have a dot (TLD required)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-\.]{1,253}[a-zA-Z0-9]$/.test(domain)) return false
  if (domain === 'localhost') return false
  if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(domain)) return false
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(domain)) return false // raw IPv4
  if (!domain.includes('.')) return false // must have a TLD
  return true
}

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')
  if (!domain || typeof domain !== 'string') {
    return NextResponse.json({ error: 'Domain required' }, { status: 400 })
  }

  // Strip protocol and path, leaving only the hostname
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0].split('?')[0].toLowerCase()

  // SSRF protection: validate the domain is a safe public hostname
  if (!isSafeDomain(cleanDomain)) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
  }

  // Max domain length guard
  if (cleanDomain.length > 253) {
    return NextResponse.json({ error: 'Domain too long' }, { status: 400 })
  }

  try {
    // Only pass the sanitized domain to the third-party API — never the raw user input
    const url = `https://api.microlink.io?url=https://${encodeURIComponent(cleanDomain)}`

    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch site metadata' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({
      title: data.data?.title,
      description: data.data?.description,
      image: data.data?.image?.url,
      favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=128`,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to analyze site' }, { status: 502 })
  }
}
