import { useState, useEffect } from 'react'
import { ArrowRight, Sun, Moon, Sparkles, Brain, BarChart3, Truck, Shield, Zap, ChefHat, TrendingUp } from 'lucide-react'
import { login, register } from '../services/api'

interface LoginProps {
  onLogin: () => void
}

// Animated floating elements for background
const FloatingIcon = ({ icon: Icon, delay, x, y }: { icon: any; delay: number; x: number; y: number }) => (
  <div
    className="absolute opacity-10 animate-float"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${3 + Math.random() * 2}s`
    }}
  >
    <Icon className="w-8 h-8 text-white" />
  </div>
)

export default function Login({ onLogin }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  // Subtle animation state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

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

  const handleDemoLogin = async () => {
    setDemoLoading(true)
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 800))
    localStorage.setItem('token', 'demo-token')
    onLogin()
  }

  const features = [
    { icon: BarChart3, title: 'Ground-Up ML', desc: 'NumPy TCN with Negative Binomial', color: 'from-blue-400 to-cyan-500' },
    { icon: Brain, title: 'AI Agents', desc: 'Autonomous risk & reorder decisions', color: 'from-purple-400 to-pink-500' },
    { icon: Sparkles, title: 'Gemini Powered', desc: 'Natural language explanations', color: 'from-amber-400 to-orange-500' },
    { icon: Truck, title: 'Disruption Aware', desc: 'Weather, traffic, supplier risks', color: 'from-green-400 to-emerald-500' },
  ]

  const stats = [
    { value: '99.2%', label: 'Forecast Accuracy' },
    { value: '3x', label: 'Faster Decisions' },
    { value: '$50K', label: 'Avg. Savings' },
  ]

  return (
    <div className={`min-h-screen flex transition-colors ${darkMode ? 'dark bg-neutral-900' : 'bg-white'}`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleDark}
        className="absolute top-6 right-6 p-2.5 rounded-xl text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all z-10 hover:scale-110"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Left Side - Features */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-indigo-700 to-purple-800 p-12 flex-col justify-between relative overflow-hidden"
        style={{
          backgroundPosition: `${50 + mousePos.x * 10}% ${50 + mousePos.y * 10}%`,
        }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingIcon icon={ChefHat} delay={0} x={10} y={20} />
          <FloatingIcon icon={TrendingUp} delay={0.5} x={80} y={15} />
          <FloatingIcon icon={Brain} delay={1} x={20} y={70} />
          <FloatingIcon icon={BarChart3} delay={1.5} x={75} y={60} />
          <FloatingIcon icon={Zap} delay={2} x={40} y={40} />
          <FloatingIcon icon={Shield} delay={2.5} x={60} y={80} />
          {/* Gradient orbs */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
              <span className="text-violet-600 font-mono text-xl font-bold">W</span>
            </div>
            <div>
              <span className="text-white text-2xl font-bold">wdym86</span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white/80 backdrop-blur-sm">Hackathon 2026</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 relative z-10">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Stop guessing.<br />
              <span className="bg-gradient-to-r from-amber-200 to-pink-200 bg-clip-text text-transparent">Start predicting.</span>
            </h2>
            <p className="text-white/70 mt-4 text-lg">AI-powered inventory intelligence that saves restaurants thousands in waste and stockouts.</p>
          </div>

          {/* Stats */}
          <div className="flex space-x-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-white/60 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all hover:scale-[1.02] cursor-default group"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold">{feature.title}</h3>
                <p className="text-white/60 text-sm mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-white/50 text-sm relative z-10 flex items-center space-x-4">
          <span>Built for Hackathon 2026</span>
          <span>·</span>
          <span>Ground-Up Model Track</span>
          <span>·</span>
          <span>Best Use of Gemini API</span>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30">
              <span className="text-white font-mono text-2xl font-bold">W</span>
            </div>
            <h1 className="text-2xl font-bold text-black dark:text-white">wdym86</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">AI Inventory Intelligence</p>
          </div>

          {/* Demo Button - Prominent */}
          <div className="mb-8">
            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all shadow-xl shadow-violet-500/30 flex items-center justify-center space-x-3 hover:scale-[1.02] disabled:opacity-70 disabled:scale-100"
            >
              {demoLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Loading Demo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Try Interactive Demo</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-3 flex items-center justify-center space-x-2">
              <Shield className="w-3 h-3" />
              <span>No account required · Full feature access</span>
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-neutral-50 dark:bg-neutral-800 px-4 text-neutral-400 font-medium">or sign in</span>
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
                  className="w-full px-4 py-3.5 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
                  placeholder="Full name"
                />
              </div>
            )}

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
                placeholder="Email address"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
                placeholder="Password"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-6">
            {isRegister ? 'Have an account?' : 'No account?'}{' '}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-violet-600 dark:text-violet-400 font-semibold hover:underline"
            >
              {isRegister ? 'Sign In' : 'Create one'}
            </button>
          </p>

          {/* Mobile Features */}
          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700 lg:hidden">
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, i) => (
                <div key={i} className="text-center p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-black dark:text-white">{feature.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
