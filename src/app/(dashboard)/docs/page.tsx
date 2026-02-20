import { redirect } from 'next/navigation'

/**
 * /docs root — redirect to /docs/api (the only docs section currently available)
 */
export default function DocsPage() {
  redirect('/docs/api')
}
