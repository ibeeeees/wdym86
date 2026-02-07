import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowLeft,
  Monitor,
  BrainCircuit,
  CloudLightning,
  Building2,
  TrendingUp,
  Wallet,
  UsersRound,
  PackageSearch,
  Sparkles,
} from 'lucide-react'

const features = [
  {
    icon: Monitor,
    title: 'NCR Voyix Integration',
    desc: 'Seamlessly sync real POS data from the platforms you already use. WDYM86 connects with Aloha, Toast, Square, and Clover to pull live transaction data, menu items, and sales metrics directly into the platform -- no manual entry required.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BrainCircuit,
    title: 'AI Inventory Intelligence',
    desc: 'Our ground-up NumPy Temporal Convolutional Network (TCN) forecasts demand with Negative Binomial distributions, predicts stockouts before they happen, and triggers auto-reorder suggestions so you never run out of critical ingredients.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: CloudLightning,
    title: 'Gemini-Powered Disruptions',
    desc: 'Leverage Google Gemini to simulate and prepare for real-world disruptions. Weather events, traffic delays, and supply chain interruptions are modeled in real time so your restaurant stays ahead of the unexpected.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Building2,
    title: 'Multi-Restaurant Management',
    desc: 'Manage up to 6 locations from a single unified dashboard. Role-based access control lets admins, managers, and POS staff see exactly what they need -- nothing more, nothing less.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: TrendingUp,
    title: 'Analytics & Timeline',
    desc: 'Track revenue over time, identify your most popular dishes, and uncover seasonal trends with interactive charts. The timeline view gives you a historical lens into every metric that matters.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: Wallet,
    title: 'Solana Pay',
    desc: 'Accept cryptocurrency payments with Solana Pay integration. Fast, low-fee transactions give your customers a modern payment option while keeping your settlement times near-instant.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: UsersRound,
    title: 'Team & Floor Plan Management',
    desc: 'Schedule staff shifts, assign servers to tables on a visual floor plan, and manage payroll -- all from one place. Drag-and-drop table layouts make floor management intuitive and fast.',
    color: 'from-sky-500 to-blue-500',
  },
  {
    icon: PackageSearch,
    title: 'Supplier Intelligence',
    desc: 'Evaluate suppliers by lead time, reliability score, and cost. WDYM86 surfaces smart suggestions for alternative vendors and flags suppliers whose performance is slipping before it impacts your kitchen.',
    color: 'from-teal-500 to-green-500',
  },
]

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 transition-colors">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-black" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 text-white/70 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Login</span>
          </Link>

          <div className="flex justify-center mb-8">
            <img
              src="/logo.jpg"
              alt="wdym86"
              className="w-24 h-24 rounded-2xl shadow-2xl shadow-black/40 object-cover"
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            How{' '}
            <span className="bg-gradient-to-r from-amber-200 via-orange-200 to-pink-200 bg-clip-text text-transparent">
              WDYM86
            </span>{' '}
            Works
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            AI-powered restaurant intelligence that connects your POS, forecasts demand, manages disruptions, and keeps your kitchen running at peak efficiency.
          </p>

          <div className="mt-8 flex items-center justify-center space-x-2 text-white/50 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Built with NumPy TCN, Gemini, and Solana</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div
                className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="bg-gradient-to-br from-red-600 via-red-700 to-black rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your restaurant?
          </h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            Try the interactive demo with no account required, or sign up to connect your POS and start forecasting today.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-red-700 font-bold rounded-2xl hover:bg-neutral-100 transition-all shadow-xl hover:scale-[1.03]"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
