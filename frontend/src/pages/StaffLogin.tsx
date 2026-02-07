import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Users, ShoppingCart, Check, X, ArrowRight, Key, UserPlus, LogIn, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin, register } from '../services/api'

type StaffMode = 'manager' | 'pos'
type AuthTab = 'signin' | 'signup'

const VALID_RESTAURANT_KEY = 'REST-MYK2026-ATHNS'
const VALID_MANAGER_ID = 'MGR-ELENA26-MYKNS'

export default function StaffLogin() {
  const { demoLogin } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<StaffMode>('manager')
  const [tab, setTab] = useState<AuthTab>('signin')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [restaurantKey, setRestaurantKey] = useState('')
  const [managerId, setManagerId] = useState('')

  // UI state
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  // Validation state
  const [keyValid, setKeyValid] = useState<boolean | null>(null)
  const [keyRestaurantName, setKeyRestaurantName] = useState('')
  const [idValid, setIdValid] = useState<boolean | null>(null)
  const [idManagerName, setIdManagerName] = useState('')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Validate restaurant key
  useEffect(() => {
    if (!restaurantKey) {
      setKeyValid(null)
      setKeyRestaurantName('')
      return
    }
    if (restaurantKey === VALID_RESTAURANT_KEY) {
      setKeyValid(true)
      setKeyRestaurantName('Mykonos Mediterranean')
    } else {
      setKeyValid(false)
      setKeyRestaurantName('')
    }
  }, [restaurantKey])

  // Validate manager ID
  useEffect(() => {
    if (!managerId) {
      setIdValid(null)
      setIdManagerName('')
      return
    }
    if (managerId === VALID_MANAGER_ID) {
      setIdValid(true)
      setIdManagerName('Elena Dimitriou')
    } else {
      setIdValid(false)
      setIdManagerName('')
    }
  }, [managerId])

  const toggleDark = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setRestaurantKey('')
    setManagerId('')
    setError('')
    setKeyValid(null)
    setKeyRestaurantName('')
    setIdValid(null)
    setIdManagerName('')
  }

  const handleModeSwitch = (newMode: StaffMode) => {
    setMode(newMode)
    setTab('signin')
    resetForm()
  }

  const handleTabSwitch = (newTab: AuthTab) => {
    setTab(newTab)
    setError('')
  }

  const handleDemoLogin = async () => {
    setDemoLoading(true)
    await new Promise(resolve => setTimeout(resolve, 600))

    if (mode === 'manager') {
      setRestaurantKey(VALID_RESTAURANT_KEY)
      setKeyValid(true)
      setKeyRestaurantName('Mykonos Mediterranean')
      await new Promise(resolve => setTimeout(resolve, 400))
      demoLogin('manager')
      navigate('/')
    } else {
      setManagerId(VALID_MANAGER_ID)
      setIdValid(true)
      setIdManagerName('Elena Dimitriou')
      await new Promise(resolve => setTimeout(resolve, 400))
      demoLogin('pos_user')
      navigate('/pos')
    }

    setDemoLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (tab === 'signup') {
        if (mode === 'manager' && !keyValid) {
          setError('Please enter a valid Restaurant Key.')
          setLoading(false)
          return
        }
        if (mode === 'pos' && !idValid) {
          setError('Please enter a valid Manager ID.')
          setLoading(false)
          return
        }
        await register(email, password, name)
      }

      const data = await apiLogin(email, password)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('role', mode === 'manager' ? 'manager' : 'pos_user')
      window.location.reload()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClasses =
    'w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:border-red-500 dark:focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm bg-white dark:bg-neutral-800 text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500'

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors ${darkMode ? 'dark bg-neutral-900' : 'bg-neutral-50'}`}>
      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        className="absolute top-6 right-6 p-2.5 rounded-xl text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all z-10"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25">
            <span className="text-white font-mono text-2xl font-bold">W</span>
          </div>
          <h1 className="text-2xl font-bold text-black dark:text-white">wdym86</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Staff Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/30 p-8">
          {/* Mode Toggle */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => handleModeSwitch('manager')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'manager'
                  ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Manager</span>
            </button>
            <button
              onClick={() => handleModeSwitch('pos')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'pos'
                  ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>POS Staff</span>
            </button>
          </div>

          {/* Tab Toggle */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-700 mb-6">
            <button
              onClick={() => handleTabSwitch('signin')}
              className={`flex-1 flex items-center justify-center space-x-2 pb-3 text-sm font-medium border-b-2 transition-all ${
                tab === 'signin'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => handleTabSwitch('signup')}
              className={`flex-1 flex items-center justify-center space-x-2 pb-3 text-sm font-medium border-b-2 transition-all ${
                tab === 'signup'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sign Up: Key / ID field */}
            {tab === 'signup' && mode === 'manager' && (
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Restaurant Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={restaurantKey}
                    onChange={(e) => setRestaurantKey(e.target.value)}
                    className={`${inputClasses} pl-10 pr-10`}
                    placeholder="REST-XXXX-XXXX"
                    required
                  />
                  {keyValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {keyValid ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {keyValid && keyRestaurantName && (
                  <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                    {keyRestaurantName}
                  </p>
                )}
                {keyValid === false && restaurantKey && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                    Invalid restaurant key
                  </p>
                )}
              </div>
            )}

            {tab === 'signup' && mode === 'pos' && (
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Manager ID
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className={`${inputClasses} pl-10 pr-10`}
                    placeholder="MGR-XXXX-XXXX"
                    required
                  />
                  {idValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {idValid ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {idValid && idManagerName && (
                  <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                    {idManagerName}
                  </p>
                )}
                {idValid === false && managerId && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                    Invalid manager ID
                  </p>
                )}
              </div>
            )}

            {/* Sign Up: Name field */}
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses}
                  placeholder="Your full name"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                placeholder="you@restaurant.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl font-semibold text-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all shadow-lg shadow-red-500/25 flex items-center justify-center space-x-2 hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{tab === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>{tab === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-neutral-900 px-4 text-neutral-400 font-medium">
                or try the demo
              </span>
            </div>
          </div>

          {/* Demo Button */}
          <button
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="w-full py-3 rounded-2xl font-semibold text-sm border-2 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all flex items-center justify-center space-x-2 hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
          >
            {demoLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading demo...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Try Demo{mode === 'manager' ? ' as Manager' : ' as POS Staff'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Bottom link */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors inline-flex items-center space-x-1"
          >
            <span>Restaurant owner? Sign up here</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
