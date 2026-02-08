import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, Key, Settings, Clock, Activity, Crown, Copy, ExternalLink, Shield, Calendar, TrendingUp, TrendingDown, AlertTriangle, Target, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePOS } from '../context/POSContext'
import { getCuisineTemplate } from '../data/cuisineTemplates'

// ==========================================
// Daily Projections Logic
// ==========================================

interface DailyProjection {
  date: string
  projectedSales: number
  projectedOrders: number
  actualSales: number
  actualOrders: number
  salesPercentage: number
  ordersPercentage: number
  status: 'exceeding' | 'on_track' | 'below' | 'critical'
  topDishes: { name: string; orders: number }[]
}

// Deterministic seeded random based on date string
function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs((Math.sin(hash) * 10000) % 1)
}

function generateDailyProjections(cuisineType: string, dailyStats: { totalSales: number; totalOrders: number }): DailyProjection {
  const template = getCuisineTemplate(cuisineType)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const dateStr = now.toISOString().slice(0, 10)

  // Day-of-week demand multipliers (Sun=0 through Sat=6)
  const demandMultipliers = [0.75, 0.80, 0.85, 0.90, 1.15, 1.30, 1.00]
  const baseSales = 4200
  const baseOrders = 127

  const projectedSales = Math.round(baseSales * demandMultipliers[dayOfWeek])
  const projectedOrders = Math.round(baseOrders * demandMultipliers[dayOfWeek])

  // Use live POS data if available, otherwise deterministic demo values
  let actualSales: number
  let actualOrders: number

  if (dailyStats.totalOrders > 0) {
    actualSales = dailyStats.totalSales
    actualOrders = dailyStats.totalOrders
  } else {
    // Deterministic demo values seeded by date (stable across re-renders)
    const rand = seededRandom(dateStr)
    const hour = now.getHours()
    // Scale actuals based on time of day (0-23) to simulate day progress
    const dayProgress = Math.min(hour / 16, 1) // Assume 16-hour operating day
    const performanceFactor = 0.78 + rand * 0.35 // 78% to 113%
    actualSales = Math.round(projectedSales * performanceFactor * dayProgress)
    actualOrders = Math.round(projectedOrders * performanceFactor * dayProgress)
  }

  const salesPercentage = projectedSales > 0 ? Math.round((actualSales / projectedSales) * 100) : 0
  const ordersPercentage = projectedOrders > 0 ? Math.round((actualOrders / projectedOrders) * 100) : 0

  let status: DailyProjection['status']
  if (salesPercentage >= 100) status = 'exceeding'
  else if (salesPercentage >= 90) status = 'on_track'
  else if (salesPercentage >= 70) status = 'below'
  else status = 'critical'

  const topDishes = (template.topDishesToday || []).slice(0, 3).map((d: { name: string; orders: number }) => ({
    name: d.name,
    orders: d.orders,
  }))

  return {
    date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    projectedSales,
    projectedOrders,
    actualSales,
    actualOrders,
    salesPercentage,
    ordersPercentage,
    status,
    topDishes,
  }
}

// ==========================================
// SVG Arc Gauge Component
// ==========================================

function ArcGauge({ percentage, status }: { percentage: number; status: DailyProjection['status'] }) {
  const clampedPct = Math.min(percentage, 150)
  const radius = 60
  const strokeWidth = 10
  const circumference = Math.PI * radius // semicircle
  const offset = circumference - (circumference * Math.min(clampedPct, 100)) / 100

  const gradientId = `gauge-gradient-${status}`
  const colors = {
    exceeding: { start: '#6366f1', end: '#8b5cf6' },
    on_track: { start: '#10b981', end: '#059669' },
    below: { start: '#f59e0b', end: '#ea580c' },
    critical: { start: '#ef4444', end: '#e11d48' },
  }
  const color = colors[status]

  return (
    <div className="relative flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color.start} />
            <stop offset="100%" stopColor={color.end} />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-200 dark:text-neutral-700"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
        <span className="text-3xl font-bold text-neutral-900 dark:text-white font-mono">{percentage}%</span>
      </div>
    </div>
  )
}

// ==========================================
// Daily Projections Hero Component
// ==========================================

