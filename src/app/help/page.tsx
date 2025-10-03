'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useRouter } from 'next/navigation'
import {
  HelpCircle,
  Book,
  MessageSquare,
  Mail,
  FileText,
  Video,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Lightbulb,
  Zap,
  Shield,
  Calendar,
  Bell,
  Users,
  CreditCard
} from 'lucide-react'
import { Input } from '@/components/ui/Input'

export default function HelpPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

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

  const categories = [
    {
      title: 'Getting Started',
      icon: <Lightbulb className="w-6 h-6" />,
      color: 'from-yellow-100 to-yellow-50',
      iconColor: 'text-yellow-600',
      articles: [
        'How to create your first reminder',
        'Setting up calendar sync',
        'Understanding notification channels',
        'Quick start guide'
      ]
    },
    {
      title: 'Features',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-purple-100 to-purple-50',
      iconColor: 'text-purple-600',
      articles: [
        'Using the AI assistant',
        'Creating recurring reminders',
        'Location-based reminders',
        'Team collaboration'
      ]
    },
    {
      title: 'Calendar & Events',
      icon: <Calendar className="w-6 h-6" />,
      color: 'from-blue-100 to-blue-50',
      iconColor: 'text-blue-600',
      articles: [
        'Syncing with Google Calendar',
        'Connecting Outlook calendar',
        'Managing calendar events',
        'Two-way sync explained'
      ]
    },
    {
      title: 'Notifications',
      icon: <Bell className="w-6 h-6" />,
      color: 'from-green-100 to-green-50',
      iconColor: 'text-green-600',
      articles: [
        'Email notification setup',
        'SMS alerts (Pro feature)',
        'Push notification settings',
        'Notification troubleshooting'
      ]
    },
    {
      title: 'Account & Billing',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'from-pink-100 to-pink-50',
      iconColor: 'text-pink-600',
      articles: [
        'Upgrading to Pro/Premium',
        'Managing your subscription',
        'Billing and invoices',
        'Cancellation policy'
      ]
    },
    {
      title: 'Privacy & Security',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-red-100 to-red-50',
      iconColor: 'text-red-600',
      articles: [
        'Data privacy and protection',
        'Two-factor authentication',
        'GDPR compliance',
        'Data export and deletion'
      ]
    }
  ]

  const faqs = [
    {
      question: 'How do I create a reminder?',
      answer: 'You can create a reminder by clicking the "+" button on the dashboard, or by chatting with the AI assistant. Simply tell the assistant what you need to be reminded about and when, and it will create it for you.'
    },
    {
      question: 'Can I sync my Google Calendar?',
      answer: 'Yes! Go to Settings > Integrations and connect your Google account. Once connected, Notifi will automatically sync your calendar events and you can create reminders that appear in both places.'
    },
    {
      question: 'What\'s the difference between Free and Pro plans?',
      answer: 'The Free plan includes unlimited reminders, email notifications, and basic calendar sync. Pro adds SMS notifications, location-based reminders, priority support, and advanced AI features. Premium includes everything plus team collaboration and custom integrations.'
    },
    {
      question: 'How do SMS notifications work?',
      answer: 'SMS notifications are available on Pro and Premium plans. Once enabled in Settings > Notifications, you\'ll receive text message alerts for your reminders. Standard SMS rates may apply depending on your carrier.'
    },
    {
      question: 'Can I use Notifi offline?',
      answer: 'Yes! The mobile app supports offline mode. You can create and view reminders without an internet connection, and they\'ll sync automatically when you\'re back online.'
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription anytime from Settings > Account > Manage Subscription. You\'ll continue to have access to Pro features until the end of your billing period.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use industry-standard encryption for all data transmission and storage. Your data is never shared with third parties without your explicit consent. Read our Privacy Policy for more details.'
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes! Go to Settings > Account > Export Data to download all your reminders, conversations, and settings in JSON format. This ensures you always have a copy of your data.'
    }
  ]

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <div className="flex h-screen flex-col lg:flex-row">
        {/* Sidebar - Hidden on mobile */}
        <div className={`hidden lg:block lg:relative lg:z-auto transition-all duration-300 ease-in-out p-6 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}>
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <HelpCircle className="w-8 h-8 lg:w-10 lg:h-10" />
                Help Center
              </h1>
              <p className="text-gray-600">Find answers, learn about features, and get support</p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-white/60 backdrop-blur-sm text-lg py-6"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <a
                href="mailto:support@notifi.app"
                className="flex items-center gap-4 p-6 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Email Support</div>
                  <div className="text-sm text-gray-600">Get help via email</div>
                </div>
              </a>

              <a
                href="#"
                className="flex items-center gap-4 p-6 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Live Chat</div>
                  <div className="text-sm text-gray-600">Chat with support</div>
                </div>
              </a>

              <a
                href="#"
                className="flex items-center gap-4 p-6 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Video Tutorials</div>
                  <div className="text-sm text-gray-600">Watch and learn</div>
                </div>
              </a>
            </div>

            {/* Categories */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className={`bg-gradient-to-br ${category.color} rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`${category.iconColor}`}>
                        {category.icon}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{category.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {category.articles.map((article, i) => (
                        <li key={i}>
                          <a
                            href="#"
                            className="text-sm text-gray-700 hover:text-gray-900 flex items-center gap-2 group"
                          >
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            {article}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Book className="w-6 h-6" />
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-white/40 transition-all"
                    >
                      <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                      {expandedFaq === index ? (
                        <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="px-6 pb-6">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Documentation Links */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-6 lg:p-8 border border-white/40 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Resources</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="#"
                  className="flex items-center justify-between p-4 bg-white/60 hover:bg-white/80 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">API Documentation</div>
                      <div className="text-sm text-gray-600">For developers</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </a>

                <a
                  href="#"
                  className="flex items-center justify-between p-4 bg-white/60 hover:bg-white/80 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Community Forum</div>
                      <div className="text-sm text-gray-600">Ask questions</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </a>

                <a
                  href="#"
                  className="flex items-center justify-between p-4 bg-white/60 hover:bg-white/80 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Release Notes</div>
                      <div className="text-sm text-gray-600">What's new</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </a>

                <a
                  href="#"
                  className="flex items-center justify-between p-4 bg-white/60 hover:bg-white/80 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Privacy Policy</div>
                      <div className="text-sm text-gray-600">Your data rights</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </a>
              </div>
            </div>

            {/* Contact Support */}
            <div className="mt-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 lg:p-8 text-white shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Still need help?</h3>
                  <p className="text-purple-100 mb-4">
                    Can't find what you're looking for? Our support team is here to help you.
                  </p>
                  <a
                    href="mailto:support@notifi.app"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all shadow-lg"
                  >
                    <Mail className="w-5 h-5" />
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      <div className="lg:hidden h-20"></div>
    </div>
  )
}
