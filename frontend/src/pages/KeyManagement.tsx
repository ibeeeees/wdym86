import { useState } from 'react'
import { Key, Copy, RefreshCw, Clock, Shield, Users, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface KeyEntry {
  key: string
  status: 'active' | 'expired'
  createdAt: string
  expiresAt: string | null
}

interface UsageEntry {
  name: string
  email: string
  signedUp: string
  key: string
}

export default function KeyManagement() {
  const { restaurantKey } = useAuth()

  const [keys, setKeys] = useState<KeyEntry[]>([
    { key: restaurantKey, status: 'active', createdAt: 'Jan 15, 2026', expiresAt: null },
    { key: 'REST-MYK2025-ATHNS', status: 'expired', createdAt: 'Jan 10, 2025', expiresAt: 'Dec 31, 2025' },
  ])

  const [usageLog] = useState<UsageEntry[]>([
    { name: 'Elena Dimitriou', email: 'elena@mykonos.com', signedUp: 'Jan 20, 2026', key: restaurantKey },
    { name: 'Maria Kostas', email: 'maria@mykonos.com', signedUp: 'Feb 1, 2026', key: restaurantKey },
    { name: 'Dimitri Alexis', email: 'dimitri@mykonos.com', signedUp: 'Jan 25, 2026', key: restaurantKey },
  ])

  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const activeKey = keys.find(k => k.status === 'active')

  const handleCopyKey = () => {
    if (activeKey) {
      navigator.clipboard.writeText(activeKey.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRegenerate = () => {
    setRegenerating(true)
    setTimeout(() => {
      const timestamp = Date.now().toString(36).toUpperCase().slice(-6)
      const newKey = `REST-MYK-${timestamp}`
      const now = new Date()
      const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

      setKeys(prev => [
        { key: newKey, status: 'active', createdAt: formattedDate, expiresAt: null },
        ...prev.map(k => k.status === 'active' ? { ...k, status: 'expired' as const, expiresAt: formattedDate } : k),
      ])
      setRegenerating(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
          <Key className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white">Restaurant Keys</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Manage authentication keys for your restaurant</p>
        </div>
      </div>

      {/* Current Key Display */}
      <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-900 shadow-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-black dark:text-white">Active Restaurant Key</h2>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="px-6 py-4 bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-800 rounded-xl">
              <span className="font-mono text-2xl font-bold text-black dark:text-white tracking-wider">
                {activeKey?.key || restaurantKey}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyKey}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all hover:scale-105"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                <span>{regenerating ? 'Regenerating...' : 'Regenerate'}</span>
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
          Share this key with managers so they can register under your restaurant. Regenerating will invalidate the old key.
        </p>
      </div>

      {/* Key History */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-black dark:text-white">Key History</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Key</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Created</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Expired</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {keys.map((entry, i) => (
                <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm font-bold text-black dark:text-white">{entry.key}</span>
                  </td>
                  <td className="px-5 py-4">
                    {entry.status === 'active' ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg shadow-green-500/30">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 text-xs font-bold rounded-full">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Expired</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-neutral-600 dark:text-neutral-300">{entry.createdAt}</td>
                  <td className="px-5 py-4 text-sm text-neutral-600 dark:text-neutral-300">{entry.expiresAt || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Log */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-black dark:text-white">Managers Registered With This Key</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Signed Up</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Key Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {usageLog.map((entry, i) => (
                <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-semibold text-black dark:text-white text-sm">{entry.name}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-neutral-600 dark:text-neutral-300">{entry.email}</td>
                  <td className="px-5 py-4 text-sm text-neutral-600 dark:text-neutral-300">{entry.signedUp}</td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-lg">{entry.key}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
