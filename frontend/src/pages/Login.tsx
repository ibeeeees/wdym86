import { useState } from 'react'
import { ArrowRight, Sun, Moon } from 'lucide-react'
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

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors ${darkMode ? 'dark bg-neutral-900' : 'bg-white'}`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleDark}
        className="absolute top-6 right-6 p-2 rounded-lg text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white dark:text-black font-mono text-xl font-bold">W</span>
          </div>
          <h1 className="text-2xl font-semibold text-black dark:text-white">wdym86</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">AI Inventory Intelligence</p>
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

        {/* Demo */}
        <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={handleDemoLogin}
            className="w-full py-3 rounded-lg font-medium text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Try Demo
          </button>
          <p className="text-center text-xs text-neutral-400 mt-3">
            NumPy TCN · AI Agents · Gemini
          </p>
        </div>
      </div>
    </div>
  )
}
