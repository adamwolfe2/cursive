import { Metadata } from "next"
import { Container } from "@/components/ui/container"

export const metadata: Metadata = {
  title: "Privacy Policy | Cursive",
  description: "How Cursive collects, uses, retains, and discloses information — including identity-graph provenance, GPC handling, opt-out propagation, DPA availability, CCPA sharing posture, Quebec Law 25 posture, and Camplisson/CIPA mitigations.",
  keywords: "privacy policy, data protection, GDPR, CCPA, CPRA, Quebec Law 25, GPC, Global Privacy Control, DPA, CIPA, Camplisson, sub-processors, identity resolution, B2B lead generation",
  openGraph: {
    title: "Privacy Policy | Cursive",
    description: "How Cursive collects, uses, retains, and discloses information — including identity-graph provenance, GPC handling, opt-out propagation, DPA availability, CCPA sharing posture, Quebec Law 25 posture, and Camplisson/CIPA mitigations.",
    url: "https://www.meetcursive.com/privacy",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/cursive-social-preview.png",
      width: 1200,
      height: 630,
    }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Cursive",
    description: "How Cursive collects, uses, retains, and discloses information — including identity-graph provenance, GPC handling, opt-out propagation, DPA availability, CCPA sharing posture, Quebec Law 25 posture, and Camplisson/CIPA mitigations.",
    images: ["https://www.meetcursive.com/cursive-social-preview.png"],
    creator: "@meetcursive",
  },
  alternates: {
    canonical: "https://www.meetcursive.com/privacy",
  },
}

