'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Bell, Bot, ShieldCheck, Layers, Smartphone, Trophy, CheckCircle2, ArrowRight, Sparkles, Calendar, ChevronDown, UserPlus, MessageSquare, BellRing, Twitter, Linkedin, Instagram } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Marquee } from '@/components/ui/3d-testimonials'

// Testimonials data
const testimonials = [
  {
    name: 'Ava Green',
    username: '@avagreen',
    body: 'As a project manager handling 6 teams, Notifi keeps me on track. The calendar sync with Google is seamless, and I never miss a standup again.',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    country: '🇦🇺 Australia',
  },
  {
    name: 'Ana Miller',
    username: '@anamiller',
    body: 'The SMS reminders have been a game-changer for my consulting business. My clients love that I am always on time now. Worth every penny!',
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
    country: '🇩🇪 Germany',
  },
  {
    name: 'Mateo Rossi',
    username: '@mateorossi',
    body: 'I have tried dozens of reminder apps. Notifi is the only one that actually helps me stay productive. The AI chat assistant is brilliant!',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    country: '🇮🇹 Italy',
  },
  {
    name: 'Maya Patel',
    username: '@mayapatel',
    body: 'Managing a remote team across 4 time zones was chaos before Notifi. Now everyone gets reminders in their local time. Absolute lifesaver!',
    img: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=200&auto=format&fit=crop',
    country: '🇮🇳 India',
  },
  {
    name: 'Noah Smith',
    username: '@noahsmith',
    body: 'The location-based reminders are incredible. It reminds me to pick up groceries when I am near the store. This app just works like magic.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    country: '🇺🇸 USA',
  },
  {
    name: 'Lucas Stone',
    username: '@lucasstone',
    body: 'Switched my entire marketing agency to Notifi Pro. Team collaboration features are top-notch. Clients notice the difference in our responsiveness.',
    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop',
    country: '🇫🇷 France',
  },
  {
    name: 'Haruto Sato',
    username: '@harutosato',
    body: 'The offline mode saved me during my flight to London. I could still create and manage reminders without internet. Brilliant engineering!',
    img: 'https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=200&auto=format&fit=crop',
    country: '🇯🇵 Japan',
  },
  {
    name: 'Emma Lee',
    username: '@emmalee',
    body: 'I juggle work on my laptop, tablet, and phone daily. Notifi syncs perfectly across all devices. Finally, one source of truth for my schedule!',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    country: '🇨🇦 Canada',
  },
  {
    name: 'Carlos Ray',
    username: '@carlosray',
    body: 'Running a startup means wearing many hats. Notifi helps me remember everything from investor calls to team birthdays. Could not do it without this.',
    img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop',
    country: '🇪🇸 Spain',
  },
]

