import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, RefreshCw, TrendingUp, TrendingDown, Package, AlertTriangle, Wifi, WifiOff, Sparkles, ChevronDown, ChevronUp, Calendar, Download, ShoppingCart, Zap, X, Brain, BarChart3, Truck as TruckIcon } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { getIngredients, runAgentPipeline, checkApiHealth, getDailySummary, getActiveEvents } from '../services/api'

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

// Demo data fallback
const demoIngredients: Ingredient[] = [
  { id: '1', name: 'Chicken Breast', category: 'meat', current_inventory: 45, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.38, trend: -12 },
  { id: '2', name: 'Ground Beef', category: 'meat', current_inventory: 80, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.15, trend: 5 },
  { id: '3', name: 'Romaine Lettuce', category: 'produce', current_inventory: 35, unit: 'cases', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.03, trend: 0 },
  { id: '4', name: 'Tomatoes', category: 'produce', current_inventory: 120, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 8 },
  { id: '5', name: 'Salmon Fillet', category: 'meat', current_inventory: 15, unit: 'lbs', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.65, trend: -25 },
  { id: '6', name: 'Cheese Blend', category: 'dairy', current_inventory: 50, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.04, trend: 2 },
  { id: '7', name: 'Avocados', category: 'produce', current_inventory: 80, unit: 'units', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.18, trend: -8 },
  { id: '8', name: 'Flour', category: 'dry', current_inventory: 200, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 20, stockout_prob: 0.01, trend: 0 },
]

const weeklyDemand = [
  { day: 'Mon', actual: 145, forecast: 150 },
  { day: 'Tue', actual: 162, forecast: 158 },
  { day: 'Wed', actual: 155, forecast: 160 },
  { day: 'Thu', actual: 178, forecast: 172 },
  { day: 'Fri', actual: 210, forecast: 195 },
  { day: 'Sat', actual: 245, forecast: 230 },
  { day: 'Sun', actual: null, forecast: 185 },
]

// Demand heatmap data - intensity by day and ingredient category
const heatmapData = [
  { category: 'Meat', Mon: 0.7, Tue: 0.75, Wed: 0.8, Thu: 0.85, Fri: 0.95, Sat: 1.0, Sun: 0.6 },
  { category: 'Produce', Mon: 0.6, Tue: 0.7, Wed: 0.75, Thu: 0.8, Fri: 0.9, Sat: 0.95, Sun: 0.55 },
  { category: 'Dairy', Mon: 0.5, Tue: 0.55, Wed: 0.6, Thu: 0.7, Fri: 0.8, Sat: 0.85, Sun: 0.5 },
  { category: 'Dry Goods', Mon: 0.4, Tue: 0.45, Wed: 0.5, Thu: 0.55, Fri: 0.6, Sat: 0.65, Sun: 0.35 },
]

// Get heatmap cell color based on intensity (0-1)
const getHeatmapColor = (intensity: number): string => {
  if (intensity >= 0.9) return 'bg-red-500'
  if (intensity >= 0.8) return 'bg-orange-500'
  if (intensity >= 0.7) return 'bg-yellow-500'
  if (intensity >= 0.5) return 'bg-green-400'
  return 'bg-green-200'
}

