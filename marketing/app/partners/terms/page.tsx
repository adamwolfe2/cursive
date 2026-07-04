import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { AGREEMENT_SECTIONS, AGREEMENT_VERSION } from "@/lib/partner-program"

export const metadata: Metadata = {
  title: "Partner Agreement | Cursive",
  description:
    "The Cursive Outbound Distribution Partner Agreement — commission ramp, attribution, payouts, compliance, and terms.",
  alternates: { canonical: "https://www.meetcursive.com/partners/terms" },
  robots: { index: true, follow: true },
}

export default function PartnerTermsPage() {
  return (
    <main className="bg-white text-gray-900">
      <section className="border-b border-gray-100 py-16 sm:py-20">
        <Container className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Legal</p>
          <h1 className="mt-4 text-3xl font-light tracking-tight text-gray-900 sm:text-4xl">
            Outbound Distribution Partner Agreement
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Version {AGREEMENT_VERSION}. This is the public summary. Approved partners review and sign
            the full agreement inside their{" "}
            <Link href="https://leads.meetcursive.com/partners/portal" className="text-primary hover:underline">
              partner portal
            </Link>
            .
          </p>

          <div className="mt-10 space-y-8">
            {AGREEMENT_SECTIONS.map((s) => (
              <div key={s.heading}>
                <h2 className="text-lg font-medium text-gray-900">{s.heading}</h2>
                {s.body.map((p, i) => (
                  <p key={i} className="mt-2 text-[0.95rem] leading-relaxed text-gray-700">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
            <p>
              Questions about the program or these terms? Email{" "}
              <a href="mailto:partners@meetcursive.com" className="text-primary hover:underline">
                partners@meetcursive.com
              </a>
              .
            </p>
            <Link
              href="/partners#apply"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              Apply to become a partner →
            </Link>
          </div>
        </Container>
      </section>
    </main>
  )
}
