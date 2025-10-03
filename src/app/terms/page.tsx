import Link from 'next/link'

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-600 mb-8">Last Updated: January 2, 2025</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing and using Notifi ("Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Notifi provides a SaaS platform for reminder management, calendar synchronization, and AI-powered productivity assistance. The Service is accessible via web and mobile applications.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your information to keep it accurate and current</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept all responsibility for activity that occurs under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must be at least 18 years old to create an account and use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Distribute spam, malware, or other harmful code</li>
                <li>Attempt to gain unauthorized access to the Service or related systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems to access the Service without authorization</li>
                <li>Resell or redistribute the Service without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Subscription Plans and Billing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Free Plan:</strong> Available at no cost with limited features as described on our pricing page.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Paid Plans:</strong> Pro and Team plans are billed monthly or annually based on your selection. By subscribing:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>You authorize us to charge your payment method on a recurring basis</li>
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>Prices are subject to change with 30 days notice</li>
                <li>You can upgrade or downgrade your plan at any time</li>
                <li>Downgrades take effect at the end of your current billing period</li>
                <li>No refunds for partial months or unused portions</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Refund Policy:</strong> If you're not satisfied within 30 days of your first subscription payment, contact us for a full refund.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data and Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your use of the Service is also governed by our <Link href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>. By using the Service, you consent to the collection and use of your data as described in the Privacy Policy.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You retain all rights to your data. We claim no intellectual property rights over the content you provide to the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Integrations</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service integrates with third-party services such as Google Calendar, Microsoft Outlook, and payment processors. Your use of these integrations is subject to the respective third party's terms of service.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We are not responsible for the availability, content, or practices of third-party services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service and its original content, features, and functionality are owned by Notifi and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may not copy, modify, distribute, sell, or lease any part of our Service without our express written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may cancel your account at any time through the account settings. Upon cancellation:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Your subscription will not renew</li>
                <li>You retain access until the end of your current billing period</li>
                <li>Your data will be retained for 30 days before permanent deletion</li>
                <li>You can export your data before deletion</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to suspend or terminate your account if you violate these Terms of Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                IN NO EVENT SHALL NOTIFI BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service. Your continued use of the Service after changes become effective constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Notifi operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about these Terms, please contact us at:
              </p>
              <p className="text-gray-700 leading-relaxed">
                Email: <a href="mailto:legal@notifi.app" className="text-purple-600 hover:underline">legal@notifi.app</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
