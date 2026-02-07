import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { CUISINE_OPTIONS } from '../data/cuisineTemplates'
import {
  Crown, Zap, Sparkles, Building2, ArrowRight, ArrowLeft,
  Check, Camera, MapPin, UtensilsCrossed, Bell,
  Sun, Moon, Monitor, ChefHat, Upload, User
} from 'lucide-react'

const STEPS = ['Plan', 'Restaurant', 'Settings', 'Profile']

const tiers = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic tracking',
    priceMonthly: 0,
    priceYearly: 0,
    icon: Sparkles,
    color: 'from-neutral-400 to-neutral-500',
    popular: false,
    features: ['10 ingredients', '3 suppliers', 'AI forecasting', 'Risk alerts'],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small restaurants',
    priceMonthly: 49,
    priceYearly: 470,
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    popular: false,
    features: ['50 ingredients', '10 suppliers', 'Gemini AI chat', 'POS system'],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for growth',
    priceMonthly: 149,
    priceYearly: 1430,
    icon: Crown,
    color: 'from-red-500 to-red-600',
    popular: true,
    features: ['200 ingredients', '50 suppliers', 'Delivery integration', 'Custom reports'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions at scale',
    priceMonthly: 399,
    priceYearly: 3830,
    icon: Building2,
    color: 'from-black to-neutral-800',
    popular: false,
    features: ['Unlimited everything', 'Dedicated manager', 'Custom integrations', 'Priority support'],
  },
]

