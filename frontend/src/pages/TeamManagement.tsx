import { useState } from 'react'
import { Users, Copy, UserPlus, Mail, Clock, ShoppingCart, Check, Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface POSUser {
  id: string
  name: string
  email: string
  status: 'Active' | 'Inactive'
  lastActive: string
  ordersToday: number
}

const demoPOSUsers: POSUser[] = [
  {
    id: '1',
    name: 'Nikos Server',
    email: 'nikos@mykonos.com',
    status: 'Active',
    lastActive: '15 min ago',
    ordersToday: 12,
  },
  {
    id: '2',
    name: 'Sofia Barista',
    email: 'sofia@mykonos.com',
    status: 'Active',
    lastActive: '1h ago',
    ordersToday: 8,
  },
  {
    id: '3',
    name: 'Katerina Runner',
    email: 'katerina@mykonos.com',
    status: 'Inactive',
    lastActive: '2 days ago',
    ordersToday: 0,
  },
]

export default function TeamManagement() {
  const { managerId } = useAuth()
  const displayManagerId = managerId || 'MGR-ELENA26-MYKNS'

  const [posUsers, setPosUsers] = useState<POSUser[]>(demoPOSUsers)
  const [copied, setCopied] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const totalUsers = posUsers.length
  const activeToday = posUsers.filter(u => u.status === 'Active').length
  const ordersToday = posUsers.reduce((sum, u) => sum + u.ordersToday, 0)

  const handleCopyId = () => {
    navigator.clipboard.writeText(displayManagerId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return

    const newUser: POSUser = {
      id: Date.now().toString(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      status: 'Inactive',
      lastActive: 'Just invited',
      ordersToday: 0,
    }

    setPosUsers([...posUsers, newUser])
    setInviteName('')
    setInviteEmail('')
    setSuccessMessage(`Invitation sent to ${newUser.name} (${newUser.email})`)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white">My Team</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Manage your POS staff and monitor activity
          </p>
        </div>
      </div>

      {/* Manager ID Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Your Manager ID</p>
            <div className="flex items-center space-x-3">
              <span className="text-lg font-mono font-bold text-black dark:text-white tracking-wide">
                {displayManagerId}
              </span>
              <button
                onClick={handleCopyId}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all hover:scale-105"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Share this ID with your POS staff to sign up
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Total POS Users</p>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white">{totalUsers}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-5 border border-green-200 dark:border-green-900 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Active Today</p>
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{activeToday}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Orders Today</p>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white">{ordersToday}</p>
        </div>
      </div>

      {/* POS User List */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-black dark:text-white">POS Users</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {totalUsers} staff members under your management
          </p>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
          {posUsers.map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between p-5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-black dark:text-white">{user.name}</p>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-neutral-400" />
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="hidden sm:flex items-center space-x-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{user.lastActive}</span>
                </div>
                <div className="hidden sm:flex items-center space-x-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span className="font-mono font-medium">{user.ordersToday}</span>
                  <span>orders</span>
                </div>
                <span
                  className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                    user.status === 'Active'
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {user.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add POS User Form */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-900">
        <div className="flex items-center space-x-2 mb-4">
          <UserPlus className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-black dark:text-white">Invite POS User</h3>
        </div>

        {successMessage && (
          <div className="mb-4 flex items-center space-x-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-xl text-sm text-green-700 dark:text-green-400 font-medium">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Full name"
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleInvite}
            disabled={!inviteName.trim() || !inviteEmail.trim()}
            className="flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite</span>
          </button>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
          New users will receive an email invitation to join under your Manager ID
        </p>
      </div>
    </div>
  )
}