function DailyProjectionsHero({ projection }: { projection: DailyProjection }) {
  const statusConfig = {
    exceeding: {
      label: 'Exceeding Projections',
      icon: TrendingUp,
      gradient: 'from-indigo-500 to-purple-600',
      bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      barColor: 'bg-gradient-to-r from-indigo-500 to-purple-600',
    },
    on_track: {
      label: 'On Track',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      barColor: 'bg-gradient-to-r from-emerald-500 to-green-600',
    },
    below: {
      label: 'Below Target',
      icon: TrendingDown,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-600 dark:text-amber-400',
      barColor: 'bg-gradient-to-r from-amber-500 to-orange-600',
    },
    critical: {
      label: 'Needs Attention',
      icon: AlertTriangle,
      gradient: 'from-red-500 to-rose-600',
      bgGradient: 'from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-600 dark:text-red-400',
      barColor: 'bg-gradient-to-r from-red-500 to-rose-600',
    },
  }

  const config = statusConfig[projection.status]
  const StatusIcon = config.icon

  return (
    <div className={`bg-gradient-to-br ${config.bgGradient} rounded-2xl border ${config.borderColor} shadow-lg overflow-hidden`}>
      {/* Top accent bar */}
      <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

      <div className="p-6">
        {/* Header: Date + Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Today's Daily Projections</p>
              <p className="text-base font-bold text-neutral-900 dark:text-white">{projection.date}</p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.textColor} bg-white/60 dark:bg-neutral-800/60 border ${config.borderColor}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {config.label}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Projected & Actual metrics */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {/* Projected Sales */}
            <div className="bg-white/50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-neutral-400" />
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Projected Sales</p>
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white font-mono">${projection.projectedSales.toLocaleString()}</p>
            </div>

            {/* Actual Sales */}
            <div className="bg-white/50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-neutral-400" />
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Current Sales</p>
              </div>
              <p className={`text-2xl font-bold font-mono ${config.textColor}`}>${projection.actualSales.toLocaleString()}</p>
            </div>

            {/* Projected Orders */}
            <div className="bg-white/50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-neutral-400" />
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Projected Orders</p>
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white font-mono">{projection.projectedOrders}</p>
            </div>

            {/* Actual Orders */}
            <div className="bg-white/50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-neutral-400" />
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Current Orders</p>
              </div>
              <p className={`text-2xl font-bold font-mono ${config.textColor}`}>{projection.actualOrders}</p>
            </div>
          </div>

          {/* Right: Arc Gauge */}
          <div className="flex flex-col items-center justify-center">
            <ArcGauge percentage={projection.salesPercentage} status={projection.status} />
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-2">of daily projection</p>
            {projection.salesPercentage > 100 && (
              <p className={`text-xs font-bold mt-1 ${config.textColor}`}>
                +{projection.salesPercentage - 100}% over target
              </p>
            )}
          </div>
        </div>

        {/* Bottom: Top Dishes */}
        {projection.topDishes.length > 0 && (
          <div className="mt-5 pt-5 border-t border-neutral-200/50 dark:border-neutral-700/50">
            <div className="flex items-center gap-2 mb-3">
              <UtensilsCrossed className="w-4 h-4 text-neutral-400" />
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Top Performing Dishes</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {projection.topDishes.map((dish, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/60 dark:bg-neutral-800/60 rounded-lg px-3 py-2 border border-neutral-200/50 dark:border-neutral-700/50">
                  <span className="text-xs font-bold text-neutral-400">#{i + 1}</span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">{dish.name}</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{dish.orders} orders</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// Static Data
// ==========================================

const recentActivity = [
  { name: 'Elena Dimitriou', action: 'logged in', time: '2h ago', icon: Users },
  { name: 'Nikos Server', action: 'processed 12 orders today', time: '3h ago', icon: Activity },
  { name: 'Maria Kostas', action: 'updated menu prices', time: '5h ago', icon: Settings },
  { name: 'Dimitri Alexis', action: 'exported inventory report', time: '1d ago', icon: Activity },
  { name: 'Sofia Barista', action: 'clocked in for evening shift', time: '1d ago', icon: Clock },
]

const quickLinks = [
  { label: 'Restaurant Settings', desc: 'Manage info, subscription & integrations', to: '/restaurant/settings', icon: Settings, gradient: 'from-red-500 to-rose-600' },
  { label: 'Key Management', desc: 'View and regenerate restaurant keys', to: '/restaurant/keys', icon: Key, gradient: 'from-amber-500 to-orange-600' },
  { label: 'User Management', desc: 'Manage managers and POS users', to: '/restaurant/users', icon: Users, gradient: 'from-blue-500 to-indigo-600' },
]

// ==========================================
// Main Component
// ==========================================

export default function AdminDashboard() {
  const { user, restaurantKey, restaurantName, cuisineType } = useAuth()
  const { dailyStats } = usePOS()
  const template = getCuisineTemplate(cuisineType)
  const [copied, setCopied] = useState(false)

  const projection = useMemo(
    () => generateDailyProjections(cuisineType, dailyStats),
    [cuisineType, dailyStats]
  )

  const handleCopyKey = () => {
    navigator.clipboard.writeText(restaurantKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white">Admin Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Welcome back, {user?.name || 'Admin'}
          </p>
        </div>
      </div>

      {/* Restaurant Card */}
      <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl p-4 sm:p-6 border border-red-200 dark:border-red-900 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Building2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-lg font-bold text-black dark:text-white">{restaurantName}</h2>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{template.restaurantSettings.address}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-800 rounded-xl overflow-x-auto">
              <Key className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="font-mono text-sm font-bold text-black dark:text-white truncate">{restaurantKey}</span>
              <button
                onClick={handleCopyKey}
                className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
                title="Copy key"
              >
                <Copy className="w-4 h-4 text-neutral-400 hover:text-red-500" />
              </button>
            </div>
            {copied && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Copied</span>
            )}
          </div>
        </div>
      </div>

      {/* Daily Projections Hero */}
      <DailyProjectionsHero projection={projection} />

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${link.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <link.icon className="w-5 h-5 text-white" />
              </div>
              <ExternalLink className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors" />
            </div>
            <h3 className="font-semibold text-black dark:text-white">{link.label}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{link.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-black dark:text-white">Recent Activity</h3>
          </div>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
          {recentActivity.map((entry, i) => {
            const Icon = entry.icon
            return (
              <div key={i} className="flex items-center space-x-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                <div className="w-9 h-9 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-semibold">{entry.name}</span>{' '}
                    <span className="text-neutral-500 dark:text-neutral-400">{entry.action}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-xs text-neutral-400 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{entry.time}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Subscription */}
      <div className="bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-pink-900/20 rounded-2xl p-4 sm:p-6 border border-red-200 dark:border-red-900 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-black dark:text-white text-lg">Pro Plan</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                <span className="font-mono font-bold text-red-600 dark:text-red-400">$149</span>/mo - Full AI analytics, unlimited users, priority support
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Shield className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">Active</span>
            </div>
            <button className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-500/30 transition-all hover:scale-105 whitespace-nowrap">
              Upgrade to Enterprise
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
