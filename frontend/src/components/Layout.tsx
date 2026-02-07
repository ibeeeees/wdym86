import { ReactNode, useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, LogOut, UtensilsCrossed, Truck, Sun, Moon, Menu, X, ShoppingCart, Package, Wallet, Monitor } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface LayoutProps {
  children: ReactNode
  onLogout: () => void
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, resolvedTheme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // CMD/CTRL + K shows keyboard shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowShortcuts(!showShortcuts)
        return
      }

      // G + key combinations for navigation
      if (e.key === 'g') {
        const handleNextKey = (e2: KeyboardEvent) => {
          switch (e2.key) {
            case 'd': navigate('/'); break
            case 'p': navigate('/pos'); break
            case 'o': navigate('/delivery'); break
            case 'i': navigate('/dishes'); break
            case 's': navigate('/suppliers'); break
            case 'w': navigate('/solana-pay'); break
            case 'c': navigate('/chat'); break
          }
          document.removeEventListener('keydown', handleNextKey)
        }
        document.addEventListener('keydown', handleNextKey, { once: true })
        setTimeout(() => document.removeEventListener('keydown', handleNextKey), 1000)
      }

      // Single key shortcuts
      if (e.key === '?') {
        setShowShortcuts(!showShortcuts)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navigate, showShortcuts])

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/pos', icon: ShoppingCart, label: 'POS' },
    { path: '/delivery', icon: Package, label: 'Delivery' },
    { path: '/dishes', icon: UtensilsCrossed, label: 'Dishes' },
    { path: '/suppliers', icon: Truck, label: 'Suppliers' },
    { path: '/solana-pay', icon: Wallet, label: 'Crypto Pay' },
    { path: '/chat', icon: MessageSquare, label: 'AI Advisor' },
  ]

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor className="w-4 h-4" />
    if (resolvedTheme === 'light') return <Moon className="w-4 h-4" />
    return <Sun className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900 transition-colors">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-105 transition-transform">
                <span className="text-white font-mono text-sm font-bold">W</span>
              </div>
              <span className="font-bold text-black dark:text-white hidden sm:inline">wdym86</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 bg-neutral-100/50 dark:bg-neutral-800/50 rounded-xl p-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === path
                      ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all hover:scale-105"
                title={`Theme: ${theme} (click to cycle)`}
              >
                {getThemeIcon()}
              </button>
              <button
                onClick={onLogout}
                className="hidden sm:flex items-center space-x-1.5 px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit</span>
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === path
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">⌘</span>
                </div>
                <h2 className="text-lg font-bold text-black dark:text-white">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-2 text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2 mb-3">
                <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                <span className="text-neutral-400 dark:text-neutral-500 font-semibold text-xs uppercase px-2">Navigation</span>
                <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
              </div>
              {[
                { keys: 'g d', desc: 'Go to Dashboard' },
                { keys: 'g p', desc: 'Go to POS' },
                { keys: 'g o', desc: 'Go to Delivery' },
                { keys: 'g i', desc: 'Go to Dishes' },
                { keys: 'g s', desc: 'Go to Suppliers' },
                { keys: 'g w', desc: 'Go to Crypto Pay' },
                { keys: 'g c', desc: 'Go to Chat' },
              ].map(({ keys, desc }) => (
                <div key={keys} className="flex items-center justify-between py-1.5">
                  <span className="text-neutral-600 dark:text-neutral-300">{desc}</span>
                  <div className="flex space-x-1">
                    {keys.split(' ').map((k, i) => (
                      <kbd key={i} className="px-2.5 py-1.5 bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-mono font-bold border border-neutral-200 dark:border-neutral-600 shadow-sm">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center space-x-2 mt-6 mb-3">
                <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                <span className="text-neutral-400 dark:text-neutral-500 font-semibold text-xs uppercase px-2">General</span>
                <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
              </div>
              {[
                { keys: '?', desc: 'Show shortcuts' },
                { keys: '⌘ K', desc: 'Toggle shortcuts' },
              ].map(({ keys, desc }) => (
                <div key={keys} className="flex items-center justify-between py-1.5">
                  <span className="text-neutral-600 dark:text-neutral-300">{desc}</span>
                  <kbd className="px-2.5 py-1.5 bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-mono font-bold border border-neutral-200 dark:border-neutral-600 shadow-sm">
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
