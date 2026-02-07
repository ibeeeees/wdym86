import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, RefreshCw, TrendingUp, TrendingDown, Package, AlertTriangle, Wifi, WifiOff, Sparkles, ChevronDown, Calendar, Download, Zap, X, Brain, BarChart3, LayoutDashboard, CheckCircle, Crown, Flame, Search } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { getIngredients, runAgentPipeline, checkApiHealth, getDailySummary, getActiveEvents } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getCuisineTemplate } from '../data/cuisineTemplates'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../components/Layout'

interface Ingredient {
  id: string
  name: string
  category: string
  current_inventory: number
  unit: string
  risk_level: string
  days_of_cover: number
  stockout_prob: number
  trend: number
}

// Demo data fallback - Mykonos Mediterranean Restaurant ingredients
// const demoIngredients: Ingredient[] = [ ... ] (Removed unused demo data to fix lint/build)


const weeklyDemand = [
  { day: 'Mon', actual: 2850, forecast: 2900 },
  { day: 'Tue', actual: 3120, forecast: 3050 },
  { day: 'Wed', actual: 3280, forecast: 3200 },
  { day: 'Thu', actual: 3650, forecast: 3500 },
  { day: 'Fri', actual: 4890, forecast: 4700 },
  { day: 'Sat', actual: 5420, forecast: 5200 },
  { day: 'Sun', actual: null, forecast: 3800 },
]



// Get inventory gauge color based on days of cover
const getInventoryColor = (daysOfCover: number): string => {
  if (daysOfCover >= 7) return '#10b981' // risk-safe
  if (daysOfCover >= 5) return '#84cc16' // lime
  if (daysOfCover >= 3) return '#f59e0b' // risk-monitor
  if (daysOfCover >= 1) return '#f97316' // risk-urgent
  return '#ef4444' // risk-critical
}

// Mini sparkline component for trend visualization
const MiniSparkline = ({ trend }: { trend: number }) => {
  // Generate synthetic sparkline data based on trend
  const baseValue = 50
  const data = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    value: baseValue + (trend / 7) * i + Math.random() * 5 - 2.5
  }))

  const color = trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#a1a1aa'

  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`sparkGradient-${trend}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#sparkGradient-${trend})`}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Mini inventory gauge component
