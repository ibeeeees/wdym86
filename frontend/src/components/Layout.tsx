import { ReactNode, useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, LogOut, UtensilsCrossed, Truck, Sun, Moon, Menu, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface LayoutProps {
  children: ReactNode
  onLogout: () => void
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
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
            case 'i': navigate('/dishes'); break
            case 's': navigate('/suppliers'); break
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
    { path: '/dishes', icon: UtensilsCrossed, label: 'Dishes' },
    { path: '/suppliers', icon: Truck, label: 'Suppliers' },
    { path: '/chat', icon: MessageSquare, label: 'AI Advisor' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 transition-colors">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black dark:bg-white rounded flex items-center justify-center">
                <span className="text-white dark:text-black font-mono text-sm font-bold">W</span>
              </div>
              <span className="font-semibold text-black dark:text-white hidden sm:inline">wdym86</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm transition-colors ${
                    location.pathname === path
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
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
                className="p-2 rounded text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <button
                onClick={onLogout}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit</span>
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <nav className="px-4 py-2 space-y-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    location.pathname === path
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black dark:text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1 text-neutral-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="text-neutral-500 dark:text-neutral-400 font-medium text-xs uppercase">Navigation</div>
              {[
                { keys: 'g d', desc: 'Go to Dashboard' },
                { keys: 'g i', desc: 'Go to Dishes' },
                { keys: 'g s', desc: 'Go to Suppliers' },
                { keys: 'g c', desc: 'Go to Chat' },
              ].map(({ keys, desc }) => (
                <div key={keys} className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-300">{desc}</span>
                  <div className="flex space-x-1">
                    {keys.split(' ').map((k, i) => (
                      <kbd key={i} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs font-mono">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-neutral-500 dark:text-neutral-400 font-medium text-xs uppercase mt-4">General</div>
              {[
                { keys: '?', desc: 'Show shortcuts' },
                { keys: '⌘ K', desc: 'Toggle shortcuts' },
              ].map(({ keys, desc }) => (
                <div key={keys} className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-300">{desc}</span>
                  <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs font-mono">
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
