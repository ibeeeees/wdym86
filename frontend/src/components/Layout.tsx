import { ReactNode, useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, LogOut, UtensilsCrossed, Truck, Sun, Moon, Menu, X, ShoppingCart, Package, Wallet, Monitor, Download, Sparkles, Settings, Key, Users, Shield, ChevronDown } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, resolvedTheme, toggleTheme } = useTheme()
  const { role, user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [adminDropdown, setAdminDropdown] = useState(false)

  // Handle scroll for navbar effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close admin dropdown on outside click
  useEffect(() => {
    const handleClick = () => setAdminDropdown(false)
    if (adminDropdown) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [adminDropdown])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowShortcuts(!showShortcuts)
        return
      }

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

      if (e.key === '?') {
        setShowShortcuts(!showShortcuts)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navigate, showShortcuts])

  // Role-based nav items
  const getNavItems = () => {
    if (role === 'pos_user') {
      return [
        { path: '/', icon: ShoppingCart, label: 'POS' },
      ]
    }

    if (role === 'manager') {
      return [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/pos', icon: ShoppingCart, label: 'POS' },
        { path: '/delivery', icon: Package, label: 'Delivery' },
        { path: '/dishes', icon: UtensilsCrossed, label: 'Dishes' },
        { path: '/suppliers', icon: Truck, label: 'Suppliers' },
        { path: '/solana-pay', icon: Wallet, label: 'Crypto Pay' },
        { path: '/chat', icon: MessageSquare, label: 'AI Advisor' },
        { path: '/team', icon: Users, label: 'Team' },
      ]
    }

    // restaurant_admin
    return [
      { path: '/', icon: LayoutDashboard, label: 'Overview' },
      { path: '/dashboard', icon: LayoutDashboard, label: 'Inventory' },
      { path: '/pos', icon: ShoppingCart, label: 'POS' },
      { path: '/delivery', icon: Package, label: 'Delivery' },
      { path: '/dishes', icon: UtensilsCrossed, label: 'Dishes' },
      { path: '/suppliers', icon: Truck, label: 'Suppliers' },
      { path: '/solana-pay', icon: Wallet, label: 'Crypto Pay' },
      { path: '/chat', icon: MessageSquare, label: 'AI Advisor' },
    ]
  }

  const adminItems = [
    { path: '/restaurant/settings', icon: Settings, label: 'Settings' },
    { path: '/restaurant/keys', icon: Key, label: 'Keys' },
    { path: '/restaurant/users', icon: Users, label: 'Users' },
  ]

  const navItems = getNavItems()

  const roleBadge = () => {
    if (role === 'restaurant_admin') return { label: 'Admin', color: 'from-red-500 to-red-600' }
    if (role === 'manager') return { label: 'Manager', color: 'from-blue-500 to-indigo-600' }
    return { label: 'POS', color: 'from-green-500 to-emerald-600' }
  }

  const badge = roleBadge()

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor className="w-4 h-4" />
    if (resolvedTheme === 'light') return <Moon className="w-4 h-4" />
    return <Sun className="w-4 h-4" />
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-red-50/20 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 transition-colors">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20 border-b border-neutral-200/50 dark:border-neutral-800/50'
          : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 group-hover:scale-105 transition-all duration-300">
                  <span className="text-white font-mono text-lg font-bold">W</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse" />
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <div>
                  <span className="font-bold text-lg text-black dark:text-white">wdym86</span>
                  <span className="block text-[10px] text-neutral-500 dark:text-neutral-400 font-medium -mt-1">AI Inventory</span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold text-white rounded-full bg-gradient-to-r ${badge.color} shadow-sm`}>
                  {badge.label}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-2xl p-1.5 border border-neutral-200/50 dark:border-neutral-700/50 shadow-lg shadow-black/5">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path + label}
                  to={path}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === path
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}

              {/* Admin dropdown */}
              {role === 'restaurant_admin' && (
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setAdminDropdown(!adminDropdown) }}
                    className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      ['/restaurant/settings', '/restaurant/keys', '/restaurant/users'].includes(location.pathname)
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${adminDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {adminDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xl py-1 z-50">
                      {adminItems.map(({ path, icon: Icon, label }) => (
                        <Link
                          key={path}
                          to={path}
                          onClick={() => setAdminDropdown(false)}
                          className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                            location.pathname === path
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold'
                              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Tablet Navigation (md screens) */}
            <nav className="hidden md:flex lg:hidden items-center space-x-1 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-1 border border-neutral-200/50 dark:border-neutral-700/50">
              {navItems.slice(0, 5).map(({ path, icon: Icon, label }) => (
                <Link
                  key={path + label}
                  to={path}
                  className={`flex items-center justify-center p-2.5 rounded-lg transition-all ${
                    location.pathname === path
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                      : 'text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                  title={label}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* User name (hidden on small screens) */}
              {user && role !== 'pos_user' && (
                <span className="hidden xl:block text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                  {user.name}
                </span>
              )}
              {role !== 'pos_user' && (
                <Link
                  to="/downloads"
                  className="hidden sm:flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  <span>Get App</span>
                  <Sparkles className="w-3 h-3 opacity-70" />
                </Link>
              )}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white bg-white/60 dark:bg-neutral-800/60 hover:bg-white dark:hover:bg-neutral-700 border border-neutral-200/50 dark:border-neutral-700/50 transition-all duration-200 hover:scale-105 shadow-sm"
                title={`Theme: ${theme} (click to cycle)`}
              >
                {getThemeIcon()}
              </button>
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center space-x-2 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all font-semibold border border-red-200/50 dark:border-red-800/50"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit</span>
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white bg-white/60 dark:bg-neutral-800/60 hover:bg-white dark:hover:bg-neutral-700 border border-neutral-200/50 dark:border-neutral-700/50 transition-all"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Full Screen Overlay */}
        <div className={`lg:hidden fixed inset-0 top-16 z-40 transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className={`relative bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shadow-2xl transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-y-0' : '-translate-y-4'
          }`}>
            <nav className="px-4 py-4 space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
              {/* Role badge on mobile */}
              <div className="flex items-center space-x-2 px-3 py-2 mb-2">
                <span className={`px-2.5 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r ${badge.color}`}>
                  {badge.label}
                </span>
                {user && (
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">{user.name}</span>
                )}
              </div>

              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path + label}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-4 px-5 py-4 rounded-2xl text-base font-medium transition-all ${
                    location.pathname === path
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    location.pathname === path
                      ? 'bg-white/20'
                      : 'bg-neutral-100 dark:bg-neutral-800'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span>{label}</span>
                </Link>
              ))}

              {/* Admin section in mobile */}
              {role === 'restaurant_admin' && (
                <div className="pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="px-5 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wide">Admin</p>
                  {adminItems.map(({ path, icon: Icon, label }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-4 px-5 py-4 rounded-2xl text-base font-medium transition-all ${
                        location.pathname === path
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        location.pathname === path
                          ? 'bg-white/20'
                          : 'bg-neutral-100 dark:bg-neutral-800'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Mobile-only actions */}
              <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                {role !== 'pos_user' && (
                  <Link
                    to="/downloads"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Download className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Download App</span>
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center space-x-4 px-5 py-4 rounded-2xl text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {children}
      </main>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">K</span>
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
                { keys: 'Ctrl K', desc: 'Toggle shortcuts' },
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
