import { Metadata } from "next"
import { Container } from "@/components/ui/container"

export const metadata: Metadata = {
  title: "Privacy Policy | Cursive",
  description: "Learn how Cursive collects, uses, and protects your personal information. Our privacy policy covers data collection, cookies, your rights under GDPR and CCPA, and how to contact us.",
  keywords: "privacy policy, data protection, GDPR, CCPA, data privacy, personal information, cookies policy",
  openGraph: {
    title: "Privacy Policy | Cursive",
    description: "Learn how Cursive collects, uses, and protects your personal information. Our privacy policy covers data collection, cookies, your rights under GDPR and CCPA, and how to contact us.",
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
    description: "Learn how Cursive collects, uses, and protects your personal information. Our privacy policy covers data collection, cookies, your rights under GDPR and CCPA, and how to contact us.",
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
            Privacy <span className="font-cursive text-gray-900">Policy</span>
          </h1>

          <p className="text-gray-600 mb-8">Last updated: February 11, 2026</p>

          <p>
            At Cursive (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), we take your privacy seriously.
            This Privacy Policy explains how we collect, use, disclose, and safeguard information when you visit
            our websites (meetcursive.com and leads.meetcursive.com), use our platform, or interact with our services.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>1.1 Information You Provide</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Name, email address, and contact information</li>
            <li>Company name, job title, and business details</li>
            <li>Payment and billing information (processed securely via Stripe)</li>
            <li>Communications with our team, including chat and email</li>
            <li>Account preferences and targeting criteria</li>
          </ul>

          <h3>1.2 Information Collected Automatically</h3>
          <p>When you visit our websites, we automatically collect certain information, including:</p>
          <ul>
            <li><strong>Device & browser information:</strong> IP address, browser type and version, operating system, device type, and screen resolution</li>
            <li><strong>Usage data:</strong> Pages visited, time spent on pages, click patterns, referring URLs, and navigation paths</li>
            <li><strong>Location data:</strong> Approximate geographic location derived from your IP address</li>
          </ul>

          <h3>1.3 Visitor Identification Technology</h3>
          <p>
            Cursive is a B2B lead generation platform. As part of our core services, we use visitor identification
            technology (including first-party and third-party tracking pixels) to identify businesses and professionals
            visiting our website and the websites of our customers. This technology may resolve anonymous website
            visits to business-level or individual-level identities using:
          </p>
          <ul>
            <li>IP-to-company resolution</li>
            <li>Cookie-based and pixel-based tracking</li>
            <li>Cross-reference with publicly available business databases and data partners</li>
            <li>Browser fingerprinting signals</li>
          </ul>
          <p>
            This visitor identification data is used to provide our lead generation services and is
            shared with our customers only in accordance with applicable laws and our data processing agreements.
          </p>

          <h3>1.4 Data from Third-Party Sources</h3>
          <p>We may supplement information we collect with data from third-party sources, including:</p>
          <ul>
            <li>Publicly available business directories and professional profiles</li>
            <li>Data enrichment providers for business contact information</li>
            <li>Intent data providers that signal buying behavior</li>
            <li>Social media platforms (where publicly available)</li>
          </ul>

          <h2>2. Cookies and Tracking Technologies</h2>

          <h3>2.1 What We Use</h3>
          <p>We use the following cookies and tracking technologies:</p>
          <ul>
            <li><strong>Essential cookies:</strong> Required for basic site functionality, authentication, and security</li>
            <li><strong>Analytics cookies:</strong> Google Analytics to understand site usage patterns and improve our services</li>
            <li><strong>Visitor identification pixels:</strong> Third-party pixels to identify website visitors for lead generation purposes</li>
            <li><strong>Chat functionality:</strong> Crisp chat widget for customer support</li>
            <li><strong>Marketing cookies:</strong> To measure advertising effectiveness and deliver relevant content</li>
          </ul>

          <h3>2.2 Third-Party Tracking Services</h3>
          <p>Our site uses the following third-party services that may set their own cookies:</p>
          <ul>
            <li><strong>Google Analytics (Google LLC):</strong> Web analytics service. <a href="https://policies.google.com/privacy" className="text-[#007AFF]">Google Privacy Policy</a></li>
            <li><strong>Crisp (Crisp IM SAS):</strong> Live chat and customer messaging. <a href="https://crisp.chat/en/privacy/" className="text-[#007AFF]">Crisp Privacy Policy</a></li>
            <li><strong>Stripe (Stripe Inc.):</strong> Payment processing. <a href="https://stripe.com/privacy" className="text-[#007AFF]">Stripe Privacy Policy</a></li>
          </ul>

          <h3>2.3 Managing Cookies</h3>
          <p>
            You can manage your cookie preferences through the cookie consent banner displayed on our website.
            You can also configure your browser to refuse all cookies or alert you when cookies are being sent.
            Note that disabling cookies may affect site functionality.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our lead generation platform</li>
            <li>Process your transactions, manage your account, and deliver purchased leads</li>
            <li>Identify and resolve website visitor identities for our B2B lead generation services</li>
            <li>Enrich lead data with publicly available business information</li>
            <li>Send you technical notices, updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Monitor and analyze usage trends to improve user experience</li>
            <li>Detect, investigate, and prevent fraud and security incidents</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information to third parties for their own marketing purposes. We may share your information with:</p>
          <ul>
            <li><strong>Our customers:</strong> Lead data generated through our platform is delivered to customers who have purchased those leads through our marketplace</li>
            <li><strong>Service providers:</strong> Third-party vendors who help us operate our platform (hosting, email delivery, payment processing, data enrichment)</li>
            <li><strong>Data partners:</strong> We work with data providers to enrich and verify business contact information</li>
            <li><strong>Professional advisors:</strong> Lawyers, accountants, and other advisors as needed</li>
            <li><strong>Law enforcement:</strong> When required by law, subpoena, or court order</li>
            <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>

          <h2>5. Data from Publicly Available Sources</h2>
          <p>
            As a B2B data platform, Cursive aggregates and processes business information from publicly available
            sources. This includes business contact details, company information, job titles, and professional
            profiles that are publicly accessible on the internet. We process this information for legitimate
            business interests in providing our B2B lead generation services.
          </p>

          <h2>6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information,
            including encryption in transit (TLS/SSL), secure data storage, access controls, and regular
            security assessments. However, no method of transmission over the internet is 100% secure.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We retain personal information for as long as necessary to fulfill the purposes described in this
            policy, comply with legal obligations, resolve disputes, and enforce our agreements. Lead data is
            retained in accordance with our data processing agreements with customers.
          </p>

          <h2>8. Your Rights</h2>

          <h3>8.1 All Users</h3>
          <p>You have the right to:</p>
          <ul>
            <li>Access and receive a copy of your personal data</li>
            <li>Rectify inaccurate personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to or restrict processing of your data</li>
            <li>Data portability (receive your data in a structured format)</li>
            <li>Withdraw consent at any time (where processing is based on consent)</li>
          </ul>

          <h3>8.2 California Residents (CCPA/CPRA)</h3>
          <p>
            If you are a California resident, you have additional rights under the California Consumer Privacy
            Act (CCPA) and its amendments, including the right to know what personal information is collected,
            the right to delete, and the right to opt out of the sale or sharing of personal information.
          </p>

          <h3>8.3 European Residents (GDPR)</h3>
          <p>
            If you are located in the European Economic Area, we process your personal data on the following
            legal bases: consent, performance of a contract, legitimate interests (B2B marketing and lead generation),
            and compliance with legal obligations. You may lodge a complaint with your local data protection authority.
          </p>

          <h3>8.4 Opt-Out of Visitor Identification</h3>
          <p>
            If you do not wish to be identified through our visitor identification technology, you can:
          </p>
          <ul>
            <li>Decline cookies via our cookie consent banner</li>
            <li>Use browser privacy settings or &ldquo;Do Not Track&rdquo; signals</li>
            <li>Contact us at <a href="mailto:privacy@meetcursive.com" className="text-[#007AFF]">privacy@meetcursive.com</a> to request removal from our database</li>
          </ul>

          <h2>9. Children&apos;s Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 18. We do not knowingly collect
            personal information from children. If you believe we have collected information from a child,
            please contact us immediately.
          </p>

          <h2>10. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure
            appropriate safeguards are in place for international data transfers in compliance with applicable law.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by
            posting the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date. Your continued
            use of our services after changes constitutes acceptance of the updated policy.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us at:
          </p>
          <ul>
            <li>Email: <a href="mailto:privacy@meetcursive.com" className="text-[#007AFF] hover:underline">privacy@meetcursive.com</a></li>
            <li>General inquiries: <a href="mailto:hello@meetcursive.com" className="text-[#007AFF] hover:underline">hello@meetcursive.com</a></li>
          </ul>
        </div>
      </Container>
    </main>
  )
}
