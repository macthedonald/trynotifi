'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Sparkles, Users, Zap } from 'lucide-react'

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'For personal use',
      icon: Sparkles,
      features: [
        { text: '10 active reminders', included: true },
        { text: '1 calendar connection', included: true },
        { text: 'Email & push notifications', included: true },
        { text: 'Basic AI chat (10/day)', included: true },
        { text: 'Mobile & web apps', included: true },
        { text: 'SMS notifications', included: false },
        { text: 'Location-based reminders', included: false },
        { text: 'Voice assistant', included: false },
        { text: 'Unlimited reminders', included: false },
      ],
      cta: 'Get Started',
      ctaLink: '/auth/signup',
      popular: false,
      gradient: 'from-gray-600 to-gray-700'
    },
    {
      name: 'Pro',
      price: { monthly: 8, yearly: 80 },
      description: 'For power users',
      icon: Zap,
      features: [
        { text: 'Unlimited reminders', included: true },
        { text: 'Unlimited calendar connections', included: true },
        { text: 'Email, push & SMS (50/mo)', included: true },
        { text: 'Unlimited AI chat + voice', included: true },
        { text: 'Location-based reminders', included: true },
        { text: '2-way calendar sync', included: true },
        { text: 'Priority support', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Share with 5 users', included: true },
      ],
      cta: 'Upgrade to Pro',
      ctaLink: '/auth/signup?plan=pro',
      popular: true,
      gradient: 'from-purple-600 to-pink-600'
    },
    {
      name: 'Team',
      price: { monthly: 15, yearly: 150 },
      description: 'Per user/month',
      icon: Users,
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Share with 50 teammates', included: true },
        { text: 'Team analytics dashboard', included: true },
        { text: 'Admin controls', included: true },
        { text: 'Dedicated support', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'SSO (coming soon)', included: true },
        { text: 'Priority feature requests', included: true },
      ],
      cta: 'Contact Sales',
      ctaLink: 'mailto:sales@notifi.app',
      popular: false,
      gradient: 'from-blue-600 to-cyan-600'
    }
  ]

  const faqs = [
    {
      question: 'Can I upgrade or downgrade at any time?',
      answer: 'Yes! You can change your plan anytime. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period.'
    },
    {
      question: 'What happens if I exceed my reminder limit on the Free plan?',
      answer: 'You can still view all your reminders, but you\'ll need to complete or delete some before creating new ones. Alternatively, you can upgrade to Pro for unlimited reminders.'
    },
    {
      question: 'Can I sync with multiple calendars?',
      answer: 'Free users can connect one calendar (Google or Outlook). Pro and Team users can connect unlimited calendars from both providers.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor Stripe.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use bank-level encryption (AES-256), never sell your data, and you can delete your account anytime with complete data removal.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes! If you\'re not satisfied within 30 days of subscribing, we\'ll refund you in full—no questions asked.'
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes. You can export all your reminders and settings as JSON or CSV anytime from your account settings.'
    },
    {
      question: 'What\'s the difference between sharing and team features?',
      answer: 'Sharing allows you to collaborate on specific reminders. Team plans add centralized management, team analytics, and admin controls for organizations.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      {/* Navigation */}
      <nav className="bg-white/40 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Notifi
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/auth/signin" className="text-gray-700 hover:text-purple-600 font-medium">
                Sign In
              </Link>
              <Link href="/auth/signup" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Simple Pricing. No Hidden Fees.
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start free. Upgrade when you're ready. All plans include our core features with no surprises.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={`font-medium ${billingPeriod === 'monthly' ? 'text-purple-600' : 'text-gray-600'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-14 h-7 bg-purple-600 rounded-full transition-all"
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
              billingPeriod === 'yearly' ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
          <span className={`font-medium ${billingPeriod === 'yearly' ? 'text-purple-600' : 'text-gray-600'}`}>
            Yearly
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Save 17%
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            return (
              <div
                key={index}
                className={`relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 transition-all hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-purple-600' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex p-3 bg-gradient-to-r ${plan.gradient} rounded-2xl mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-gray-900">
                      ${billingPeriod === 'monthly' ? plan.price.monthly : Math.floor(plan.price.yearly / 12)}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  {billingPeriod === 'yearly' && plan.price.yearly > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Billed ${plan.price.yearly}/year
                    </p>
                  )}
                </div>

                <Link
                  href={plan.ctaLink}
                  className={`block w-full py-3 px-6 rounded-xl font-medium text-center mb-6 transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12 text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-lg text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Never Miss What Matters?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Join thousands who've taken back control of their time
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Get Started Free
          </Link>
          <p className="text-purple-100 text-sm mt-4">
            Free forever • No credit card required • Upgrade anytime
          </p>
        </div>
      </div>
    </div>
  )
}