const InventoryGauge = ({ inventory, daysOfCover, unit }: { inventory: number; daysOfCover: number; unit: string }) => {
  const percentage = Math.min(100, Math.max(0, (daysOfCover / 10) * 100))
  const color = getInventoryColor(daysOfCover)
  const pieData = [
    { name: 'filled', value: percentage },
    { name: 'empty', value: 100 - percentage }
  ]

  return (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={13}
              outerRadius={18}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={color} />
              <Cell fill="#e4e4e7" className="dark:fill-neutral-700" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-bold text-neutral-600 dark:text-neutral-300">{daysOfCover}d</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white leading-none">
          {typeof inventory === 'number' ? inventory.toFixed(0) : inventory}
        </span>
        <span className="text-[10px] text-neutral-400 uppercase tracking-wide">{unit}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { cuisineType } = useAuth()
  const template = getCuisineTemplate(cuisineType)
  const [ingredients, setIngredients] = useState<Ingredient[]>(template.ingredients)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)

  const [dailySummary, setDailySummary] = useState<string | null>(null)
  const [summaryExpanded, setSummaryExpanded] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [activeEvents, setActiveEvents] = useState<string[]>([])
  const [showWelcome, setShowWelcome] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Check for first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('wdym86_visited')
    if (!hasVisited) {
      setShowWelcome(true)
      localStorage.setItem('wdym86_visited', 'true')
    }
  }, [])

  // Check API connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkApiHealth()
      setApiConnected(connected)
      if (connected) {
        await fetchIngredients()
        fetchDailySummary()
        fetchActiveEvents()
      } else {
        setDailySummary(template.dailyBriefing)
      }
    }
    checkConnection()
  }, [])

  const fetchDailySummary = async () => {
    setSummaryLoading(true)
    try {
      const data = await getDailySummary('demo-restaurant-id')
      if (data?.summary) {
        setDailySummary(data.summary)
      }
    } catch {
      // Keep demo summary if API fails
    } finally {
      setSummaryLoading(false)
    }
  }

  const fetchActiveEvents = async () => {
    try {
      const data = await getActiveEvents()
      if (data?.events) {
        setActiveEvents(data.events.map((e: any) => e.name))
      }
    } catch {
      // No events in demo mode
    }
  }

  const fetchIngredients = async () => {
    setLoading(true)

    try {
      const data = await getIngredients('demo-restaurant-id')
      if (data && data.length > 0) {
        // Transform API data to match our interface
        const transformed = data.map((ing: any) => ({
          id: ing.id,
          name: ing.name,
          category: ing.category,
          current_inventory: ing.current_inventory || 0,
          unit: ing.unit,
          risk_level: ing.risk_level || 'SAFE',
          days_of_cover: ing.days_of_cover || 7,
          stockout_prob: ing.stockout_probability || 0,
          trend: ing.trend || 0,
        }))
        setIngredients(transformed)
      }
    } catch (err) {
      console.log('Using demo data (API unavailable)')
      setIngredients(template.ingredients)
    } finally {
      setLoading(false)
    }
  }

  const handleRunAnalysis = async () => {
    setAnalyzing(true)

    try {
      const updatedIngredients = await Promise.all(
        ingredients.map(async (ing) => {
          try {
            const result = await runAgentPipeline(ing.id)
            return {
              ...ing,
              risk_level: result.risk?.level || ing.risk_level,
              stockout_prob: result.risk?.probability || ing.stockout_prob,
              days_of_cover: result.risk?.days_of_cover || ing.days_of_cover,
            }
          } catch {
            return ing
          }
        })
      )
      setIngredients(updatedIngredients)
    } catch (err) {
      console.error('Analysis failed', err)
    } finally {
      setAnalyzing(false)
    }
  }

  const criticalCount = ingredients.filter(i => i.risk_level === 'CRITICAL' || i.risk_level === 'URGENT').length
  const totalValue = ingredients.reduce((sum, i) => sum + i.current_inventory * 5, 0)

  const categoryData = [
    { name: 'Proteins', value: ingredients.filter(i => i.category === 'meat' || i.category === 'protein').reduce((s, i) => s + i.current_inventory, 0) },
    { name: 'Produce', value: ingredients.filter(i => i.category === 'produce').reduce((s, i) => s + i.current_inventory, 0) },
    { name: 'Dairy', value: ingredients.filter(i => i.category === 'dairy').reduce((s, i) => s + i.current_inventory, 0) },
    { name: 'Pantry', value: ingredients.filter(i => i.category === 'dry' || i.category === 'dry_goods' || i.category === 'grains').reduce((s, i) => s + i.current_inventory, 0) },
  ]

  const handleExportCSV = () => {
    const headers = ['Name', 'Category', 'Inventory', 'Unit', 'Risk Level', 'Days Cover', 'Stockout Prob', 'Trend']
    const rows = ingredients.map(i => [
      i.name, i.category, i.current_inventory, i.unit, i.risk_level, i.days_of_cover,
      `${(i.stockout_prob * 100).toFixed(1)}%`, `${i.trend > 0 ? '+' : ''}${i.trend}%`
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredIngredients = ingredients.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 animate-in zoom-in duration-300">
            <LayoutDashboard className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Dashboard</h1>
              {apiConnected !== null && (
                <div className={cn(
                  "flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border",
                  apiConnected
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800"
                )}>
                  {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{apiConnected ? 'Live' : 'Demo'}</span>
                </div>
              )}
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1 flex items-center space-x-2">
              <span>Overview for {template.restaurantName}</span>
              <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all card-hover"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="group flex items-center space-x-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-70"
          >
            <RefreshCw className={cn("w-4 h-4 transition-transform", analyzing && "animate-spin")} />
            <span>{analyzing ? 'Analyzing...' : 'Run Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Daily AI Summary */}
      <AnimatePresence>
        {dailySummary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl overflow-hidden border border-primary-100 dark:border-primary-900/50 bg-gradient-to-r from-primary-50/50 to-indigo-50/50 dark:from-primary-900/10 dark:to-indigo-900/10"
          >
            <button
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              className="w-full flex items-center justify-between p-5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-neutral-900 dark:text-white">AI Daily Briefing</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Generated just now</span>
                    {activeEvents.length > 0 && (
                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-[10px] font-bold uppercase tracking-wide">
                        {activeEvents.length} Events
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={cn("p-2 rounded-lg text-neutral-400 transition-transform duration-300", summaryExpanded && "rotate-180")}>
                <ChevronDown className="w-5 h-5" />
              </div>
            </button>
            <AnimatePresence>
              {summaryExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-0">
                    <div className="bg-white/60 dark:bg-neutral-900/60 rounded-xl p-5 border border-primary-100/50 dark:border-primary-900/30 backdrop-blur-sm">
                      {summaryLoading ? (
                        <div className="flex items-center space-x-3 text-neutral-500 py-4">
                          <RefreshCw className="w-5 h-5 animate-spin text-primary-500" />
                          <span className="text-sm font-medium">Generating insights...</span>
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                            {dailySummary.split('**').map((part, i) =>
                              i % 2 === 1 ? <span key={i} className="font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-1 rounded">{part}</span> : part
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {activeEvents.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {activeEvents.map((event, i) => (
                          <span key={i} className="px-3 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-xs font-medium text-neutral-600 dark:text-neutral-300 shadow-sm flex items-center space-x-1.5">
                            <Calendar className="w-3 h-3 text-primary-500" />
                            <span>{event}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Items', value: ingredients.length, icon: Package, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-neutral-800' },
          { label: 'Critical', value: ingredients.filter(i => i.risk_level === 'CRITICAL').length, icon: AlertTriangle, color: 'text-risk-critical', bg: 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' },
          { label: 'Urgent', value: ingredients.filter(i => i.risk_level === 'URGENT').length, icon: Zap, color: 'text-risk-urgent', bg: 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30' },
          { label: 'Safe', value: ingredients.filter(i => i.risk_level === 'SAFE').length, icon: CheckCircle, color: 'text-risk-safe', bg: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' },
          { label: 'Est. Value', value: `$${totalValue.toLocaleString()}`, icon: Crown, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "glass-card p-5 hover:shadow-lg transition-all hover:-translate-y-1",
              stat.bg === 'bg-primary-50 dark:bg-neutral-800' ? '' : "border " + stat.bg.split(' ')[2] // hacky border extraction but works for now or just generic border
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Forecast Chart */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Demand Forecast</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Next 7 days prediction vs actuals</p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-medium">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-primary-500 shadow-sm shadow-primary-500/50" />
                  <span className="text-neutral-600 dark:text-neutral-400">Forecast</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <span className="text-neutral-600 dark:text-neutral-400">Actual</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyDemand} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    tickCount={5}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 23, 23, 0.9)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: 'white',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: 'white' }}
                    cursor={{ stroke: '#52525b', strokeDasharray: '4 4' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="url(#colorForecast)"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={3}
                    strokeDasharray="4 4"
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Inventory Overview</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{filteredIngredients.length} items</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all w-full sm:w-64"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
                <p className="text-neutral-500 text-sm">Loading inventory data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/20 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4">Inventory</th>
                      <th className="px-6 py-4">Risk Level</th>
                      <th className="px-6 py-4">Consumption</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/50 dark:divide-neutral-800/50">
                    {filteredIngredients.map((item) => (
                      <tr key={item.id} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                              item.category === 'meat' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                                item.category === 'produce' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                  item.category === 'dairy' ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' :
                                    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                            )}>
                              {item.category.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900 dark:text-white">{item.name}</p>
                              <p className="text-xs text-neutral-500 capitalize">{item.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <InventoryGauge inventory={item.current_inventory} daysOfCover={item.days_of_cover} unit={item.unit} />
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                            item.risk_level === 'CRITICAL' ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" :
                              item.risk_level === 'URGENT' ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30" :
                                item.risk_level === 'MONITOR' ? "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" :
                                  "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full",
                              item.risk_level === 'CRITICAL' ? "bg-red-500" :
                                item.risk_level === 'URGENT' ? "bg-orange-500" :
                                  item.risk_level === 'MONITOR' ? "bg-yellow-500" :
                                    "bg-emerald-500"
                            )} />
                            <span>{item.risk_level}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <MiniSparkline trend={item.trend} />
                              <span className={cn(
                                "text-xs font-bold",
                                item.trend > 0 ? "text-emerald-600" : item.trend < 0 ? "text-red-600" : "text-neutral-400"
                              )}>
                                {item.trend > 0 ? '+' : ''}{item.trend}%
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link to={`/ingredient/${item.id}`} className="inline-flex p-2 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                            <ArrowRight className="w-5 h-5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-6">
          {/* Top Dishes */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                <span>Top Trending</span>
              </h3>
              <Link to="/dishes" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {template.topDishesToday.map((dish, i) => (
                <div key={dish.name} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-colors",
                      i === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500" :
                        i === 1 ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400" :
                          i === 2 ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-500" :
                            "bg-transparent text-neutral-400"
                    )}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-neutral-900 dark:text-white group-hover:text-primary-500 transition-colors">{dish.name}</p>
                      <p className="text-xs text-neutral-500">{dish.orders} orders today</p>
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs font-bold flex items-center bg-neutral-50 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md",
                    dish.trend > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {dish.trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(dish.trend)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reorder Suggestions */}
          {criticalCount > 0 && (
            <div className="glass-card p-6 border-l-4 border-l-red-500 bg-red-50/10 dark:bg-red-900/5">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Attention Needed</h3>
              </div>
              <div className="space-y-3">
                {ingredients
                  .filter(i => i.risk_level === 'CRITICAL')
                  .slice(0, 3)
                  .map(item => (
                    <div key={item.id} className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-red-500 font-medium">{item.days_of_cover} days left</p>
                      </div>
                      <button className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-lg hover:alpha-90 transition-opacity">
                        Order
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Category Distribution */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Category Spread</h3>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#8b5cf6', '#10b981', '#0ea5e9', '#f59e0b'][index % 4]} />
                    ))}
                  </Bar>
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', fontSize: '12px', color: 'white' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {showWelcome && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <button onClick={() => setShowWelcome(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-2xl font-bold">Welcome to wdym86</h2>
                <p className="text-primary-100 text-sm mt-1">Next-Gen Inventory Intelligence</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-4">
                {[
                  { icon: BarChart3, title: 'Smart Forecasting', desc: 'Predictive analytics for precise demand planning' },
                  { icon: AlertTriangle, title: 'Risk Detection', desc: 'Real-time alerts for critical stock levels' },
                  { icon: Brain, title: 'AI Insights', desc: 'Automated reasoning for inventory optimization' },
                ].map(({ icon: Icon, title, desc }, _i) => (
                  <div key={title} className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">{title}</h4>
                      <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => setShowWelcome(false)}
                  className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:shadow-lg hover:scale-[1.01] transition-all"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
