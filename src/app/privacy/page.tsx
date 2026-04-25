export const metadata = {
  title: 'Privacy Policy — Cursive',
  description:
    'How Cursive collects, uses, retains, and discloses information — including data collected via the Cursive visitor identification pixel deployed through the Shopify and GoHighLevel marketplaces.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <p>
              This Privacy Policy describes how Cursive (&quot;we&quot;, &quot;us&quot;) collects, uses, and discloses information when you use the Cursive platform at <a className="text-blue-600 underline" href="https://leads.meetcursive.com">leads.meetcursive.com</a>, install the Cursive app from the GoHighLevel or Shopify marketplaces, or otherwise interact with our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
            <p className="mb-3"><strong>Account information you provide:</strong> name, email address, company name, billing information, and authentication credentials.</p>

            <p className="mb-3"><strong>Visitor identification data (collected via the Cursive pixel on your site or your customers&apos; sites):</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Anonymous visitor identifiers (browser cookie IDs, hashed identifiers)</li>
              <li>Page URLs visited and referrer URLs</li>
              <li>Event timestamps (page view, product view, cart, checkout events)</li>
              <li>IP-derived approximate location</li>
              <li>Resolved identity attributes when matched against the Cursive identity graph: name, email address, phone number, mailing address, demographics, employer, job title</li>
            </ul>

            <p className="mt-3"><strong>Shopify integration:</strong> when you install the Cursive Shopify app we receive shop information, customer email addresses (for matching to resolved visitors), and order events (used to suppress customers from acquisition retargeting).</p>

            <p className="mt-3"><strong>GoHighLevel integration:</strong> when an agency installs the Cursive app on a GHL location we receive location metadata, custom values, and contact data necessary to write back identified visitors as GHL contacts with intent tags.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. How We Use Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide the Service: identify website visitors, build audience segments, sync to your connected destinations</li>
              <li>To deliver leads to your dashboard and your connected CRMs (GoHighLevel, Klaviyo, Meta, etc.)</li>
              <li>To process payments and manage your subscription</li>
              <li>To send transactional emails (install confirmation, sync alerts, account notifications)</li>
              <li>To improve the Service via aggregate, de-identified analytics</li>
              <li>To comply with legal obligations and protect against fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. Identity Graph Sources</h2>
            <p>
              Cursive&apos;s identity resolution uses data sourced from publicly available business information, opted-in consumer panels, public records (NCOA), and licensed third-party identity graphs. Records undergo regular verification (305M+ records verified monthly) and de-listing requests are honored within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. Data Recipients (Third Parties)</h2>
            <p className="mb-3">We share information only with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Infrastructure providers</strong> we use to operate the Service (Supabase for database, Vercel for hosting, Inngest for background jobs, Stripe for payments)</li>
              <li><strong>Destinations you connect</strong> in the Cursive portal — Meta (Facebook Custom Audiences), Klaviyo (email lists), GoHighLevel (contacts), Google Sheets, and others you explicitly authorize. We send to these destinations only the fields you configure</li>
              <li><strong>Marketplace platforms</strong> (Shopify, GoHighLevel) for the limited data flows described in the integration documentation</li>
              <li><strong>Authorities</strong> when legally compelled (subpoena, court order, regulatory request)</li>
            </ul>
            <p className="mt-3">
              We do not sell personal information. We do not share visitor data across customer workspaces — every workspace&apos;s data is isolated.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. Visitor Privacy + Consent</h2>
            <p>
              The Cursive pixel installed via the Shopify Web Pixels API gates resolution calls behind the visitor&apos;s consent state. EU and CCPA-region visitors will see a consent prompt rendered by Shopify&apos;s native consent banner. Resolution calls fire only after consent is granted for analytics + marketing purposes.
            </p>
            <p className="mt-3">
              The Cursive pixel installed manually via GoHighLevel funnels relies on the merchant&apos;s consent management. Merchants are responsible for ensuring their consent capture is compliant with applicable law (GDPR, CCPA/CPRA).
            </p>
            <p className="mt-3">
              Conversion events (checkout completed, order paid) fire regardless of consent state, but are used solely for suppression (so customers stop seeing acquisition ads) — never for new identity resolution.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. Data Retention</h2>
            <p>
              We retain account data while your account is active. Visitor lead data is retained for the duration of your subscription plus 30 days after cancellation, after which it is permanently deleted.
            </p>
            <p className="mt-3">
              Upon receipt of a Shopify <code>customers/redact</code>, <code>shop/redact</code>, or <code>customers/data_request</code> webhook, we comply within 30 days. Upon any other deletion request received at <a className="text-blue-600 underline" href="mailto:hello@meetcursive.com">hello@meetcursive.com</a> we honor it within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Receive an export of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent at any time (where consent is the lawful basis)</li>
            </ul>
            <p className="mt-3">
              Exercise these rights by emailing <a className="text-blue-600 underline" href="mailto:hello@meetcursive.com">hello@meetcursive.com</a>. We respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">8. Data Security</h2>
            <p>
              We implement industry-standard security: TLS encryption in transit, encryption at rest, role-based access controls, audit logging, and regular security reviews. Access to production systems is restricted to a small set of authorized engineers and is logged.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">9. International Transfers</h2>
            <p>
              Cursive operates in the United States. By using the Service you acknowledge that your information may be transferred to and processed in the United States, where data protection laws may differ from your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">10. Cookies</h2>
            <p>
              The Cursive web app uses essential cookies for authentication and session management. The Cursive pixel uses a first-party cookie (<code>_cursive_cid</code>) on installed sites for visitor consistency across sessions. We do not use third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">11. Changes to This Policy</h2>
            <p>
              We will post material changes to this policy on this page and notify active customers via email. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">12. Contact</h2>
            <p>
              Cursive · <a className="text-blue-600 underline" href="mailto:hello@meetcursive.com">hello@meetcursive.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
