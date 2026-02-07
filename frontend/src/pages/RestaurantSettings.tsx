import { useState } from 'react'
import { Settings, Building2, Phone, Mail, MapPin, CreditCard, Zap, Crown, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface Integration {
  name: string
  enabled: boolean
  icon: string
}

const subscriptionTiers = [
  { name: 'Free', price: 0, desc: 'Basic inventory tracking', features: ['5 ingredients', '1 user', 'Manual entry only'] },
  { name: 'Starter', price: 49, desc: 'Small restaurant essentials', features: ['50 ingredients', '3 users', 'Basic forecasting'] },
  { name: 'Pro', price: 149, desc: 'Full AI analytics suite', features: ['Unlimited ingredients', 'Unlimited users', 'AI agents + Gemini', 'Priority support'] },
  { name: 'Enterprise', price: 399, desc: 'Multi-location + custom', features: ['Multi-restaurant', 'Custom integrations', 'Dedicated support', 'SLA guarantee'] },
]

export default function RestaurantSettings() {
  const { restaurantName } = useAuth()

  const [form, setForm] = useState({
    name: restaurantName || 'Mykonos Mediterranean',
    address: '456 Mediterranean Ave, Athens, GA 30602',
    phone: '(706) 555-0142',
    email: 'info@mykonosathens.com',
  })

  const [selectedTier, setSelectedTier] = useState('Pro')

  const [integrations, setIntegrations] = useState<Integration[]>([
    { name: 'DoorDash', enabled: true, icon: 'DD' },
    { name: 'Uber Eats', enabled: true, icon: 'UE' },
    { name: 'Grubhub', enabled: true, icon: 'GH' },
    { name: 'Postmates', enabled: false, icon: 'PM' },
    { name: 'Solana Pay', enabled: false, icon: 'SP' },
  ])

  const [toast, setToast] = useState(false)

  const handleToggleIntegration = (index: number) => {
    setIntegrations(prev =>
      prev.map((integ, i) => i === index ? { ...integ, enabled: !integ.enabled } : integ)
    )
  }

  const handleSave = () => {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white">Restaurant Settings</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Manage your restaurant profile and preferences</p>
        </div>
      </div>

      {/* Restaurant Info Form */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-lg">
        <div className="flex items-center space-x-2 mb-6">
          <Building2 className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-black dark:text-white">Restaurant Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              <div className="flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Restaurant Name</span>
              </div>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Address</span>
              </div>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              <div className="flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>Phone</span>
              </div>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              <div className="flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </div>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Subscription Tier Selector */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-lg">
        <div className="flex items-center space-x-2 mb-6">
          <Crown className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-black dark:text-white">Subscription Tier</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subscriptionTiers.map((tier) => {
            const isCurrent = tier.name === 'Pro'
            const isSelected = tier.name === selectedTier
            return (
              <button
                key={tier.name}
                onClick={() => setSelectedTier(tier.name)}
                className={`relative rounded-2xl p-5 text-left transition-all hover:scale-[1.02] ${
                  isSelected
                    ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-500 shadow-lg shadow-red-500/10'
                    : 'bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 hover:shadow-md'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg">
                    Current
                  </span>
                )}
                <div className="flex items-baseline space-x-1 mb-2">
                  <span className="text-2xl font-bold text-black dark:text-white font-mono">
                    ${tier.price}
                  </span>
                  <span className="text-sm text-neutral-400">/mo</span>
                </div>
                <h3 className="font-semibold text-black dark:text-white">{tier.name}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-3">{tier.desc}</p>
                <ul className="space-y-1.5">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-center space-x-2 text-xs text-neutral-600 dark:text-neutral-300">
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-lg">
        <div className="flex items-center space-x-2 mb-6">
          <Zap className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-black dark:text-white">Integrations</h2>
        </div>
        <div className="space-y-4">
          {integrations.map((integ, index) => (
            <div
              key={integ.name}
              className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-xl border border-neutral-100 dark:border-neutral-600"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shadow-lg ${
                  integ.enabled
                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400'
                }`}>
                  {integ.icon}
                </div>
                <div>
                  <h3 className="font-medium text-black dark:text-white">{integ.name}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {integ.enabled ? 'Connected and active' : 'Not connected'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggleIntegration(index)}
                className={`relative w-12 h-7 rounded-full transition-all ${
                  integ.enabled
                    ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30'
                    : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  integ.enabled ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-500/30 transition-all hover:scale-105"
        >
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Save Changes</span>
          </div>
        </button>
      </div>

      {/* Success Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-2xl shadow-green-500/30 animate-[slideUp_0.3s_ease-out]">
          <Check className="w-5 h-5" />
          <span className="font-medium text-sm">Settings saved successfully</span>
        </div>
      )}
    </div>
  )
}