function TestimonialCard({ img, name, username, body, country }: (typeof testimonials)[number]) {
  return (
    <Card className="w-64 bg-white shadow-md border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={img} alt={name} />
            <AvatarFallback className="bg-gray-200 text-gray-700 font-semibold">{name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <figcaption className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              {name} <span className="text-xs">{country}</span>
            </figcaption>
            <p className="text-xs font-medium text-gray-500">@{username}</p>
          </div>
        </div>
        <blockquote className="text-sm leading-relaxed text-gray-700">{body}</blockquote>
      </CardContent>
    </Card>
  )
}

export default function Home() {
  const now = new Date()
  const month = now.toLocaleString('en-US', { month: 'long' })
  const day = now.getDate()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Embla Carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    dragFree: true
  })

  // Auto-scroll functionality
  useEffect(() => {
    if (!emblaApi) return

    const intervalId = setInterval(() => {
      emblaApi.scrollNext()
    }, 3000)

    return () => clearInterval(intervalId)
  }, [emblaApi])

  return (
    <div className="min-h-screen bg-white transition-colors duration-300 overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Notifi</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#product" className="hover:text-gray-900 transition-colors">Product</a>
              <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="hover:text-gray-900 transition-colors">Testimonials</a>
              <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/signin">
                <Button variant="ghost" className="font-semibold">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="font-semibold shadow-lg">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium */}
      <header id="product" className="relative min-h-[100dvh] md:min-h-[90vh] flex items-center px-4 sm:px-6 lg:px-16 overflow-hidden py-8 md:py-0">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="animate-slide-in-left text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 mb-6 shadow-sm border border-gray-200">
                <Sparkles className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-700" >AI-Powered Productivity</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black leading-tight mb-4 md:mb-6">
                <span className="text-gray-900">Never Miss</span>
                <br />
                <span className="text-gray-900">What Matters</span>
          </h1>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-6 md:mb-8 max-w-xl mx-auto lg:mx-0">
                Your intelligent reminder assistant that syncs seamlessly with your calendar, sends smart notifications, and keeps you on top of everything—effortlessly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8 justify-center lg:justify-start">
                <Link href="/auth/signup">
                  <Button size="lg" className="px-8 py-6 text-lg font-bold shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 group">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#how">
                  <Button variant="outline" size="lg" className="px-8 py-6 text-lg font-semibold hover:scale-105 transition-all">
                    See How It Works
              </Button>
            </Link>
          </div>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm text-gray-600 justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Free plan available</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            <div className="relative animate-slide-in-right flex items-center justify-center lg:mt-0">
              <div className="relative">
                {/* 3D Calendar Visual */}
                <div className="w-full max-w-md">
                  <div className="relative">
                    <div className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-gray-800 to-gray-600 rounded-[3rem] shadow-2xl transform rotate-6 flex items-center justify-center transition-all duration-700 hover:rotate-3 animate-float">
                      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 transform -rotate-6 transition-all duration-700 hover:-rotate-3 shadow-xl">
                        <div className="text-center">
                          <div className="text-xl md:text-2xl font-bold text-gray-700 mb-2 md:mb-3">{month}</div>
                          <div className="text-6xl md:text-8xl font-black text-gray-900">{day}</div>
                          <div className="mt-4 flex gap-2 justify-center">
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Floating badges */}
                    <div className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-200 animate-float" style={{animationDelay: '1s'}}>
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-gray-700" />
                        <span className="text-sm font-semibold text-gray-900">Smart Reminders</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-200 animate-float" style={{animationDelay: '2s'}}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-700" />
                        <span className="text-sm font-semibold text-gray-900">Calendar Sync</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Social Proof */}
      <section className="py-16 border-y border-gray-200 bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-16">
          <p className="text-center text-sm font-medium text-gray-500 mb-8">Trusted by teams at</p>

          {/* Mobile: Carousel */}
          <div className="md:hidden overflow-hidden" ref={emblaRef}>
            <div className="flex gap-8">
              {[
                { name: 'Google', logo: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png', width: 120 },
                { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/512px-Microsoft_logo.svg.png', width: 140 },
                { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/603px-Amazon_logo.svg.png', width: 100 },
                { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/505px-Apple_logo_black.svg.png', width: 40 },
                { name: 'Meta', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/512px-Meta_Platforms_Inc._logo.svg.png', width: 100 },
                { name: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/512px-Netflix_2015_logo.svg.png', width: 100 },
              ].map(company => (
                <div key={company.name} className="flex-[0_0_40%] min-w-0 flex items-center justify-center grayscale opacity-70">
                  <Image src={company.logo} alt={company.name} width={company.width} height={40} className="h-8 w-auto" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {[
              { name: 'Google', logo: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png', width: 120 },
              { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/512px-Microsoft_logo.svg.png', width: 140 },
              { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/603px-Amazon_logo.svg.png', width: 100 },
              { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/505px-Apple_logo_black.svg.png', width: 40 },
              { name: 'Meta', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/512px-Meta_Platforms_Inc._logo.svg.png', width: 100 },
              { name: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/512px-Netflix_2015_logo.svg.png', width: 100 },
            ].map(company => (
              <div key={company.name} className="flex items-center justify-center grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <Image src={company.logo} alt={company.name} width={company.width} height={40} className="h-8 w-auto" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - Ultra Modern */}
      <section className="py-24 px-4 sm:px-6 lg:px-16">
        <div className="w-full">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Why <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">10,000+ users</span> love Notifi
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              More than just reminders—it is your intelligent productivity companion
              </p>
            </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {[
              {
                title: 'Reclaim Your Mental Space',
                Icon: ShieldCheck,
                text: 'Stop carrying your to-do list in your head. Let Notifi remember everything so you can focus on what truly matters.',
                color: 'from-gray-800 to-gray-600'
              },
              {
                title: 'Never Drop the Ball',
                Icon: Bell,
                text: 'Smart, multi-channel alerts that reach you wherever you are—email, SMS, push. You will never miss what is important.',
                color: 'from-gray-700 to-gray-500'
              },
              {
                title: 'AI That Actually Helps',
                Icon: Bot,
                text: 'Just say "Remind me to call Sarah tomorrow at 2pm" and Notifi handles the rest. No typing, no menus.',
                color: 'from-gray-900 to-gray-700'
              },
              {
                title: 'Everything Unified',
                Icon: Layers,
                text: 'Google Calendar, Outlook events, and personal reminders all in one beautiful timeline. No more app-switching.',
                color: 'from-gray-800 to-gray-600'
              },
              {
                title: 'Build Better Habits',
                Icon: Trophy,
                text: 'Track streaks, celebrate wins, and see your progress. Gamification that actually motivates.',
                color: 'from-gray-700 to-gray-500'
              },
              {
                title: 'Works Everywhere',
                Icon: Smartphone,
                text: 'Web, iOS, Android. Start anywhere, get notified everywhere. Even works offline and syncs when you are back.',
                color: 'from-gray-900 to-gray-700'
              },
            ].map((b, i) => (
              <div key={b.title} className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:border-gray-300 hover:-translate-y-2">
                <div className={`w-14 h-14 bg-gradient-to-br ${b.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <b.Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{b.title}</h3>
                <p className="text-gray-600 leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Modern Timeline */}
      <section id="how" className="py-24 px-4 sm:px-6 lg:px-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">Get Started in 3 Simple Steps</h2>
            <p className="text-xl text-gray-600">From setup to your first reminder—in under 60 seconds</p>
          </div>

          <div className="space-y-8">
            {[
              {
                n: 1,
                title: 'Sign Up & Connect',
                text: 'Create your free account in seconds. Optionally connect your Google or Outlook calendar—no complicated setup required.',
                Icon: UserPlus,
                color: 'from-gray-800 to-gray-600'
              },
              {
                n: 2,
                title: 'Add Your First Reminder',
                text: 'Type naturally like "Call mom tomorrow at 3pm" or use voice on mobile. Notifi understands and schedules it instantly.',
                Icon: MessageSquare,
                color: 'from-gray-900 to-gray-700'
              },
              {
                n: 3,
                title: 'Relax & Get Notified',
                text: 'Choose how you want to be reminded—email, push, SMS, or all three. We will make sure you never miss it.',
                Icon: BellRing,
                color: 'from-gray-700 to-gray-500'
              },
            ].map(s => (
              <div key={s.n} className={`flex flex-col ${s.n % 2 === 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 bg-white rounded-3xl p-8 shadow-lg border border-gray-200 animate-scale-in`} style={{animationDelay: `${s.n * 100}ms`}}>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 text-white flex items-center justify-center font-black text-xl shadow-lg">
                      {s.n}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{s.title}</h3>
                  </div>
                  <p className="text-lg text-gray-600 leading-relaxed">{s.text}</p>
                </div>
                <div className="flex-shrink-0 w-full lg:w-80 flex items-center justify-center">
                  <div className={`w-64 h-64 rounded-3xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-2xl`}>
                    <s.Icon className="w-32 h-32 text-white strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/auth/signup">
              <Button size="lg" className="px-10 py-6 text-lg font-bold shadow-2xl hover:shadow-gray-500/50 animate-pulse-glow">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing - Premium Cards */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-16">
        <div className="w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Simple Pricing. <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">No Hidden Fees.</span>
            </h2>
            <p className="text-xl text-gray-600">Start free. Upgrade when you are ready.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-5xl font-black text-gray-900">$0</span>
                <span className="text-gray-600 font-semibold">/month</span>
              </div>
              <p className="text-gray-600 mb-6">Perfect for personal use</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">50 active reminders</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">1 calendar connection</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Email & push notifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Basic AI chat (10/day)</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="block">
                <Button variant="primary" className="w-full py-6 font-bold text-base">Get Started Free</Button>
              </Link>
            </div>

            {/* Pro - Featured */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl p-8 shadow-2xl transform scale-105 border-2 border-gray-700">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-gray-600 to-gray-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-5xl font-black text-white">$9</span>
                <span className="text-white/80 font-semibold">/month</span>
              </div>
              <p className="text-white/90 mb-6">For power users</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Unlimited reminders</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Unlimited calendars</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Email, push & SMS (50/mo)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Unlimited AI + voice</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Unlimited reminders</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Real-time calendar sync</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Priority support</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="block">
                <Button variant="secondary" className="w-full py-6 font-bold text-base shadow-xl">Get Started with Pro</Button>
              </Link>
            </div>

            {/* Team */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Team</h3>
              <div className="mb-6">
                <span className="text-5xl font-black text-gray-900">$29</span>
                <span className="text-gray-600 font-semibold">/month</span>
              </div>
              <p className="text-gray-600 mb-6">For small teams up to 10 members</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Everything in Pro</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Up to 10 team members</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Shared reminders & calendars</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Team activity dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Assign tasks to team members</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Dedicated email support</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="block">
                <Button variant="primary" className="w-full py-6 font-bold text-base">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - 3D Marquee Design */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-16 bg-gradient-to-b from-white to-gray-50">
        <div className="w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Loved by <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Productive People</span> Everywhere
            </h2>
            <div className="flex items-center justify-center gap-2 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-2 text-gray-900 font-bold">4.9/5 from 2,847 users</span>
            </div>
          </div>

          {/* 3D Testimonials Marquee */}
          <div className="flex items-center justify-center">
            <div className="border border-gray-200 rounded-lg relative flex h-96 w-full max-w-[900px] flex-row items-center justify-center overflow-hidden gap-1.5 bg-white/50 backdrop-blur-sm [perspective:300px]">
              <div
                className="flex flex-row items-center gap-4"
                style={{
                  transform:
                    'translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)',
                }}
              >
                {/* Vertical Marquee Column 1 (downwards) */}
                <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
                  {testimonials.map((review) => (
                    <TestimonialCard key={`col1-${review.username}`} {...review} />
                  ))}
                </Marquee>
                {/* Vertical Marquee Column 2 (upwards) */}
                <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
                  {testimonials.map((review) => (
                    <TestimonialCard key={`col2-${review.username}`} {...review} />
                  ))}
                </Marquee>
                {/* Vertical Marquee Column 3 (downwards) */}
                <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
                  {testimonials.map((review) => (
                    <TestimonialCard key={`col3-${review.username}`} {...review} />
                  ))}
                </Marquee>
                {/* Vertical Marquee Column 4 (upwards) */}
                <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
                  {testimonials.map((review) => (
                    <TestimonialCard key={`col4-${review.username}`} {...review} />
                  ))}
                </Marquee>
                {/* Gradient overlays */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-white/80"></div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white/80"></div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white/80"></div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white/80"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - Collapsible Accordion */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-16">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know</p>
            </div>

          <div className="space-y-3">
            {[
              {
                q: 'Do I need a credit card to start?',
                a: 'No! The Free plan requires no payment information. Start using Notifi immediately and upgrade to Pro or Team when you need more features.'
              },
              {
                q: 'Can I switch plans anytime?',
                a: 'Yes! Upgrade or downgrade your plan anytime. If you downgrade, you keep all your data and continue on the Free plan.'
              },
              {
                q: 'Can I sync with multiple calendars?',
                a: 'Yes! Pro users can connect unlimited Google and Outlook calendars. Free users can connect one calendar.'
              },
              {
                q: 'How do location-based reminders work?',
                a: 'Set a location and radius in the mobile app. When you arrive or leave, Notifi sends you a reminder. Perfect for "Buy milk when near grocery store."'
              },
              {
                q: 'Is my data secure?',
                a: 'Absolutely. We use bank-level encryption, never sell your data, and you can delete your account anytime with complete data removal.'
              },
              {
                q: 'Do you offer refunds?',
                a: "Yes! If you are not happy within 30 days of subscribing, we will refund you in full—no questions asked."
              },
            ].map((f, i) => (
              <div key={f.q} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-bold text-gray-900 text-lg pr-4">{f.q}</h3>
                  <ChevronDown className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </div>
            ))}
              </div>

          <div className="text-center mt-10">
              <p className="text-gray-600">
              Still have questions?{' '}
              <a href="#contact" className="font-bold text-gray-900 hover:text-gray-700 transition-colors">
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA - Premium */}
      <section className="py-24 px-4 sm:px-6 lg:px-16">
        <div className="w-full max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-[3rem] p-12 lg:p-16 shadow-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 text-center">
              <h2 className="text-4xl lg:text-6xl font-black text-white mb-4">
                Ready to Never Miss What Matters?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands who have taken back control of their time
              </p>
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="px-12 py-6 text-lg font-bold shadow-2xl hover:scale-105 transition-transform">
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <p className="text-white/70 text-sm mt-4">Free plan available • No credit card required • Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Modern */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-16 py-16">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">N</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Notifi</span>
              </div>
              <p className="text-gray-600 mb-6 max-w-xs">
                AI-powered reminders that sync with your life. Never miss what matters.
              </p>
              <div className="flex gap-3">
                <a href="https://twitter.com/notifi" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-900 hover:text-white text-gray-700 flex items-center justify-center transition-all">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com/company/notifi" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-900 hover:text-white text-gray-700 flex items-center justify-center transition-all">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="https://instagram.com/notifi" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-900 hover:text-white text-gray-700 flex items-center justify-center transition-all">
                  <Instagram className="w-5 h-5" />
                </a>
            </div>
          </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#product" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Mobile Apps</a></li>
                <li><Link href="/integrations" className="hover:text-gray-900 transition-colors">Integrations</Link></li>
                </ul>
              </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-3 text-gray-600">
                <li><Link href="/help" className="hover:text-gray-900 transition-colors">Help Center</Link></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Community</a></li>
              </ul>
                </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-gray-600">
                <li><Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Security</a></li>
                </ul>
              </div>
            </div>

          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">© 2025 Notifi. All rights reserved.</p>
            <p className="text-gray-500 text-sm">Made with ❤️ for productive people everywhere</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

