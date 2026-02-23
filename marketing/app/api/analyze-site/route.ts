import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')
  if (!domain) {
    return NextResponse.json({ error: 'Domain required' }, { status: 400 })
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0]
    const url = `https://api.microlink.io?url=https://${cleanDomain}`

    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) {
      return NextResponse.json({ error: true }, { status: 200 })
    }

    const data = await res.json()
    return NextResponse.json({
      title: data.data?.title,
      description: data.data?.description,
      image: data.data?.image?.url,
      favicon: `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`,
    })
  } catch {
    return NextResponse.json({ error: true }, { status: 200 })
  }
}
