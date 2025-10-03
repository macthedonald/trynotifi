import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      {/* Navigation */}
      <nav className="bg-white/40 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Notifi
            </Link>
            <Link href="/" className="text-gray-700 hover:text-purple-600 font-medium">
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 lg:p-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">Last Updated: January 2, 2025</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                At Notifi, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our reminder and calendar management service.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                By using Notifi, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Account Information:</strong> Email address, name, password (encrypted)</li>
                <li><strong>Reminder Data:</strong> Titles, descriptions, dates, times, priorities, tags, and notification preferences</li>
                <li><strong>Profile Information:</strong> Avatar, timezone, notification preferences</li>
                <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store credit card details)</li>
                <li><strong>Communication Data:</strong> Messages sent through our AI assistant, support tickets</li>
              </ul>

              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Usage Data:</strong> Features used, actions taken, time spent, pages visited</li>
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                <li><strong>Log Data:</strong> IP address, access times, errors encountered</li>
                <li><strong>Cookies:</strong> Authentication tokens, preferences, analytics data</li>
              </ul>

              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">2.3 Information from Third Parties</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Calendar Data:</strong> Events from Google Calendar and Microsoft Outlook (when you connect your calendars)</li>
                <li><strong>OAuth Providers:</strong> Email and profile information when you sign in with Google or Microsoft</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the collected information for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Service Delivery:</strong> Create and manage reminders, sync calendars, send notifications</li>
                <li><strong>AI Features:</strong> Process natural language queries, provide intelligent suggestions</li>
                <li><strong>Account Management:</strong> Authentication, password resets, account settings</li>
                <li><strong>Communication:</strong> Send transactional emails, notifications, and updates</li>
                <li><strong>Improvement:</strong> Analyze usage patterns to improve features and user experience</li>
                <li><strong>Support:</strong> Respond to your questions and provide customer service</li>
                <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security incidents</li>
                <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (Supabase for hosting, Resend for emails, Twilio for SMS, OpenAI for AI features, Stripe for payments)</li>
                <li><strong>Collaboration:</strong> Users you explicitly share reminders with</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> Any other purposes disclosed to you at the time of collection or with your consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                <li><strong>Authentication:</strong> Secure password hashing with bcrypt, optional two-factor authentication</li>
                <li><strong>Access Controls:</strong> Role-based access and row-level security policies</li>
                <li><strong>Monitoring:</strong> Continuous security monitoring and regular security audits</li>
                <li><strong>Backups:</strong> Daily automated backups with 30-day retention</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                While we strive to protect your data, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Privacy Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your data in JSON or CSV format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails (transactional emails cannot be disabled)</li>
                <li><strong>Object:</strong> Object to processing of your data for certain purposes</li>
                <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                To exercise these rights, contact us at <a href="mailto:privacy@notifi.app" className="text-purple-600 hover:underline">privacy@notifi.app</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We retain your information for as long as necessary to provide our services and comply with legal obligations:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
                <li><strong>Deleted Accounts:</strong> Data permanently deleted within 30 days of account deletion</li>
                <li><strong>Backups:</strong> Backup copies deleted after 30 days</li>
                <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar technologies for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Essential Cookies:</strong> Authentication, security, preferences (required)</li>
                <li><strong>Analytics Cookies:</strong> Usage statistics to improve our service (can be disabled)</li>
                <li><strong>Third-Party Cookies:</strong> Google Analytics, payment processors</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can control cookies through your browser settings, but disabling certain cookies may affect functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our service is not directed to individuals under 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Third-Party Links</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Updating the "Last Updated" date</li>
                <li>Sending an email to your registered email address</li>
                <li>Displaying a notice in the application</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your continued use of the service after changes become effective constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. GDPR Compliance (EU Users)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you are in the European Economic Area (EEA), you have additional rights under GDPR:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Legal basis for processing: Consent, contract performance, legitimate interests</li>
                <li>Right to withdraw consent at any time</li>
                <li>Right to lodge a complaint with a supervisory authority</li>
                <li>Data processing agreements with third-party processors</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. CCPA Compliance (California Users)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                California residents have specific rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Right to know what personal information is collected</li>
                <li>Right to know if personal information is sold or disclosed</li>
                <li>Right to opt-out of sale of personal information (we do not sell data)</li>
                <li>Right to deletion of personal information</li>
                <li>Right to non-discrimination for exercising CCPA rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                Email: <a href="mailto:privacy@notifi.app" className="text-purple-600 hover:underline">privacy@notifi.app</a>
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                Data Protection Officer: <a href="mailto:dpo@notifi.app" className="text-purple-600 hover:underline">dpo@notifi.app</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
