export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 2025</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide when creating an account (name, email, business information), data generated through your use of the platform (lead interactions, enrichment history), and standard usage analytics.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
            <p>
              Your information is used to provide and improve the Service, deliver leads matching your targeting preferences, process payments, send transactional emails, and provide customer support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. Lead Data</h2>
            <p>
              Lead data provided through the platform is sourced from publicly available business information and third-party data providers. This data is intended for legitimate business-to-business communications only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit and at rest, access controls, and regular security reviews to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. Third-Party Services</h2>
            <p>
              We use third-party services including Supabase (database), Stripe (payments), and analytics tools. These services have their own privacy policies governing their use of data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Lead data and enrichment results are retained per your workspace settings. You may request deletion of your data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. You may also request a copy of your data or opt out of marketing communications at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We do not use third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">9. Contact</h2>
            <p>
              For privacy inquiries, contact us at support@meetcursive.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
