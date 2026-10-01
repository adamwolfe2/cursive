import { devMock } from './_components/dev-mock'
import { StartFlow } from './_components/StartFlow'

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ mock?: string | string[]; site?: string | string[] }>
}) {
  const { mock, site } = await searchParams
  // `?site=acme.com` (links in the profile email) starts the scan straight away.
  const initialSite = typeof site === 'string' && site.trim() ? site.trim().slice(0, 253) : null
  return <StartFlow key={initialSite ?? ''} mock={devMock(mock)} initialSite={initialSite} />
}