export default function PrivacyPage() {
  return (
    <main className="py-24">
      <Container>
        <div className="max-w-4xl mx-auto prose prose-lg">
          <h1 className="text-5xl font-bold mb-4">
            Privacy <span className="font-cursive text-gray-500">Policy</span>
          </h1>

          <p className="text-gray-600 mb-2">Last updated: May 2026</p>
          <p className="text-gray-500 text-sm mb-8">
            This page is the single canonical Privacy Policy for Cursive across both{" "}
            <a href="https://www.meetcursive.com" className="text-primary">meetcursive.com</a>{" "}
            (marketing site) and{" "}
            <a href="https://leads.meetcursive.com" className="text-primary">leads.meetcursive.com</a>{" "}
            (the Cursive application, including installs from the Shopify and GoHighLevel marketplaces).
          </p>

          <p>
            At Cursive (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), we take your privacy seriously.
            This Privacy Policy explains how we collect, use, disclose, retain, and safeguard information when you visit
            our websites, use our platform, install our app via our marketplace partners, or interact with our services.
          </p>

          <h2 id="scope">1. Scope and Applicable Laws</h2>
          <p>This Privacy Policy is designed to comply with, and is interpreted in accordance with, the following frameworks:</p>
          <ul>
            <li><strong>EU General Data Protection Regulation (GDPR)</strong> and UK GDPR</li>
            <li><strong>California Consumer Privacy Act (CCPA)</strong> as amended by the California Privacy Rights Act (CPRA)</li>
            <li><strong>Quebec Law 25</strong> (An Act to modernize legislative provisions as regards the protection of personal information)</li>
            <li>Other U.S. state privacy laws (CO, CT, VA, UT, TX, OR, MT, IA, DE)</li>
            <li><strong>CAN-SPAM Act</strong>, <strong>TCPA</strong>, and applicable telecommunications law for outbound communications</li>
            <li>California Invasion of Privacy Act (<strong>CIPA</strong>) and analogous federal/state wiretap and electronic-communications statutes</li>
          </ul>
          <p>
            Where these frameworks conflict, the stricter requirement governs for residents of the applicable jurisdiction.
            We monitor case law developments — including the <em>Camplisson</em> line of pixel-tracking decisions and the 2025
            volume of CIPA filings — and update our consent, disclosure, and opt-out implementation accordingly (see §13).
          </p>

          <h2 id="information-collected">2. Information We Collect</h2>

          <h3>2.1 Information You Provide</h3>
          <ul>
            <li>Name, email address, and contact information</li>
            <li>Company name, job title, and business details</li>
            <li>Payment and billing information (processed securely via Stripe)</li>
            <li>Communications with our team, including chat and email</li>
            <li>Account preferences and targeting criteria</li>
          </ul>

          <h3>2.2 Information Collected Automatically</h3>
          <ul>
            <li><strong>Device &amp; browser information:</strong> IP address, browser type and version, operating system, device type, and screen resolution</li>
            <li><strong>Usage data:</strong> Pages visited, time spent on pages, click patterns, referring URLs, and navigation paths</li>
            <li><strong>Location data:</strong> Approximate geographic location derived from your IP address</li>
            <li><strong>Privacy signals:</strong> Global Privacy Control (GPC) header (<code>Sec-GPC: 1</code>) and Do Not Track header (see §7)</li>
          </ul>

          <h3>2.3 Visitor Identification Data (via Cursive Pixel)</h3>
          <p>The Cursive pixel deployed on customer websites collects:</p>
          <ul>
            <li>Anonymous visitor identifiers (browser cookie IDs, hashed identifiers)</li>
            <li>Page URLs visited and referrer URLs</li>
            <li>Event timestamps (page view, product view, cart, checkout events)</li>
            <li>IP-derived approximate location</li>
            <li>Resolved identity attributes when matched against the Cursive identity graph: name, email address, phone number, mailing address, employer, job title</li>
          </ul>
          <p>
            We do not collect the content of communications, capture keystrokes, or record session replays. We do not
            cross-track across third-party advertising networks. The Cursive pixel sets only a first-party cookie
            (<code>_cursive_cid</code>) on the installing site.
          </p>

          <h3>2.4 Marketplace Integration Data</h3>
          <p>
            <strong>Shopify:</strong> when a customer installs the Cursive Shopify app we receive shop information,
            customer email addresses (for matching to resolved visitors), and order events (used to suppress customers
            from acquisition retargeting).
          </p>
          <p>
            <strong>GoHighLevel:</strong> when an agency installs the Cursive app on a GHL location we receive location
            metadata, custom values, and contact data necessary to write back identified visitors as GHL contacts with
            intent tags.
          </p>

          <h2 id="identity-graph-provenance">3. Identity Graph Sources and Provenance</h2>
          <p>
            Cursive&apos;s identity resolution layer matches anonymous visitors to verified business and consumer profiles.
            The underlying identity graph is sourced from:
          </p>
          <ul>
            <li><strong>Publicly available business information</strong> — corporate registries, professional profiles, company websites, regulatory filings</li>
            <li><strong>Opted-in consumer panels</strong> — first-party data contributed by panel participants who provided informed consent and may withdraw at any time</li>
            <li><strong>Public records</strong> — including the National Change of Address (NCOA) registry for address validation</li>
            <li><strong>Licensed third-party identity graphs</strong> — data providers under written license, each contractually required to represent that records were lawfully sourced and that downstream use is permitted under applicable privacy law</li>
            <li><strong>Customer first-party data</strong> — data our customers authorize us to ingest, scoped to that customer&apos;s workspace</li>
          </ul>
          <p>
            Records undergo regular verification (305M+ records re-verified monthly). Skip-traced data is flagged in the
            record. Do-Not-Contact (DNC) flags returned from the upstream identity layer are persisted to every record
            and enforced before any outbound action by Cursive or its customers.
          </p>
          <p>
            <strong>De-listing.</strong> Any individual may request removal from the Cursive identity graph by emailing{" "}
            <a href="mailto:privacy@meetcursive.com" className="text-primary">privacy@meetcursive.com</a>. De-listing
            is honored within 30 days, propagates platform-wide (see §8), and is stored as a persistent suppression
            so the individual is not re-resolved if their data reappears in a future graph refresh.
          </p>

          <h2 id="consent-management">4. Consent Management</h2>

          <h3>4.1 Our Approach</h3>
          <p>
            Cursive uses a Consent Management Tool (CMT) on our websites to inform visitors about data collection and
            obtain clear, documented consent before activating non-essential tracking technologies. When you first visit,
            you will be presented with a cookie consent notice describing the categories of data we collect and giving
            you a choice to accept or decline.
          </p>

          <h3>4.2 What Happens When You Accept</h3>
          <p>
            If you click &ldquo;Accept,&rdquo; we activate analytics, visitor identification, and marketing technologies
            as described in this policy. Your consent is recorded with a timestamp and stored in your browser so you
            are not asked again on subsequent visits for a period of 12 months.
          </p>

          <h3>4.3 What Happens When You Decline</h3>
          <p>
            If you click &ldquo;Decline,&rdquo; we limit data collection to essential, functional cookies only. Non-essential
            cookies, analytics scripts, and visitor identification pixels are <strong>not activated</strong>. Your decline
            preference is stored and honored on subsequent visits.
          </p>

          <h3>4.4 Consent Records</h3>
          <p>
            We maintain records of consent decisions including date, time, IP, and consent-notice version. These records
            are retained for audit and compliance purposes. You may withdraw your consent at any time by clearing your
            browser&apos;s local storage or contacting{" "}
            <a href="mailto:privacy@meetcursive.com" className="text-primary">privacy@meetcursive.com</a>.
          </p>

          <h3>4.5 Consent Architecture on Customer Sites</h3>
          <p>
            <strong>Shopify installs.</strong> The Cursive pixel installed via the Shopify Web Pixels API gates resolution
            calls behind the visitor&apos;s consent state, as reported by Shopify&apos;s native consent banner. Resolution
            calls fire only after consent is granted for analytics + marketing purposes. EU and CCPA-region visitors see
            the native consent banner before any resolution occurs. Post-purchase conversion events fire regardless of
            consent state but are used solely for suppression (so existing customers stop seeing acquisition ads) —
            never for new identity resolution.
          </p>
          <p>
            <strong>GoHighLevel and direct installs.</strong> The Cursive pixel relies on the merchant&apos;s consent
            management. Merchants are required (under §15 below and our Terms of Service) to ensure their consent
            capture complies with applicable law (GDPR, CCPA/CPRA, Quebec Law 25).
          </p>

          <h2 id="gpc">5. Global Privacy Control (GPC) and Do Not Track</h2>
          <p>
            <strong>GPC handling.</strong> Cursive recognizes the Global Privacy Control specification. When a request
            to a Cursive-controlled endpoint (meetcursive.com, leads.meetcursive.com, or the Cursive pixel ingestion
            endpoint) carries the <code>Sec-GPC: 1</code> header, we treat that signal as:
          </p>
          <ul>
            <li>An opt-out of <strong>sale</strong> and <strong>sharing</strong> under CCPA/CPRA and analogous U.S. state laws</li>
            <li>A withdrawal of consent for non-essential cookies and analytics under GDPR and Quebec Law 25</li>
            <li>A request to suppress the originating browser/identity from future Cursive identity resolution</li>
          </ul>
          <p>
            The GPC signal is processed server-side at the pixel ingestion endpoint and persisted as a suppression
            tied to the visitor&apos;s first-party cookie. Where Cursive operates downstream of a customer&apos;s
            Consent Management Platform (e.g. Shopify Web Pixels API), the upstream CMP&apos;s recognition of GPC
            governs whether the pixel fires at all; Cursive&apos;s server-side GPC handling provides a second layer
            of enforcement.
          </p>
          <p>
            <strong>Do Not Track (DNT).</strong> We honor the DNT browser header on Cursive-owned properties on the
            same terms as GPC. We treat DNT as advisory on customer-installed pixels because the DNT specification
            was never finalized and behavior across browsers is inconsistent; the dominant signal for downstream
            installs is the upstream CMP decision plus GPC.
          </p>

          <h2 id="opt-out-propagation">6. Opt-Out Propagation Across Sessions, Devices, and the Platform</h2>
          <p>
            A consumer opt-out reaches Cursive through any of the following channels:
          </p>
          <ul>
            <li>Declining our cookie consent banner</li>
            <li>Sending a <code>Sec-GPC: 1</code> signal (see §5)</li>
            <li>Emailing <a href="mailto:privacy@meetcursive.com" className="text-primary">privacy@meetcursive.com</a></li>
            <li>A Shopify <code>customers/redact</code>, <code>shop/redact</code>, or <code>customers/data_request</code> webhook</li>
            <li>Any state-mandated opt-out portal request</li>
          </ul>
          <p>Once received, the opt-out is propagated as follows:</p>
          <ul>
            <li><strong>Cross-session, same browser:</strong> The decline / opt-out preference is written to the first-party <code>_cursive_cid</code> cookie and to a server-side suppression list. The pixel will not re-resolve the visitor on subsequent visits even if the cookie is cleared, because the suppression list is keyed by the visitor&apos;s resolved identity (hashed email, where known).</li>
            <li><strong>Cross-device:</strong> Where the consumer is identified by hashed email (HEM), the suppression applies across all devices and browsers that resolve to that identity.</li>
            <li><strong>Platform-wide:</strong> Opt-out is enforced at the Cursive platform layer, not per-customer. A consumer who opts out is suppressed across every Cursive customer workspace going forward.</li>
            <li><strong>Workspace isolation:</strong> Visitor data does not cross between customer workspaces. Workspace isolation is enforced at the database layer via Row-Level Security policies, not by application logic alone.</li>
            <li><strong>SLA:</strong> Opt-out, deletion, and de-listing requests are honored within 30 days.</li>
          </ul>

          <h2 id="cookies">7. Cookies and Tracking Technologies</h2>

          <h3>7.1 What We Use</h3>
          <ul>
            <li><strong>Essential cookies:</strong> Required for basic site functionality, authentication, and security</li>
            <li><strong>Analytics cookies:</strong> Google Analytics to understand site usage patterns and improve our services</li>
            <li><strong>Visitor identification pixels:</strong> First-party pixels to identify website visitors for B2B lead generation purposes</li>
            <li><strong>Chat functionality:</strong> Crisp chat widget for customer support</li>
            <li><strong>Marketing cookies:</strong> To measure advertising effectiveness and deliver relevant content</li>
          </ul>
          <p>
            The Cursive pixel uses a first-party cookie (<code>_cursive_cid</code>) on installed sites for visitor
            consistency across sessions. <strong>We do not use third-party advertising cookies.</strong>
          </p>

          <h3>7.2 Managing Cookies</h3>
          <p>
            You can manage your cookie preferences through the cookie consent banner displayed on our website.
            Clicking &ldquo;Decline&rdquo; will prevent non-essential cookies and tracking technologies from loading.
            You can also configure your browser to refuse all cookies or alert you when cookies are being sent.
            Note that disabling essential cookies may affect site functionality.
          </p>

          <h2 id="use">8. How We Use Your Information</h2>
          <ul>
            <li>To provide, maintain, and improve our lead generation platform</li>
            <li>To identify website visitors and deliver leads to your dashboard and your connected CRMs (GoHighLevel, Klaviyo, Meta, and others you explicitly authorize)</li>
            <li>To process payments and manage your subscription</li>
            <li>To send transactional emails (install confirmation, sync alerts, account notifications)</li>
            <li>To improve the Service via aggregate, de-identified analytics</li>
            <li>To detect, investigate, and prevent fraud and security incidents</li>
            <li>To comply with legal obligations and protect against fraud</li>
          </ul>

          <h2 id="sharing">9. Data Sharing &mdash; and Our CCPA &ldquo;Sharing&rdquo; Posture</h2>
          <p>
            <strong>We do not sell personal information.</strong> &ldquo;Sale&rdquo; is defined under CCPA/CPRA as exchanging
            personal information for monetary or other valuable consideration. We do not engage in such exchanges.
          </p>
          <p>
            <strong>We do not &ldquo;share&rdquo; personal information for cross-context behavioral advertising</strong> as
            that term is defined under CPRA. The CPRA-specific definition of &ldquo;sharing&rdquo; covers the disclosure
            of personal information to a third party for cross-context behavioral advertising. Cursive does not engage
            in cross-context behavioral advertising, does not pass identifiers to ad networks for retargeting on third-party
            properties, and does not participate in real-time bidding ecosystems.
          </p>
          <p>
            Delivery of lead data to the Cursive customer whose pixel resolved the visitor is the service the
            consumer&apos;s data is processed for; it is a disclosure to a service-related party rather than
            cross-context behavioral advertising.
          </p>
          <p>We share information only with:</p>
          <ul>
            <li><strong>Sub-processors</strong> we use to operate the Service (see §10)</li>
            <li><strong>Destinations the customer connects</strong> in the Cursive portal &mdash; Meta (Custom Audiences), Klaviyo (email lists), GoHighLevel (contacts), Google Sheets, and others the customer explicitly authorizes. We send only the fields the customer configures</li>
            <li><strong>Marketplace platforms</strong> (Shopify, GoHighLevel) for the limited data flows described in the integration documentation</li>
            <li><strong>Professional advisors</strong> &mdash; lawyers, accountants, auditors</li>
            <li><strong>Authorities</strong> when legally compelled (subpoena, court order, regulatory request)</li>
            <li><strong>Business transfers</strong> in connection with a merger, acquisition, or sale of assets &mdash; where the recipient is bound by terms no less protective than this Policy</li>
          </ul>

          <h2 id="subprocessors">10. Sub-Processors</h2>
          <p>The following sub-processors process personal data on Cursive&apos;s behalf:</p>
          <ul>
            <li><strong>Supabase Inc.</strong> &mdash; database hosting and authentication. <a href="https://supabase.com/privacy" className="text-primary">Supabase Privacy</a></li>
            <li><strong>Vercel Inc.</strong> &mdash; web hosting and edge compute. <a href="https://vercel.com/legal/privacy-policy" className="text-primary">Vercel Privacy</a></li>
            <li><strong>Inngest Inc.</strong> &mdash; background job orchestration</li>
            <li><strong>Stripe Inc.</strong> &mdash; payment processing. <a href="https://stripe.com/privacy" className="text-primary">Stripe Privacy</a></li>
            <li><strong>Google LLC (Google Analytics)</strong> &mdash; web analytics. <a href="https://policies.google.com/privacy" className="text-primary">Google Privacy</a></li>
            <li><strong>Crisp IM SAS</strong> &mdash; live chat. <a href="https://crisp.chat/en/privacy/" className="text-primary">Crisp Privacy</a></li>
            <li><strong>Identity-resolution provider</strong> &mdash; the upstream identity graph and pixel resolution layer described in §3. Operates under written contract; their privacy policy is provided as part of the DPA disclosure (see §14)</li>
            <li><strong>Email-delivery providers</strong> &mdash; transactional email delivery (Resend, Postmark, or equivalents)</li>
          </ul>
          <p>
            We maintain a current sub-processor list and provide 30 days&apos; notice of material changes to enterprise
            customers under DPA. Request the current list at{" "}
            <a href="mailto:privacy@meetcursive.com" className="text-primary">privacy@meetcursive.com</a>.
          </p>

          <h2 id="legal-basis">11. Legal Basis for Processing (GDPR)</h2>
          <p>For individuals in the EEA / UK, we process personal data on the following legal bases:</p>
          <ul>
            <li><strong>Consent (Art. 6(1)(a)):</strong> analytics cookies, visitor identification pixels, and marketing technologies &mdash; activated only after the user clicks &ldquo;Accept&rdquo; on our consent banner</li>
            <li><strong>Contract (Art. 6(1)(b)):</strong> processing necessary to fulfill your subscription, deliver leads, and manage your account</li>
            <li><strong>Legitimate Interests (Art. 6(1)(f)):</strong> B2B marketing and lead generation using publicly available professional data; fraud prevention; platform security and improvement. Our legitimate interests are balanced against individuals&apos; rights &mdash; business-professional contact information used for relevant B2B outreach does not unduly override their privacy interests</li>
            <li><strong>Legal Obligation (Art. 6(1)(c)):</strong> tax records, compliance reporting, and responding to lawful government requests</li>
          </ul>
          <p>
            You may request a copy of our Legitimate Interests Assessment (LIA) by contacting{" "}
            <a href="mailto:privacy@meetcursive.com" className="text-primary">privacy@meetcursive.com</a>.
          </p>

          <h2 id="rights">12. Your Rights &mdash; by Jurisdiction</h2>

          <h3>12.1 All Users</h3>
          <ul>
            <li>Access and receive a copy of your personal data</li>
            <li>Rectify inaccurate personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to or restrict processing of your data</li>
            <li>Data portability (receive your data in a structured format)</li>
            <li>Withdraw consent at any time (where processing is based on consent)</li>
          </ul>

          <h3>12.2 California Residents (CCPA / CPRA)</h3>
          <p>
            California residents have the additional rights to know what personal information is collected, to delete,
            to correct, to opt out of <strong>sale</strong> or <strong>sharing</strong> of personal information, to
            limit the use of sensitive personal information, and to non-discrimination for exercising these rights.
            Cursive does not engage in sale or sharing as defined under CPRA (see §9). GPC is honored as a valid
            opt-out signal (see §5).
          </p>

          <h3>12.3 European Residents (GDPR)</h3>
          <p>
            EEA / UK residents may exercise the rights listed in 12.1 and may lodge a complaint with their local data
            protection authority. Our legal bases are described in §11.
          </p>

          <h3>12.4 Quebec Residents (Law 25)</h3>
          <p>
            Quebec residents have the rights listed in 12.1, plus additional rights under Law 25, including:
          </p>
          <ul>
            <li>The right to be informed when personal information is used to render a decision based exclusively on automated processing</li>
            <li>The right to data portability beginning under Law 25&apos;s phased portability provisions</li>
            <li>The right to request that personal information be de-indexed or ceased from dissemination where it causes serious injury</li>
            <li>The right to receive privacy disclosures in French upon request</li>
          </ul>
          <p>
            <strong>Privacy officer.</strong> Cursive&apos;s designated person in charge of the protection of personal
            information (privacy officer) for Law 25 purposes is reachable at{" "}
            <a href="mailto:privacy@meetcursive.com" className="text-primary">privacy@meetcursive.com</a>.
          </p>
          <p>
            <strong>Automated decision-making.</strong> Cursive does not use solely automated decision-making to render
            decisions that produce legal or similarly significant effects on individuals. Lead scoring is advisory; final
            decisions about outreach are made by the customer.
          </p>
          <p>
            <strong>Cross-border transfers.</strong> Cursive operates in the United States. Transfers of Quebec residents&apos;
            personal information outside Quebec are subject to a Privacy Impact Assessment (PIA) and contractual
            safeguards. See §17.
          </p>

          <h3>12.5 Other U.S. State Residents</h3>
          <p>
            Residents of Colorado, Connecticut, Virginia, Utah, Texas, Oregon, Montana, Iowa, and Delaware have rights
            under their respective state laws that parallel CCPA / CPRA. We honor these rights on the same SLA and
            through the same channels.
          </p>

          <h3>12.6 How to Exercise Your Rights</h3>
          <p>
            Email <a href="mailto:privacy@meetcursive.com" className="text-primary">privacy@meetcursive.com</a>.
            We respond within 30 days (extendable to 45 where law permits, with notice). We will not discriminate
            against you for exercising your rights.
          </p>

          <h2 id="dpa">13. Data Processing Agreements (DPA)</h2>
          <p>
            Cursive operates as a <strong>data processor</strong> when handling personal information on behalf of our
            customers, and as a <strong>data controller</strong> for our own platform and marketing. A Data Processing
            Agreement is available for execution by:
          </p>
          <ul>
            <li>All Pipeline-tier and Enterprise customers</li>
            <li>Any customer on request, regardless of tier, at <a href="mailto:privacy@meetcursive.com" className="text-primary">privacy@meetcursive.com</a></li>
          </ul>
          <p>The Cursive DPA includes:</p>
          <ul>
            <li>Standard contractual clauses (EU SCCs and UK Addendum) for international transfers</li>
            <li>The sub-processor list at §10 (and a 30-day notice mechanism for material changes)</li>
            <li>Security commitments (TLS in transit, encryption at rest, RBAC, audit logging, regular security review)</li>
            <li>Breach notification within 72 hours of awareness</li>
            <li>Audit rights consistent with Article 28 GDPR</li>
            <li>Quebec Law 25 cross-border transfer commitments and PIA cooperation</li>
            <li>Data return / deletion within 30 days of contract termination</li>
          </ul>

          <h2 id="camplisson-cipa">14. Camplisson, CIPA, and Wiretap-Statute Posture</h2>
          <p>
            We are aware of the <em>Camplisson</em> line of California pixel-tracking decisions and the substantial
            increase in CIPA (Cal. Penal Code §§ 631, 632.7) filings in 2025 targeting third-party pixels and
            session-replay technologies. Our implementation is designed to avoid the conduct those cases address:
          </p>
          <ul>
            <li><strong>No session replay or keystroke capture.</strong> The Cursive pixel does not record session video, capture form-field contents pre-submission, or stream the content of communications. It records event metadata only (URL, timestamp, event type).</li>
            <li><strong>No third-party advertising cookies.</strong> The Cursive pixel sets only a first-party cookie on the installing site.</li>
            <li><strong>Consent gating before resolution.</strong> On Shopify installs the pixel runs through the Web Pixels API, which gates execution behind the visitor&apos;s consent state under Shopify&apos;s native consent banner. On other installs the merchant&apos;s CMP gates execution. Resolution calls fire only after consent is granted.</li>
            <li><strong>Server-side GPC honoring.</strong> Cursive&apos;s ingestion endpoint independently honors <code>Sec-GPC: 1</code> (see §5).</li>
            <li><strong>No interception of consumer-to-merchant communications.</strong> Cursive does not read, transmit, or store the content of consumer chats, emails, or messages exchanged with our customers&apos; sites.</li>
            <li><strong>Two-party consent jurisdictions.</strong> In states with two-party consent requirements (California, Florida, others), the pixel is gated by the merchant&apos;s explicit consent flow as described above.</li>
          </ul>
          <p>
            Customers remain responsible for their own consent capture on their own properties (see §15). Cursive&apos;s
            implementation provides controller-side mitigations; it does not eliminate the customer&apos;s controller-side
            obligations.
          </p>

          <h2 id="customer-requirements">15. Requirements for Customers Installing the Cursive Pixel</h2>
          <p>
            If you are a Cursive customer who installs our pixel on your website, you are required under our Terms of
            Service and applicable law to:
          </p>
          <ul>
            <li>Disclose use of visitor identification technology in your own website&apos;s privacy policy</li>
            <li>Display a cookie consent or tracking notice before the pixel activates</li>
            <li>Use a Consent Management Platform (CMP) or Consent Management Tool (CMT) to log consent decisions, including GPC where applicable</li>
            <li>Honor opt-outs and consent withdrawals from your visitors</li>
            <li>Establish a lawful basis (legitimate interests or explicit consent) for visitor identification data processing</li>
            <li>Comply with Camplisson / CIPA mitigations on your own property (no pre-consent firing, no session replay layered on top of Cursive, etc.)</li>
          </ul>
          <p>
            Cursive is not responsible for our customers&apos; consent management practices on their own websites. The
            Cursive DPA includes customer obligations in this regard.
          </p>

          <h2 id="security">16. Data Security</h2>
          <p>
            We implement industry-standard security: TLS encryption in transit, encryption at rest, role-based access
            controls, audit logging, and regular security review. Access to production systems is restricted to a small
            set of authorized engineers and is logged. Multi-tenant isolation is enforced at the database layer via
            Row-Level Security policies, not by application logic alone.
          </p>

          <h2 id="retention">17. Data Retention</h2>
          <p>
            We retain account data while your account is active. Visitor lead data is retained for the duration of your
            subscription plus 30 days after cancellation, after which it is permanently deleted. Consent records are
            retained for audit purposes for the period required by applicable law.
          </p>
          <p>
            Upon receipt of a Shopify <code>customers/redact</code>, <code>shop/redact</code>, or{" "}
            <code>customers/data_request</code> webhook, we comply within 30 days. Upon any other deletion request
            received at{" "}
            <a href="mailto:privacy@meetcursive.com" className="text-primary">privacy@meetcursive.com</a> we honor it
            within 30 days.
          </p>

          <h2 id="international">18. International Data Transfers</h2>
          <p>
            Cursive operates in the United States. By using the Service you acknowledge that your information may be
            transferred to and processed in the United States, where data protection laws may differ from your
            jurisdiction. For EEA / UK transfers, we rely on Standard Contractual Clauses (and the UK Addendum) as
            described in our DPA. For Quebec transfers, we conduct a Privacy Impact Assessment as required by Law 25 §17.
          </p>

          <h2 id="children">19. Children&apos;s Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 18. We do not knowingly collect personal
            information from children. If you believe we have collected information from a child, please contact us
            immediately.
          </p>

          <h2 id="changes">20. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting the
            new Policy on this page, updating the &ldquo;Last updated&rdquo; date, and notifying active customers via email.
          </p>

          <h2 id="contact">21. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or wish to exercise your privacy rights, contact us at:</p>
          <ul>
            <li>Privacy &amp; data rights: <a href="mailto:privacy@meetcursive.com" className="text-primary hover:underline">privacy@meetcursive.com</a></li>
            <li>General inquiries: <a href="mailto:hey@meetcursive.com" className="text-primary hover:underline">hey@meetcursive.com</a></li>
            <li>Quebec privacy officer: <a href="mailto:privacy@meetcursive.com" className="text-primary hover:underline">privacy@meetcursive.com</a></li>
          </ul>
        </div>
      </Container>
    </main>
  )
}
