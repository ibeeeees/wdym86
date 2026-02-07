import { useState } from 'react'
import { Users, UserCheck, UserX, Mail, Calendar, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface Manager {
  id: string
  name: string
  email: string
  active: boolean
  joined: string
  managerId: string
}

interface POSUser {
  id: string
  name: string
  email: string
  active: boolean
  manager: string
}

const initialManagers: Manager[] = [
  { id: '1', name: 'Elena Dimitriou', email: 'elena@mykonos.com', active: true, joined: 'Jan 20, 2026', managerId: 'MGR-ELENA26-MYKNS' },
  { id: '2', name: 'Maria Kostas', email: 'maria@mykonos.com', active: true, joined: 'Feb 1, 2026', managerId: 'MGR-MARIA26-MYKNS' },
  { id: '3', name: 'Dimitri Alexis', email: 'dimitri@mykonos.com', active: false, joined: 'Jan 25, 2026', managerId: 'MGR-DIMIT26-MYKNS' },
]

const initialPOSUsers: POSUser[] = [
  { id: '1', name: 'Nikos Server', email: 'nikos@mykonos.com', active: true, manager: 'Elena' },
  { id: '2', name: 'Sofia Barista', email: 'sofia@mykonos.com', active: true, manager: 'Elena' },
  { id: '3', name: 'Andreas Host', email: 'andreas@mykonos.com', active: true, manager: 'Maria' },
  { id: '4', name: 'Katerina Runner', email: 'katerina@mykonos.com', active: false, manager: 'Elena' },
  { id: '5', name: 'Petros Cashier', email: 'petros@mykonos.com', active: true, manager: 'Maria' },
]

export default function UserManagement() {
  useAuth()

  const [activeTab, setActiveTab] = useState<'managers' | 'pos'>('managers')
  const [managers, setManagers] = useState<Manager[]>(initialManagers)
  const [posUsers, setPosUsers] = useState<POSUser[]>(initialPOSUsers)

  const handleToggleManager = (id: string) => {
    setManagers(prev =>
      prev.map(m => m.id === id ? { ...m, active: !m.active } : m)
    )
  }

  const handleTogglePOS = (id: string) => {
    setPosUsers(prev =>
      prev.map(u => u.id === id ? { ...u, active: !u.active } : u)
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white">User Management</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Manage managers and POS users for your restaurant</p>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setActiveTab('managers')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'managers'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30'
              : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Managers</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === 'managers'
              ? 'bg-white/20 text-white'
              : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400'
          }`}>
            {managers.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'pos'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30'
              : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>POS Users</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === 'pos'
              ? 'bg-white/20 text-white'
              : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400'
          }`}>
            {posUsers.length}
          </span>
        </button>
      </div>

      {/* Managers Tab */}
      {activeTab === 'managers' && (
        <div className="space-y-4">
          {managers.map((mgr) => (
            <div
              key={mgr.id}
              className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                    mgr.active
                      ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30'
                      : 'bg-neutral-200 dark:bg-neutral-600'
                  }`}>
                    {mgr.active
                      ? <UserCheck className="w-6 h-6 text-white" />
                      : <UserX className="w-6 h-6 text-neutral-400" />
                    }
                  </div>
                  <div>
                    <h3 className="font-semibold text-black dark:text-white">{mgr.name}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="flex items-center space-x-1 text-xs text-neutral-500 dark:text-neutral-400">
                        <Mail className="w-3 h-3" />
                        <span>{mgr.email}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-xs text-neutral-500 dark:text-neutral-400">
                        <Calendar className="w-3 h-3" />
                        <span>Joined {mgr.joined}</span>
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="font-mono text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2.5 py-1 rounded-lg">
                        {mgr.managerId}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {mgr.active ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg shadow-green-500/30">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 text-xs font-bold rounded-full">
                      <UserX className="w-3.5 h-3.5" />
                      <span>Inactive</span>
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleManager(mgr.id)}
                    className={`relative w-12 h-7 rounded-full transition-all ${
                      mgr.active
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/30'
                        : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      mgr.active ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POS Users Tab */}
      {activeTab === 'pos' && (
        <div className="space-y-4">
          {posUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                    user.active
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30'
                      : 'bg-neutral-200 dark:bg-neutral-600'
                  }`}>
                    {user.active
                      ? <UserCheck className="w-6 h-6 text-white" />
                      : <UserX className="w-6 h-6 text-neutral-400" />
                    }
                  </div>
                  <div>
                    <h3 className="font-semibold text-black dark:text-white">{user.name}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="flex items-center space-x-1 text-xs text-neutral-500 dark:text-neutral-400">
                        <Mail className="w-3 h-3" />
                        <span>{user.email}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-xs text-neutral-500 dark:text-neutral-400">
                        <Shield className="w-3 h-3" />
                        <span>Manager: {user.manager}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {user.active ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg shadow-green-500/30">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 text-xs font-bold rounded-full">
                      <UserX className="w-3.5 h-3.5" />
                      <span>Inactive</span>
                    </span>
                  )}
                  <button
                    onClick={() => handleTogglePOS(user.id)}
                    className={`relative w-12 h-7 rounded-full transition-all ${
                      user.active
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/30'
                        : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      user.active ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
