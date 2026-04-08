import { Metadata } from "next"
import { Container } from "@/components/ui/container"

export const metadata: Metadata = {
  title: "Terms of Service | Cursive",
  description: "Read the Cursive Terms of Service. Understand the terms and conditions for using our visitor identification, audience building, and lead generation platform.",
  keywords: "terms of service, terms and conditions, user agreement, platform terms, service agreement, data processing, visitor identification terms",
  openGraph: {
    title: "Terms of Service | Cursive",
    description: "Read the Cursive Terms of Service. Understand the terms and conditions for using our visitor identification, audience building, and lead generation platform.",
    url: "https://www.meetcursive.com/terms",
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
    title: "Terms of Service | Cursive",
    description: "Read the Cursive Terms of Service. Understand the terms and conditions for using our visitor identification, audience building, and lead generation platform.",
    images: ["https://www.meetcursive.com/cursive-social-preview.png"],
    creator: "@meetcursive",
  },
  alternates: {
    canonical: "https://www.meetcursive.com/terms",
  },
}

export default function TermsPage() {
  return (
    <main className="py-24">
      <Container>
        <div className="max-w-4xl mx-auto prose prose-lg">
          <h1 className="text-5xl font-bold mb-4">
            Terms of <span className="font-cursive text-gray-500">Service</span>
          </h1>

          <p className="text-gray-600 mb-8">Last updated: February 24, 2026</p>

          <p>
            Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using the Cursive platform
            operated by Cursive (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
            By accessing or using our services, you (&ldquo;Customer,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;)
            agree to be bound by these Terms. If you do not agree, do not use our services.
          </p>

          <h2>1. Description of Services</h2>
          <p>
            Cursive provides a B2B lead generation and sales intelligence platform, including:
          </p>
          <ul>
            <li><strong>Website Visitor Identification:</strong> A JavaScript tracking pixel (&ldquo;SuperPixel&rdquo;) that identifies anonymous website visitors and resolves them to business-level and individual-level identities using first-party and third-party data sources</li>
            <li><strong>Lead Marketplace:</strong> Access to a database of B2B contact and company information</li>
            <li><strong>Audience Builder:</strong> Tools to build, filter, and export targeted audience segments</li>
            <li><strong>CRM & Campaign Tools:</strong> Email sequencing, contact management, and outbound campaign capabilities</li>
            <li><strong>Data Enrichment:</strong> Supplementing existing contact records with additional firmographic and demographic data</li>
          </ul>

          <h2>2. Acceptance and Eligibility</h2>
          <p>
            By creating an account or using our services, you represent that: (a) you are at least 18 years of age;
            (b) you have the legal authority to enter into these Terms on behalf of yourself or the organization you
            represent; (c) your use of the services will comply with all applicable laws; and (d) you will use the
            services solely for lawful B2B marketing, sales, and business development purposes.
          </p>

          <h2>3. Pixel Installation and Visitor Identification</h2>

          <h3>3.1 Customer Obligations for Pixel Deployment</h3>
          <p>
            If you install the Cursive SuperPixel on your website, you agree to:
          </p>
          <ul>
            <li><strong>Privacy Policy disclosure:</strong> Prominently disclose in your website&apos;s privacy policy that you use visitor identification technology, including tracking pixels that may resolve anonymous visits to identifiable business contacts</li>
            <li><strong>Cookie/consent notice:</strong> Display a clear and conspicuous cookie consent or tracking notice to your website visitors before the pixel activates, in compliance with all applicable laws (including GDPR, CCPA, ePrivacy Directive, and similar regulations)</li>
            <li><strong>Consent management:</strong> Implement or use a recognized Consent Management Platform (CMP) or Consent Management Tool (CMT) that: (i) informs visitors about pixel-based tracking; (ii) obtains prior consent where legally required; (iii) logs consent decisions with timestamps; and (iv) honors opt-outs and withdrawal of consent</li>
            <li><strong>Opt-out mechanism:</strong> Provide your website visitors with a clear, accessible means to opt out of visitor identification tracking</li>
            <li><strong>Legitimate basis:</strong> Ensure you have a lawful basis under applicable data protection law (such as GDPR legitimate interests or CCPA disclosure) for processing visitor identification data collected through the pixel</li>
          </ul>

          <h3>3.2 Conditional Pixel Activation</h3>
          <p>
            Where legally required, you must implement the pixel in a manner that only activates after a visitor
            has provided affirmative consent. We strongly recommend using a conditional tag loading approach
            (e.g., via Google Tag Manager or equivalent) that fires the pixel only after consent is granted.
            Failure to implement compliant consent management is your sole responsibility.
          </p>

          <h3>3.3 B2B Identification Scope</h3>
          <p>
            Our visitor identification services are intended solely for identifying business professionals
            and companies in a B2B context for legitimate business development purposes. Use of our services
            to target consumers for B2C marketing, to identify individuals in their personal capacity, or to
            engage in surveillance, profiling for discriminatory purposes, or any non-business use is strictly prohibited.
          </p>

          <h2>4. Acceptable Use of Lead Data</h2>

          <h3>4.1 Permitted Uses</h3>
          <p>You may use lead data and contact information obtained through our platform solely for:</p>
          <ul>
            <li>Direct B2B outreach to business professionals at their business email addresses or phone numbers</li>
            <li>Personalized marketing and sales campaigns targeting relevant business contacts</li>
            <li>Account-based marketing (ABM) and sales prospecting</li>
            <li>Enriching your existing CRM records with updated business information</li>
            <li>Building targeted audience segments for B2B advertising</li>
          </ul>

          <h3>4.2 Prohibited Uses</h3>
          <p>You may NOT use our platform or any data obtained through it to:</p>
          <ul>
            <li>Send unsolicited commercial email (spam) or violate the CAN-SPAM Act, CASL, or equivalent anti-spam laws</li>
            <li>Engage in robocalling or auto-dialing in violation of the TCPA or similar telemarketing laws</li>
            <li>Target individuals at personal (non-business) email addresses without explicit consent</li>
            <li>Harass, stalk, threaten, or engage in any form of discriminatory targeting</li>
            <li>Resell, sublicense, or redistribute raw lead data to third parties</li>
            <li>Build competing lead databases, scraping tools, or data products</li>
            <li>Use data to make employment, credit, housing, insurance, or other eligibility determinations</li>
            <li>Process sensitive personal data (health, financial, biometric, or similar) without explicit consent</li>
            <li>Engage in deceptive trade practices, impersonation, or fraudulent outreach</li>
            <li>Target individuals who have submitted opt-out or suppression requests</li>
          </ul>

          <h2>5. Anti-Spam and CAN-SPAM Compliance</h2>
          <p>
            All email communications sent using contact data from our platform must comply with the CAN-SPAM Act
            (15 U.S.C. § 7701 et seq.), CASL, and other applicable anti-spam laws. You agree to:
          </p>
          <ul>
            <li>Include accurate sender identification and a valid physical postal address in all commercial emails</li>
            <li>Use honest, non-deceptive subject lines that reflect the email&apos;s content</li>
            <li>Provide a clear, functional unsubscribe mechanism in every commercial email</li>
            <li>Honor unsubscribe requests within 10 business days</li>
            <li>Maintain an internal suppression list and honor opt-outs permanently</li>
            <li>Not send email to contacts who have previously opted out or unsubscribed from your communications</li>
          </ul>

          <h2>6. Data Processing and Privacy Compliance</h2>

          <h3>6.1 Your Responsibilities as a Data Controller</h3>
          <p>
            When you use our platform to collect, process, or contact individuals, you act as an independent
            data controller under applicable data protection laws (including GDPR and CCPA). You are responsible for:
          </p>
          <ul>
            <li>Establishing and documenting a lawful basis for all data processing activities</li>
            <li>Maintaining your own privacy policy that accurately describes your use of visitor identification and lead generation technologies</li>
            <li>Responding to data subject requests (access, deletion, rectification, portability) within legally required timeframes</li>
            <li>Ensuring your use of our services complies with all applicable data protection, privacy, and marketing laws in your jurisdiction and the jurisdictions of individuals you contact</li>
            <li>Implementing appropriate technical and organizational security measures to protect any data you receive from us</li>
          </ul>

          <h3>6.2 GDPR Compliance</h3>
          <p>
            If you process personal data of individuals in the European Economic Area, you acknowledge that:
            (a) you are a data controller and we act as your data processor for pixel-collected data;
            (b) you will enter into a Data Processing Agreement (DPA) with us upon request;
            (c) you will conduct and document a Legitimate Interests Assessment (LIA) or obtain explicit consent
            as required; and (d) you will not transfer EEA resident data outside the EEA without appropriate
            safeguards (Standard Contractual Clauses or equivalent).
          </p>

          <h3>6.3 CCPA Compliance</h3>
          <p>
            If you are subject to the California Consumer Privacy Act, you acknowledge that you must provide
            California residents with notice of data collection, the right to know, the right to delete,
            and the right to opt out of sale or sharing of personal information. We are not responsible for
            your CCPA compliance obligations.
          </p>

          <h2>7. Data Processing Agreement (DPA)</h2>
          <p>
            Upon your written request, Cursive will enter into a mutually agreed Data Processing Agreement
            consistent with Article 28 of the GDPR and applicable data protection law. The DPA governs
            our processing of personal data on your behalf and constitutes part of these Terms.
            To request a DPA, contact <a href="mailto:privacy@meetcursive.com" className="text-primary">privacy@meetcursive.com</a>.
          </p>

          <h2>8. Intellectual Property</h2>
          <p>
            All software, algorithms, databases, interfaces, documentation, and content comprising the Cursive
            platform are proprietary to Cursive and protected by copyright, trade secret, and other intellectual
            property laws. You receive a limited, non-exclusive, non-transferable license to use the platform
            solely as described in these Terms. You may not copy, reverse engineer, decompile, disassemble,
            or create derivative works from any part of our platform.
          </p>

          <h2>9. Data Rights and Ownership</h2>
          <p>
            As between you and Cursive: (a) you retain ownership of your customer data and CRM records;
            (b) lead and contact data purchased from our marketplace is licensed to you for use in accordance
            with these Terms; (c) pixel event data collected from your website is yours subject to our
            right to use it to provide and improve the services; and (d) Cursive retains ownership of
            all platform technology, aggregated/anonymized data, and improvements derived from platform usage.
          </p>

          <h2>10. Payment Terms</h2>
          <p>
            All fees are due as specified in your subscription plan or purchase order. Subscription fees
            are billed in advance and are non-refundable except as required by law. We reserve the right
            to suspend or terminate access for non-payment after reasonable notice. All fees are exclusive
            of applicable taxes, which are your responsibility.
          </p>

          <h2>11. Confidentiality</h2>
          <p>
            Each party agrees to keep confidential any non-public information disclosed by the other party
            that is identified as confidential or that reasonably should be understood to be confidential.
            This obligation does not apply to information that is publicly available, independently developed,
            or required to be disclosed by law.
          </p>

          <h2>12. Disclaimers and Data Accuracy</h2>
          <p>
            Our services are provided &ldquo;as is.&rdquo; We make no warranties regarding the accuracy, completeness,
            or currency of lead data, contact information, or visitor identification results. B2B data changes
            frequently; email addresses, phone numbers, and job titles may be outdated. You acknowledge that
            not all contacts identified by our visitor identification technology may be correctly attributed,
            and some identification results may be inaccurate. You are responsible for verifying data before
            relying on it for business decisions.
          </p>

          <h2>13. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Cursive shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, including lost profits, loss of data,
            or business interruption, arising from your use of or inability to use our services. Our total
            liability for any claim arising under these Terms shall not exceed the fees you paid to us in
            the three months preceding the claim.
          </p>

          <h2>14. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Cursive and its officers, directors, employees,
            and agents from any claims, damages, losses, or expenses (including reasonable attorneys&apos; fees)
            arising from: (a) your violation of these Terms; (b) your violation of any applicable law,
            including privacy and anti-spam laws; (c) your use of lead data in a manner not authorized by
            these Terms; (d) your failure to implement compliant consent management for the pixel; or
            (e) any claims by your website visitors, leads, or regulators arising from your data practices.
          </p>

          <h2>15. Term and Termination</h2>
          <p>
            These Terms remain in effect while you use our services. We may suspend or terminate your
            access immediately and without notice if we reasonably believe you have violated these Terms,
            engaged in prohibited uses, or if required by law. Upon termination, you must cease all use
            of the platform and destroy any lead data obtained through us within 30 days, unless a longer
            retention period is required by law.
          </p>

          <h2>16. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, without regard to conflict of
            law principles. Any dispute arising from these Terms shall first be addressed through good-faith
            negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration
            under the American Arbitration Association Commercial Arbitration Rules. Notwithstanding the
            foregoing, either party may seek emergency injunctive relief in any court of competent jurisdiction.
          </p>

          <h2>17. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will provide at least 14 days&apos; notice of
            material changes by email or prominent notice on our platform. Continued use of our services
            after the effective date of changes constitutes your acceptance of the updated Terms.
          </p>

          <h2>18. Contact</h2>
          <p>
            If you have questions about these Terms, wish to request a Data Processing Agreement, or need
            to report a compliance concern, please contact us:
          </p>
          <ul>
            <li>Legal &amp; Compliance: <a href="mailto:legal@meetcursive.com" className="text-primary hover:underline">legal@meetcursive.com</a></li>
            <li>Privacy requests: <a href="mailto:privacy@meetcursive.com" className="text-primary hover:underline">privacy@meetcursive.com</a></li>
            <li>General inquiries: <a href="mailto:hey@meetcursive.com" className="text-primary hover:underline">hey@meetcursive.com</a></li>
          </ul>
        </div>
      </Container>
    </main>
  )
}
