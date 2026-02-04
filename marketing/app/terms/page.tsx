import { Container } from "@/components/ui/container"

export default function TermsPage() {
  return (
    <main className="py-24">
      <Container>
        <div className="max-w-4xl mx-auto prose prose-lg">
          <h1 className="text-5xl font-bold mb-4">
            Terms of <span className="font-cursive text-primary">Service</span>
          </h1>

          <p className="text-gray-600 mb-8">Last updated: February 4, 2026</p>

          <p>
            By accessing or using Cursive's services, you agree to be bound by these Terms of Service.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Cursive's platform and services, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on Cursive's platform for personal, non-commercial transitory viewing only.
          </p>

          <h2>3. Disclaimer</h2>
          <p>
            The materials on Cursive's platform are provided on an 'as is' basis. Cursive makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2>4. Limitations</h2>
          <p>
            In no event shall Cursive or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Cursive's platform.
          </p>

          <h2>5. Accuracy of Materials</h2>
          <p>
            The materials appearing on Cursive's platform could include technical, typographical, or photographic errors. Cursive does not warrant that any of the materials on its platform are accurate, complete or current.
          </p>

          <h2>6. Links</h2>
          <p>
            Cursive has not reviewed all of the sites linked to its platform and is not responsible for the contents of any such linked site.
          </p>

          <h2>7. Modifications</h2>
          <p>
            Cursive may revise these terms of service for its platform at any time without notice. By using this platform you are agreeing to be bound by the then current version of these terms of service.
          </p>

          <h2>8. Contact</h2>
          <p>
            If you have any questions about these Terms, please contact us at{" "}
            <a href="mailto:support@meetcursive.com" className="text-primary hover:underline">
              support@meetcursive.com
            </a>
          </p>
        </div>
      </Container>
    </main>
  )
}