const riskStyles: Record<string, { dot: string; text: string }> = {
  SAFE: { dot: 'bg-green-500', text: 'text-green-700 dark:text-green-400' },
  MONITOR: { dot: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' },
  URGENT: { dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400' },
  CRITICAL: { dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400' },
}

// Get inventory gauge color based on days of cover
const getInventoryColor = (daysOfCover: number): string => {
  if (daysOfCover >= 7) return '#22c55e' // green-500
  if (daysOfCover >= 5) return '#84cc16' // lime-500
  if (daysOfCover >= 3) return '#eab308' // yellow-500
  if (daysOfCover >= 1) return '#f97316' // orange-500
  return '#ef4444' // red-500
}

// Mini sparkline component for trend visualization
const MiniSparkline = ({ trend }: { trend: number }) => {
  // Generate synthetic sparkline data based on trend
  const baseValue = 50
  const data = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    value: baseValue + (trend / 7) * i + Math.random() * 5 - 2.5
  }))

  const color = trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#a3a3a3'

  return (
    <div className="w-16 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.2}
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
    <div className="flex items-center space-x-2">
      <div className="w-10 h-10 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={12}
              outerRadius={18}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={color} />
              <Cell fill="#e5e5e5" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] font-bold text-neutral-600 dark:text-neutral-300">{daysOfCover}d</span>
        </div>
      </div>
      <div className="text-sm">
        <span className="font-mono font-medium text-black dark:text-white">
          {typeof inventory === 'number' ? inventory.toFixed(0) : inventory}
        </span>
        <span className="text-neutral-400 ml-1">{unit}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(demoIngredients)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dailySummary, setDailySummary] = useState<string | null>(null)
  const [summaryExpanded, setSummaryExpanded] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [activeEvents, setActiveEvents] = useState<string[]>([])
  const [showWelcome, setShowWelcome] = useState(false)

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
        // Demo summary
        setDailySummary(`Good morning! Here's your inventory briefing for today:

**Priority Items:**
- **Salmon Fillet** is at CRITICAL risk with only 1 day of cover. Recommend ordering immediately.
- **Chicken Breast** shows URGENT risk. Weekend demand surge expected.

**Today's Outlook:**
- 2 items need immediate attention
- 5 items are stable with adequate stock
- Overall stockout risk: Moderate

**Recommendation:** Place orders for Salmon and Chicken before 2 PM for next-day delivery.`)
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
    setError(null)
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
      setIngredients(demoIngredients)
    } finally {
      setLoading(false)
    }
  }

  const handleRunAnalysis = async () => {
    setAnalyzing(true)
    setError(null)

    try {
      // Run agent pipeline for each ingredient
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
      setError('Analysis failed. Using cached data.')
    } finally {
      setAnalyzing(false)
    }
  }

  const criticalCount = ingredients.filter(i => i.risk_level === 'CRITICAL' || i.risk_level === 'URGENT').length
  const totalValue = ingredients.reduce((sum, i) => sum + i.current_inventory * 5, 0)

  const categoryData = [
    { name: 'Meat', value: ingredients.filter(i => i.category === 'meat').reduce((s, i) => s + i.current_inventory, 0) },
    { name: 'Produce', value: ingredients.filter(i => i.category === 'produce').reduce((s, i) => s + i.current_inventory, 0) },
    { name: 'Dairy', value: ingredients.filter(i => i.category === 'dairy').reduce((s, i) => s + i.current_inventory, 0) },
    { name: 'Dry', value: ingredients.filter(i => i.category === 'dry' || i.category === 'dry_goods').reduce((s, i) => s + i.current_inventory, 0) },
  ]

  const handleExportCSV = () => {
    const headers = ['Name', 'Category', 'Inventory', 'Unit', 'Risk Level', 'Days Cover', 'Stockout Prob', 'Trend']
    const rows = ingredients.map(i => [
      i.name,
      i.category,
      i.current_inventory,
      i.unit,
      i.risk_level,
      i.days_of_cover,
      `${(i.stockout_prob * 100).toFixed(1)}%`,
      `${i.trend > 0 ? '+' : ''}${i.trend}%`
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-black dark:text-white">Inventory Dashboard</h1>
            {apiConnected !== null && (
              <span className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                apiConnected
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              }`}>
                {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{apiConnected ? 'Live' : 'Demo'}</span>
              </span>
            )}
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            {criticalCount > 0 ? (
              <span className="text-red-600 dark:text-red-400">{criticalCount} items need immediate attention</span>
            ) : (
              'All items at healthy levels'
            )}
          </p>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={analyzing}
          className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Analyzing...' : 'Run Analysis'}</span>
        </button>
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-3 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Daily AI Summary */}
      {dailySummary && (
        <div className="border border-violet-200 dark:border-violet-900 rounded-lg overflow-hidden bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20">
          <button
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-black dark:text-white">AI Daily Briefing</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  {activeEvents.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded text-xs">
                      {activeEvents.length} active event{activeEvents.length > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {summaryExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
          </button>
          {summaryExpanded && (
            <div className="px-4 pb-4">
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                {summaryLoading ? (
                  <div className="flex items-center space-x-2 text-neutral-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Generating briefing...</span>
                  </div>
                ) : (
                  <div className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
                    {dailySummary.split('**').map((part, i) =>
                      i % 2 === 1 ? <strong key={i} className="text-black dark:text-white">{part}</strong> : part
                    )}
                  </div>
                )}
              </div>
              {activeEvents.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeEvents.map((event, i) => (
                    <span key={i} className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-xs text-neutral-600 dark:text-neutral-400">
                      {event}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Items</p>
            <Package className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="text-2xl font-semibold text-black dark:text-white mt-1">{ingredients.length}</p>
        </div>
        <div className="border border-red-200 dark:border-red-900 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">
            {ingredients.filter(i => i.risk_level === 'CRITICAL').length}
          </p>
        </div>
        <div className="border border-orange-200 dark:border-orange-900 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
          <p className="text-sm text-orange-600 dark:text-orange-400">Urgent</p>
          <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400 mt-1">
            {ingredients.filter(i => i.risk_level === 'URGENT').length}
          </p>
        </div>
        <div className="border border-green-200 dark:border-green-900 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
          <p className="text-sm text-green-600 dark:text-green-400">Safe</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">
            {ingredients.filter(i => i.risk_level === 'SAFE').length}
          </p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Est. Value</p>
          <p className="text-2xl font-semibold text-black dark:text-white mt-1 font-mono">${totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Demand Forecast */}
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4">Weekly Demand (All Items)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyDemand}>
                <XAxis dataKey="day" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'white'
                  }}
                />
                <Line type="monotone" dataKey="forecast" stroke="#000" strokeWidth={2} dot={{ fill: '#000', r: 3 }} />
                <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: '#22c55e', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-2 text-xs text-neutral-500">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-black dark:bg-white" />
              <span>Forecast</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-green-500" />
              <span>Actual</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4">Inventory by Category</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="value" fill="#000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Smart Reorder Suggestions */}
      {ingredients.filter(i => i.risk_level === 'CRITICAL' || i.risk_level === 'URGENT').length > 0 && (
        <div className="border border-orange-200 dark:border-orange-900 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-medium text-black dark:text-white">Smart Reorder Suggestions</h3>
            </div>
            <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded-full">
              {ingredients.filter(i => i.risk_level === 'CRITICAL' || i.risk_level === 'URGENT').length} items
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ingredients
              .filter(i => i.risk_level === 'CRITICAL' || i.risk_level === 'URGENT')
              .map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg border border-orange-100 dark:border-orange-900/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-8 rounded-full ${item.risk_level === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'}`} />
                    <div>
                      <p className="font-medium text-sm text-black dark:text-white">{item.name}</p>
                      <p className="text-xs text-neutral-500">
                        {item.current_inventory} {item.unit} · {item.days_of_cover}d cover
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/ingredient/${item.id}`}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Order</span>
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Demand Heatmap */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4">Weekly Demand Heatmap</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs text-neutral-500 dark:text-neutral-400 pb-2">Category</th>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <th key={day} className="text-center text-xs text-neutral-500 dark:text-neutral-400 pb-2 px-1">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row) => (
                <tr key={row.category}>
                  <td className="text-sm text-black dark:text-white py-1.5 pr-4 whitespace-nowrap">{row.category}</td>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                    const intensity = row[day as keyof typeof row] as number
                    return (
                      <td key={day} className="px-1 py-1.5">
                        <div
                          className={`w-full h-8 rounded ${getHeatmapColor(intensity)} flex items-center justify-center`}
                          title={`${row.category} - ${day}: ${(intensity * 100).toFixed(0)}%`}
                        >
                          <span className="text-[10px] font-mono text-white/80">{(intensity * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-neutral-500">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-200" />
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
            <p className="text-sm text-neutral-500 mt-2">Loading inventory...</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Item</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Inventory</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Risk</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Stockout %</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Trend</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {ingredients.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-black dark:text-white">{item.name}</p>
                      <p className="text-xs text-neutral-400 capitalize">{item.category}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <InventoryGauge
                      inventory={item.current_inventory}
                      daysOfCover={item.days_of_cover}
                      unit={item.unit}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${riskStyles[item.risk_level]?.dot || 'bg-gray-400'}`} />
                      <span className={`text-sm font-medium ${riskStyles[item.risk_level]?.text || 'text-gray-500'}`}>
                        {item.risk_level}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm text-black dark:text-white">
                      {(item.stockout_prob * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <MiniSparkline trend={item.trend} />
                      <div className="flex items-center space-x-1">
                        {item.trend > 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : item.trend < 0 ? (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        ) : null}
                        <span className={`text-xs font-mono ${item.trend > 0 ? 'text-green-600' : item.trend < 0 ? 'text-red-600' : 'text-neutral-400'}`}>
                          {item.trend > 0 ? '+' : ''}{item.trend}%
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      to={`/ingredient/${item.id}`}
                      className="inline-flex items-center text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* AI Pipeline */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 bg-white dark:bg-neutral-800">
        <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4">AI Pipeline</h2>
        <div className="flex items-center justify-between text-sm">
          {[
            { label: 'Forecast', desc: 'NumPy TCN', status: 'done' },
            { label: 'Risk', desc: 'Agent', status: 'done' },
            { label: 'Reorder', desc: 'Agent', status: 'done' },
            { label: 'Strategy', desc: 'Agent', status: 'done' },
            { label: 'Explain', desc: 'Gemini', status: 'done' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm ${
                  analyzing && i === 1
                    ? 'bg-yellow-500 text-white animate-pulse'
                    : 'bg-black dark:bg-white text-white dark:text-black'
                }`}>
                  {i + 1}
                </div>
                <p className="font-medium text-black dark:text-white mt-2">{step.label}</p>
                <p className="text-xs text-neutral-400">{step.desc}</p>
              </div>
              {i < 4 && (
                <div className="w-12 h-px bg-neutral-200 dark:bg-neutral-700 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Welcome to wdym86</h2>
                <button onClick={() => setShowWelcome(false)} className="p-1 hover:bg-white/20 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-violet-100 mt-1 text-sm">AI-Powered Restaurant Inventory Intelligence</p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Your dashboard uses autonomous AI agents to help you manage inventory. Here's what they do:
              </p>

              <div className="space-y-3">
                {[
                  { icon: BarChart3, title: 'Forecasting', desc: 'NumPy TCN model predicts demand with uncertainty bounds', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                  { icon: AlertTriangle, title: 'Risk Agent', desc: 'Detects stockout risk and calculates days of cover', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
                  { icon: ShoppingCart, title: 'Reorder Agent', desc: 'Recommends optimal order timing and quantities', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
                  { icon: TruckIcon, title: 'Strategy Agent', desc: 'Adapts to disruptions and suggests supplier actions', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
                  { icon: Brain, title: 'Gemini Explain', desc: 'Provides natural language explanations for decisions', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
                ].map(({ icon: Icon, title, desc, color }) => (
                  <div key={title} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-black dark:text-white">{title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-xs text-neutral-400">
                Press <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded">?</kbd> anytime for keyboard shortcuts
              </div>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowWelcome(false)}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
