export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 2025</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Cursive platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. Description of Service</h2>
            <p>
              Cursive provides a lead generation and management platform that delivers business contact data, enrichment tools, and outreach capabilities to subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. Account Responsibilities</h2>
            <p>
              You are responsible for maintaining the security of your account and password. You must not share your credentials. You are responsible for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. Acceptable Use</h2>
            <p>
              You agree not to use the Service for spamming, harassment, or any illegal purpose. Lead data provided must be used in compliance with applicable laws including CAN-SPAM, GDPR, and CCPA.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. Credits and Billing</h2>
            <p>
              Credits are consumed when enriching leads or performing certain actions. Unused credits may expire per your plan terms. Subscription fees are billed through Stripe and are non-refundable except as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. Data Accuracy</h2>
            <p>
              While we strive for accuracy, we do not guarantee that all lead data will be 100% accurate or current. Data is provided &quot;as-is&quot; and you should verify critical information independently.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Cursive shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">8. Modifications</h2>
            <p>
              We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">9. Contact</h2>
            <p>
              For questions about these terms, contact us at support@meetcursive.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
