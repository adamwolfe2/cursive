import Link from "next/link"
import type { Metadata } from "next"
import { QuickLinks, StartLeadsLink, StatePage, secondaryAction } from "@/components/header/state-page"

export const metadata: Metadata = {
  title: "Page not found | Cursive",
  description: "That page does not exist or has moved.",
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <StatePage
      kicker="404"
      title="That page is not here"
      body="The link may be old or mistyped. Start from the beginning and your first 25 leads are about a minute away."
      actions={
        <>
          <StartLeadsLink placement="404" />
          <Link href="/" className={secondaryAction}>
            Back to home
          </Link>
        </>
      }
      footnote={
        <QuickLinks
          links={[
            { href: "/pricing", label: "Pricing" },
            { href: "/blog", label: "Blog" },
            { href: "/integrations", label: "Integrations" },
            { href: "/contact", label: "Contact" },
          ]}
        />
      }
    />
  )
}
