import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6">
            <span className="text-6xl font-black text-purple-600">404</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4">
            Page Not Found
          </h1>

          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/dashboard">
            <Button size="lg" className="px-8 py-6 font-bold shadow-lg">
              <Home className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" size="lg" className="px-8 py-6 font-semibold">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Search className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Helpful Links</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <Link href="/dashboard" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/profile" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
              Profile
            </Link>
            <Link href="/dashboard/schedule" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
              Schedule
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-sm text-gray-500 mt-8">
          Need help? <a href="#" className="text-purple-600 hover:underline font-semibold">Contact support</a>
        </p>
      </div>
    </div>
  )
}
