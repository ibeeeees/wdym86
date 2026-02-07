import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, ShoppingCart, Key, Settings, Clock, Activity, Crown, Copy, ExternalLink, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getCuisineTemplate } from '../data/cuisineTemplates'

const recentActivity = [
  { name: 'Elena Dimitriou', action: 'logged in', time: '2h ago', icon: Users },
  { name: 'Nikos Server', action: 'processed 12 orders today', time: '3h ago', icon: ShoppingCart },
  { name: 'Maria Kostas', action: 'updated menu prices', time: '5h ago', icon: Settings },
  { name: 'Dimitri Alexis', action: 'exported inventory report', time: '1d ago', icon: Activity },
  { name: 'Sofia Barista', action: 'clocked in for evening shift', time: '1d ago', icon: Clock },
]

const quickLinks = [
  { label: 'Restaurant Settings', desc: 'Manage info, subscription & integrations', to: '/restaurant/settings', icon: Settings, gradient: 'from-red-500 to-rose-600' },
  { label: 'Key Management', desc: 'View and regenerate restaurant keys', to: '/restaurant/keys', icon: Key, gradient: 'from-amber-500 to-orange-600' },
  { label: 'User Management', desc: 'Manage managers and POS users', to: '/restaurant/users', icon: Users, gradient: 'from-blue-500 to-indigo-600' },
]

export default function AdminDashboard() {
  const { user, restaurantKey, restaurantName, cuisineType } = useAuth()
  const template = getCuisineTemplate(cuisineType)
  const [copied, setCopied] = useState(false)

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
      <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-900 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Building2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-lg font-bold text-black dark:text-white">{restaurantName}</h2>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{template.restaurantSettings.address}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-800 rounded-xl">
              <Key className="w-4 h-4 text-red-500" />
              <span className="font-mono text-sm font-bold text-black dark:text-white">{restaurantKey}</span>
              <button
                onClick={handleCopyKey}
                className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Managers</p>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white font-mono">3</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">POS Users</p>
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white font-mono">5</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl p-5 border border-red-200 dark:border-red-900 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Subscription</p>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Crown className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">Pro</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Monthly Revenue</p>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-white font-bold">$</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white font-mono">$12,450</p>
        </div>
      </div>

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
      <div className="bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-900 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-black dark:text-white text-lg">Pro Plan</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                <span className="font-mono font-bold text-red-600 dark:text-red-400">$149</span>/mo - Full AI analytics, unlimited users, priority support
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Shield className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">Active</span>
            </div>
            <button className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-500/30 transition-all hover:scale-105">
              Upgrade to Enterprise
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
