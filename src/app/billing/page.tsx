'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { CreditCard, Check, AlertCircle, Calendar, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  // Mock data - replace with actual Supabase queries
  const currentPlan = user?.plan || 'free'
  const billingCycle = 'monthly' // or 'yearly'
  const nextBillingDate = new Date('2025-02-01')
  const invoices = [
    { id: '1', date: '2025-01-01', amount: 8.00, status: 'paid', downloadUrl: '#' },
    { id: '2', date: '2024-12-01', amount: 8.00, status: 'paid', downloadUrl: '#' },
    { id: '3', date: '2024-11-01', amount: 8.00, status: 'paid', downloadUrl: '#' },
  ]

  const plans = {
    free: {
      name: 'Free',
      price: 0,
      features: ['10 active reminders', '1 calendar connection', 'Email & push notifications', 'Basic AI chat']
    },
    pro: {
      name: 'Pro',
      price: 8,
      features: ['Unlimited reminders', 'Unlimited calendars', 'SMS notifications', 'AI voice assistant', 'Location reminders']
    },
    team: {
      name: 'Team',
      price: 15,
      features: ['Everything in Pro', 'Share with 50 teammates', 'Team analytics', 'Priority support']
    }
  }

  const handleUpgrade = async (plan: string) => {
    setLoading(true)
    try {
      // Determine price ID based on plan
      const priceId = plan === 'pro'
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, plan }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  const handleCancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your subscription? You\'ll retain access until the end of your billing period.')) {
      setLoading(true)
      // TODO: Implement cancel subscription logic via API
      alert('Subscription cancelled. Access will continue until ' + nextBillingDate.toLocaleDateString())
      setLoading(false)
    }
  }

  const handleManagePayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No portal URL returned')
      }
    } catch (error) {
      console.error('Error opening portal:', error)
      alert('Failed to open billing portal. Please try again.')
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <div className="flex h-screen flex-col lg:flex-row">
        {/* Sidebar */}
        <div className={`hidden lg:block lg:relative lg:z-auto transition-all duration-300 ease-in-out p-6 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}>
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Billing & Subscription
              </h1>
              <p className="text-gray-600">Manage your plan, payment method, and billing history</p>
            </div>

            {/* Current Plan Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Current Plan</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {plans[currentPlan as keyof typeof plans].name}
                    </span>
                    {currentPlan !== 'free' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    ${plans[currentPlan as keyof typeof plans].price}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentPlan === 'free' ? 'Forever' : `per ${billingCycle === 'monthly' ? 'month' : 'year'}`}
                  </div>
                </div>
              </div>

              {currentPlan !== 'free' && (
                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl mb-6">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-900">
                    Next billing date: <strong>{nextBillingDate.toLocaleDateString()}</strong>
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Plan Features:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {plans[currentPlan as keyof typeof plans].features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {currentPlan === 'free' && (
                  <button
                    onClick={() => handleUpgrade('pro')}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    Upgrade to Pro
                  </button>
                )}
                {currentPlan === 'pro' && (
                  <>
                    <button
                      onClick={() => handleUpgrade('team')}
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      Upgrade to Team
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      disabled={loading}
                      className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      Cancel Subscription
                    </button>
                  </>
                )}
                {currentPlan !== 'free' && (
                  <button
                    onClick={handleManagePayment}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Manage Payment Method
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Compare Plans */}
            {currentPlan === 'free' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Compare Plans</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900">Free</th>
                        <th className="text-center py-3 px-4 font-semibold text-purple-600">Pro</th>
                        <th className="text-center py-3 px-4 font-semibold text-blue-600">Team</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">Active Reminders</td>
                        <td className="text-center py-3 px-4">10</td>
                        <td className="text-center py-3 px-4 font-semibold">Unlimited</td>
                        <td className="text-center py-3 px-4 font-semibold">Unlimited</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">Calendar Connections</td>
                        <td className="text-center py-3 px-4">1</td>
                        <td className="text-center py-3 px-4 font-semibold">Unlimited</td>
                        <td className="text-center py-3 px-4 font-semibold">Unlimited</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">SMS Notifications</td>
                        <td className="text-center py-3 px-4"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                        <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                        <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">AI Chat Messages</td>
                        <td className="text-center py-3 px-4">10/day</td>
                        <td className="text-center py-3 px-4 font-semibold">Unlimited</td>
                        <td className="text-center py-3 px-4 font-semibold">Unlimited</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">Sharing</td>
                        <td className="text-center py-3 px-4"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                        <td className="text-center py-3 px-4">5 users</td>
                        <td className="text-center py-3 px-4 font-semibold">50 users</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 text-center">
                  <Link href="/pricing" className="text-purple-600 hover:underline font-medium">
                    View full pricing comparison →
                  </Link>
                </div>
              </div>
            )}

            {/* Billing History */}
            {currentPlan !== 'free' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-700">
                            {new Date(invoice.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-gray-900 font-medium">
                            ${invoice.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              {invoice.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="text-purple-600 hover:text-purple-700 flex items-center gap-2 ml-auto">
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
