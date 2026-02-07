import { ReactNode, useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, LogOut, UtensilsCrossed, Truck, Sun, Moon, Menu, X, ShoppingCart, Package, Wallet, Monitor, Settings, Key, Users, Shield, ChevronDown, Search, BarChart3, Grid3X3, ClipboardList } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface LayoutProps {
  children: ReactNode
}

interface NavItem {
  path: string
  icon: typeof LayoutDashboard
  label: string
}

interface NavDropdown {
  id: string
  icon: typeof LayoutDashboard
  label: string
  items: NavItem[]
}

type NavEntry = NavItem | NavDropdown

function isDropdown(entry: NavEntry): entry is NavDropdown {
  return 'items' in entry
}

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, resolvedTheme, toggleTheme } = useTheme()
  const { role, user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle scroll for navbar effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

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

  // Check if any path in a dropdown is active
  const isDropdownActive = (items: NavItem[]) =>
    items.some(item => location.pathname === item.path)

  // Role-based nav structure with dropdowns
  const getNavEntries = (): NavEntry[] => {
    if (role === 'pos_user') {
      return [
        { path: '/', icon: ShoppingCart, label: 'POS' },
      ]
    }

    if (role === 'manager') {
      return [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/pos', icon: ShoppingCart, label: 'POS' },
        {
          id: 'manage',
          icon: Package,
          label: 'Manage',
          items: [
            { path: '/delivery', icon: Package, label: 'Delivery' },
            { path: '/dishes', icon: UtensilsCrossed, label: 'Dishes' },
            { path: '/suppliers', icon: Truck, label: 'Suppliers' },
            { path: '/solana-pay', icon: Wallet, label: 'Crypto Pay' },
            { path: '/chat', icon: MessageSquare, label: 'AI Advisor' },
            { path: '/team', icon: Users, label: 'Team' },
            { path: '/floor-plan', icon: Grid3X3, label: 'Floor Plan' },
            { path: '/timeline', icon: BarChart3, label: 'Analytics' },
            { path: '/inventory-tracking', icon: ClipboardList, label: 'Inventory' },
          ],
        },
      ]
    }

    // restaurant_admin
    return [
      { path: '/', icon: LayoutDashboard, label: 'Overview' },
      { path: '/pos', icon: ShoppingCart, label: 'POS' },
      {
        id: 'manage',
        icon: Package,
        label: 'Manage',
        items: [
          { path: '/dashboard', icon: LayoutDashboard, label: 'Forecasting' },
          { path: '/delivery', icon: Package, label: 'Delivery' },
          { path: '/dishes', icon: UtensilsCrossed, label: 'Dishes' },
          { path: '/suppliers', icon: Truck, label: 'Suppliers' },
          { path: '/solana-pay', icon: Wallet, label: 'Crypto Pay' },
          { path: '/chat', icon: MessageSquare, label: 'AI Advisor' },
          { path: '/floor-plan', icon: Grid3X3, label: 'Floor Plan' },
          { path: '/timeline', icon: BarChart3, label: 'Analytics' },
          { path: '/inventory-tracking', icon: ClipboardList, label: 'Inventory' },
        ],
      },
      {
        id: 'admin',
        icon: Shield,
        label: 'Admin',
        items: [
          { path: '/restaurant/settings', icon: Settings, label: 'Settings' },
          { path: '/restaurant/keys', icon: Key, label: 'Keys' },
          { path: '/restaurant/users', icon: Users, label: 'Users' },
          { path: '/team', icon: Users, label: 'Team' },
        ],
      },
    ]
  }

  // Flat list for mobile nav
  const getMobileItems = (): NavItem[] => {
    if (role === 'pos_user') {
      return [{ path: '/', icon: ShoppingCart, label: 'POS' }]
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
        { path: '/floor-plan', icon: Grid3X3, label: 'Floor Plan' },
        { path: '/timeline', icon: BarChart3, label: 'Analytics' },
        { path: '/inventory-tracking', icon: ClipboardList, label: 'Inventory' },
      ]
    }

    return [
      { path: '/', icon: LayoutDashboard, label: 'Overview' },
      { path: '/dashboard', icon: LayoutDashboard, label: 'Forecasting' },
      { path: '/pos', icon: ShoppingCart, label: 'POS' },
      { path: '/delivery', icon: Package, label: 'Delivery' },
      { path: '/dishes', icon: UtensilsCrossed, label: 'Dishes' },
      { path: '/suppliers', icon: Truck, label: 'Suppliers' },
      { path: '/solana-pay', icon: Wallet, label: 'Crypto Pay' },
      { path: '/chat', icon: MessageSquare, label: 'AI Advisor' },
      { path: '/floor-plan', icon: Grid3X3, label: 'Floor Plan' },
      { path: '/timeline', icon: BarChart3, label: 'Analytics' },
      { path: '/inventory-tracking', icon: ClipboardList, label: 'Inventory' },
      { path: '/team', icon: Users, label: 'Team' },
      { path: '/restaurant/settings', icon: Settings, label: 'Settings' },
    ]
  }



  const navEntries = getNavEntries()
  const mobileItems = getMobileItems()

  const roleBadge = () => {
    if (role === 'restaurant_admin') return { label: 'Admin', color: 'bg-gradient-to-r from-primary-500 to-indigo-600' }
    if (role === 'manager') return { label: 'Manager', color: 'bg-gradient-to-r from-blue-500 to-cyan-600' }
    return { label: 'POS', color: 'bg-gradient-to-r from-emerald-500 to-teal-600' }
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

  const toggleDropdown = (id: string) => {
    setOpenDropdown(prev => prev === id ? null : id)
  }

  return (
    <div className="min-h-screen transition-colors duration-500">
      {/* Glossy Background Mesh */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-500/10 blur-[100px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-rose-500/5 blur-[80px] animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-500 border-b",
        scrolled
          ? "glass-panel h-16"
          : "bg-transparent border-transparent h-20"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group outline-none">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 group-hover:scale-105 transition-all duration-300">
                  <span className="text-white font-display text-lg font-bold">W</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-pulse-glow box-shadow-glow" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-display font-bold text-lg text-neutral-900 dark:text-white leading-tight tracking-tight">wdym86</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">AI Inventory</span>
                  <span className={cn("px-1.5 py-0.5 text-[9px] font-bold text-white rounded-full shadow-sm", badge.color)}>
                    {badge.label}
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav ref={dropdownRef} className="hidden lg:flex items-center p-1 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/10 shadow-sm">
              {navEntries.map((entry) => {
                if (isDropdown(entry)) {
                  const active = isDropdownActive(entry.items)
                  const isOpen = openDropdown === entry.id
                  return (
                    <div key={entry.id} className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleDropdown(entry.id) }}
                        className={cn(
                          "flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 outline-none",
                          active
                            ? "bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-md"
                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-700/50"
                        )}
                      >
                        <entry.icon className="w-4 h-4" />
                        <span>{entry.label}</span>
                        <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 top-full mt-2 w-56 glass-card p-1.5 z-50"
                          >
                            {entry.items.map(({ path, icon: Icon, label }) => (
                              <Link
                                key={path}
                                to={path}
                                onClick={() => setOpenDropdown(null)}
                                className={cn(
                                  "flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition-all outline-none group",
                                  location.pathname === path
                                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                                )}
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                  location.pathname === path
                                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 group-hover:bg-white dark:group-hover:bg-neutral-700"
                                )}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span>{label}</span>
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                }

                return (
                  <Link
                    key={entry.path + entry.label}
                    to={entry.path}
                    onClick={() => setOpenDropdown(null)}
                    className={cn(
                      "flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 outline-none",
                      location.pathname === entry.path
                        ? "bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-md"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-700/50"
                    )}
                  >
                    <entry.icon className="w-4 h-4" />
                    <span>{entry.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              <button
                className="hidden sm:flex p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 outline-none"
                title="Search (Ctrl + K)"
                onClick={() => setShowShortcuts(true)}
              >
                <Search className="w-5 h-5" />
              </button>

              <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800 mx-1 hidden sm:block" />

              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 outline-none"
              >
                {getThemeIcon()}
              </button>

              <button
                onClick={handleLogout}
                className="hidden sm:flex p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 outline-none"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 outline-none"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-0 top-16 z-50 lg:hidden px-4 pb-4"
            >
              <div className="glass-card overflow-hidden">
                <nav className="p-2 space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto">
                  {/* User Profile */}
                  <div className="flex items-center space-x-3 px-4 py-3 mb-2 bg-neutral-50/50 dark:bg-neutral-800/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                      {user?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{role?.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {mobileItems.map(({ path, icon: Icon, label }) => (
                    <Link
                      key={path + label}
                      to={path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none",
                        location.pathname === path
                          ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                    </Link>
                  ))}

                  <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-2" />

                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <span className="text-white font-bold">K</span>
                  </div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Navigation</h3>
                  <div className="space-y-2">
                    {[
                      { keys: ['G', 'D'], desc: 'Dashboard' },
                      { keys: ['G', 'P'], desc: 'POS System' },
                      { keys: ['G', 'O'], desc: 'Delivery Orders' },
                      { keys: ['G', 'I'], desc: 'Dishes & Menu' },
                    ].map(({ keys, desc }) => (
                      <div key={desc} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">{desc}</span>
                        <div className="flex space-x-1">
                          {keys.map(k => (
                            <kbd key={k} className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400 shadow-sm">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
