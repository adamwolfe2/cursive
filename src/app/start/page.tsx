import { devMock } from './_components/dev-mock'
import { StartFlow } from './_components/StartFlow'

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ mock?: string | string[] }>
}) {
  const { mock } = await searchParams
  return <StartFlow mock={devMock(mock)} />
}
