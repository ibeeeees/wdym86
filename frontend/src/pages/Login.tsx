import { useState } from 'react'
import { ArrowRight, Sun, Moon, Sparkles, Brain, BarChart3, Truck } from 'lucide-react'
import { login, register } from '../services/api'

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  const toggleDark = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newMode)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        await register(email, password, name)
      }
      const data = await login(email, password)
      localStorage.setItem('token', data.access_token)
      onLogin()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    localStorage.setItem('token', 'demo-token')
    onLogin()
  }

  const features = [
    { icon: BarChart3, title: 'Ground-Up ML', desc: 'NumPy TCN with Negative Binomial' },
    { icon: Brain, title: 'AI Agents', desc: 'Autonomous risk & reorder decisions' },
    { icon: Sparkles, title: 'Gemini Powered', desc: 'Natural language explanations' },
    { icon: Truck, title: 'Disruption Aware', desc: 'Weather, traffic, supplier risks' },
  ]

  return (
    <div className={`min-h-screen flex transition-colors ${darkMode ? 'dark bg-neutral-900' : 'bg-white'}`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleDark}
        className="absolute top-6 right-6 p-2 rounded-lg text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-10"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Left Side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-black dark:to-neutral-900 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-mono text-lg font-bold">W</span>
            </div>
            <span className="text-white text-xl font-semibold">wdym86</span>
          </div>
          <p className="text-neutral-400 text-sm">AI-Powered Restaurant Inventory Intelligence</p>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Stop guessing.<br />Start predicting.
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <feature.icon className="w-5 h-5 text-white mb-2" />
                <h3 className="text-white font-medium text-sm">{feature.title}</h3>
                <p className="text-neutral-400 text-xs mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-neutral-500 text-xs">
          Built for Hackathon 2024 · Ground-Up Model Track · Best Use of Gemini API
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white dark:text-black font-mono text-xl font-bold">W</span>
            </div>
            <h1 className="text-2xl font-semibold text-black dark:text-white">wdym86</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">AI Inventory Intelligence</p>
          </div>

          {/* Demo Button - Prominent */}
          <div className="mb-8">
            <button
              onClick={handleDemoLogin}
              className="w-full py-4 rounded-xl font-medium text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Try Interactive Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-2">
              No account required · Full feature access
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-neutral-900 px-2 text-neutral-400">or sign in</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:border-black dark:focus:border-white focus:ring-0 transition-colors text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
                  placeholder="Name"
                />
              </div>
            )}

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:border-black dark:focus:border-white focus:ring-0 transition-colors text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
                placeholder="Email"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:border-black dark:focus:border-white focus:ring-0 transition-colors text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
                placeholder="Password"
                required
              />
            </div>

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-6">
            {isRegister ? 'Have an account?' : 'No account?'}{' '}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-black dark:text-white font-medium hover:underline"
            >
              {isRegister ? 'Sign In' : 'Create one'}
            </button>
          </p>

          {/* Mobile Features */}
          <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 lg:hidden">
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, i) => (
                <div key={i} className="text-center p-3">
                  <feature.icon className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
                  <p className="text-xs text-neutral-500">{feature.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