const avatarGradients = [
  'from-red-500 to-pink-500',
  'from-blue-500 to-indigo-500',
  'from-green-500 to-emerald-500',
  'from-purple-500 to-violet-500',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-teal-500',
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, completeOnboarding } = useAuth()
  const { setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Tier
  const [selectedTier, setSelectedTier] = useState('free')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  // Step 2: Restaurant
  const [restaurantName, setRestaurantName] = useState(() => {
    const name = user?.name || ''
    return name ? `${name}'s Restaurant` : ''
  })
  const [selectedCuisine, setSelectedCuisine] = useState('mediterranean')
  const [location, setLocation] = useState('')
  const [menuItems, setMenuItems] = useState('')

  // Step 3: Settings
  const [notifications, setNotifications] = useState({
    lowStock: true,
    dailySummary: true,
    orderAlerts: false,
  })
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system')

  // Step 4: Profile picture
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null)

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setDirection(1)
      setStep(step + 1)
    }
  }

  const goBack = () => {
    if (step > 0) {
      setDirection(-1)
      setStep(step - 1)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setProfilePicture(ev.target?.result as string)
      setSelectedAvatar(null)
    }
    reader.readAsDataURL(file)
  }

  const handleAvatarSelect = (index: number) => {
    setSelectedAvatar(index)
    setProfilePicture(null)
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      await completeOnboarding({
        subscriptionTier: selectedTier,
        restaurantName: restaurantName || 'My Restaurant',
        restaurantLocation: location || undefined,
        cuisineType: selectedCuisine,
        menuItems: menuItems ? menuItems.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        notificationsEnabled: notifications.lowStock || notifications.dailySummary,
        themePreference,
        profilePictureUrl: profilePicture || (selectedAvatar !== null ? `avatar:${selectedAvatar}` : null),
      })
      setTheme(themePreference)
      navigate('/admin')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 1 && !restaurantName.trim()) return false
    return true
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800 flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <span className="text-white font-mono text-lg font-bold">W</span>
          </div>
          <span className="text-lg font-bold text-black dark:text-white">wdym86</span>
        </div>
        <span className="text-sm text-neutral-400 dark:text-neutral-500">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-8">
        <div className="max-w-2xl mx-auto flex items-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < step
                      ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                      : i === step
                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-110'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500'
                  }`}
                >
                  {i < step ? <Check className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${
                  i <= step ? 'text-red-600 dark:text-red-400' : 'text-neutral-400 dark:text-neutral-500'
                }`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 mb-5 rounded-full transition-all ${
                  i < step ? 'bg-red-500' : 'bg-neutral-200 dark:bg-neutral-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {/* Step 1: Choose Tier */}
              {step === 0 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
                      <Crown className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-black dark:text-white">Choose Your Plan</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">You can change this anytime</p>

                    <div className="mt-4 inline-flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                      <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          billingCycle === 'monthly'
                            ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          billingCycle === 'yearly'
                            ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      >
                        Yearly
                        <span className="ml-1.5 text-xs text-green-500 font-semibold">Save 20%</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                    {tiers.map((tier) => {
                      const Icon = tier.icon
                      const price = billingCycle === 'monthly' ? tier.priceMonthly : Math.round(tier.priceYearly / 12)
                      const isSelected = selectedTier === tier.id

                      return (
                        <button
                          key={tier.id}
                          onClick={() => setSelectedTier(tier.id)}
                          className={`relative text-left bg-white dark:bg-neutral-800 rounded-2xl border-2 p-5 transition-all hover:scale-[1.02] ${
                            isSelected
                              ? 'border-red-500 shadow-xl shadow-red-500/20'
                              : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                          }`}
                        >
                          {tier.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg">
                                Most Popular
                              </span>
                            </div>
                          )}

                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${tier.color} rounded-xl flex items-center justify-center shadow-lg`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-black dark:text-white text-sm">{tier.name}</h3>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{tier.description}</p>
                            </div>
                          </div>

                          <div className="mb-3">
                            {tier.id === 'enterprise' ? (
                              <span className="text-3xl font-bold text-black dark:text-white">Custom</span>
                            ) : (
                              <>
                                <span className="text-3xl font-bold text-black dark:text-white">${price}</span>
                                <span className="text-neutral-500 dark:text-neutral-400 text-sm">/mo</span>
                              </>
                            )}
                          </div>

                          <ul className="space-y-1.5">
                            {tier.features.map((f) => (
                              <li key={f} className="flex items-center space-x-2 text-xs">
                                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                <span className="text-neutral-600 dark:text-neutral-300">{f}</span>
                              </li>
                            ))}
                          </ul>

                          {isSelected && (
                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Restaurant & Menu */}
              {step === 1 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                      <ChefHat className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-black dark:text-white">Set Up Your Restaurant</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">Tell us about your business</p>
                  </div>

                  <div className="max-w-lg mx-auto space-y-5">
                    {/* Restaurant Name */}
                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                        Restaurant Name
                      </label>
                      <div className="relative">
                        <UtensilsCrossed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="text"
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                          placeholder="Enter your restaurant name"
                        />
                      </div>
                    </div>

                    {/* Cuisine Type */}
                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                        Cuisine Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {CUISINE_OPTIONS.map((opt) => {
                          const isSelected = selectedCuisine === opt.key
                          return (
                            <button
                              key={opt.key}
                              onClick={() => setSelectedCuisine(opt.key)}
                              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center ${
                                isSelected
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-sm'
                                  : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-750'
                              }`}
                            >
                              <span className="text-lg font-bold mb-0.5">{opt.flag}</span>
                              <p className={`text-xs font-semibold ${isSelected ? 'text-red-700 dark:text-red-400' : 'text-black dark:text-white'}`}>
                                {opt.label}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                          placeholder="City, State (optional)"
                        />
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                        Quick Menu Setup <span className="text-neutral-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={menuItems}
                        onChange={(e) => setMenuItems(e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none h-20"
                        placeholder="Enter dish names separated by commas (e.g., Pasta Carbonara, Margherita Pizza)"
                      />
                      <p className="text-xs text-neutral-400 mt-1">You can add and edit dishes later</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Settings */}
              {step === 2 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                      <Bell className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-black dark:text-white">Your Preferences</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">Configure how wdym86 works for you</p>
                  </div>

                  <div className="max-w-lg mx-auto space-y-6">
                    {/* Notifications */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
                      <h3 className="text-sm font-bold text-black dark:text-white mb-4 flex items-center space-x-2">
                        <Bell className="w-4 h-4 text-red-500" />
                        <span>Notifications</span>
                      </h3>
                      <div className="space-y-3">
                        {[
                          { key: 'lowStock' as const, label: 'Low stock alerts', desc: 'Get notified when ingredients run low' },
                          { key: 'dailySummary' as const, label: 'Daily summary', desc: 'Receive daily inventory reports' },
                          { key: 'orderAlerts' as const, label: 'Order notifications', desc: 'Alerts for new and updated orders' },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-black dark:text-white">{item.label}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                            </div>
                            <button
                              onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                              className={`relative w-11 h-6 rounded-full transition-colors ${
                                notifications[item.key] ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-600'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                notifications[item.key] ? 'translate-x-5.5 left-0.5' : 'left-0.5'
                              }`}
                              style={{ transform: notifications[item.key] ? 'translateX(22px)' : 'translateX(0)' }}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Theme */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
                      <h3 className="text-sm font-bold text-black dark:text-white mb-4 flex items-center space-x-2">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>Appearance</span>
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { key: 'light' as const, icon: Sun, label: 'Light' },
                          { key: 'dark' as const, icon: Moon, label: 'Dark' },
                          { key: 'system' as const, icon: Monitor, label: 'System' },
                        ].map((item) => {
                          const isSelected = themePreference === item.key
                          return (
                            <button
                              key={item.key}
                              onClick={() => {
                                setThemePreference(item.key)
                                setTheme(item.key)
                              }}
                              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                  : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500'
                              }`}
                            >
                              <item.icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-red-500' : 'text-neutral-400'}`} />
                              <span className={`text-sm font-medium ${isSelected ? 'text-red-700 dark:text-red-400' : 'text-black dark:text-white'}`}>
                                {item.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Profile Picture */}
              {step === 3 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                      <Camera className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-black dark:text-white">Profile Picture</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">Add a photo or choose an avatar</p>
                  </div>

                  <div className="max-w-sm mx-auto space-y-6">
                    {/* Preview */}
                    <div className="flex justify-center">
                      <div className="relative group">
                        {profilePicture ? (
                          <img
                            src={profilePicture}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-neutral-700 shadow-xl"
                          />
                        ) : selectedAvatar !== null ? (
                          <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${avatarGradients[selectedAvatar]} flex items-center justify-center border-4 border-white dark:border-neutral-700 shadow-xl`}>
                            <span className="text-4xl font-bold text-white">
                              {user?.name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center border-4 border-white dark:border-neutral-600 shadow-xl">
                            <User className="w-12 h-12 text-neutral-400 dark:text-neutral-500" />
                          </div>
                        )}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {/* Upload Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 rounded-xl font-semibold text-sm bg-white dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:border-red-400 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400 transition-all flex items-center justify-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo</span>
                    </button>

                    {/* Avatar Options */}
                    <div>
                      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-3 text-center">
                        Or choose an avatar
                      </p>
                      <div className="flex justify-center space-x-3">
                        {avatarGradients.map((gradient, i) => (
                          <button
                            key={i}
                            onClick={() => handleAvatarSelect(i)}
                            className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center transition-all hover:scale-110 ${
                              selectedAvatar === i
                                ? 'ring-3 ring-red-500 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 scale-110'
                                : ''
                            }`}
                          >
                            <span className="text-lg font-bold text-white">
                              {user?.name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={goBack}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Get Started</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
