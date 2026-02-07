import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, RefreshCw, TrendingUp, TrendingDown, Package, AlertTriangle, Wifi, WifiOff, Sparkles, ChevronDown, ChevronUp, Calendar, Download, ShoppingCart, Zap, X, Brain, BarChart3, Truck as TruckIcon, LayoutDashboard, Clock, CheckCircle, Crown, Flame } from 'lucide-react'
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

// Demo data fallback - Mykonos Mediterranean Restaurant ingredients
const demoIngredients: Ingredient[] = [
  // Proteins - Mediterranean
  { id: '1', name: 'Lamb Shoulder', category: 'meat', current_inventory: 45, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.15, trend: 8 },
  { id: '2', name: 'Lamb Chops', category: 'meat', current_inventory: 18, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.42, trend: -15 },
  { id: '3', name: 'Chicken Thighs', category: 'meat', current_inventory: 65, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 3 },
  { id: '4', name: 'Branzino (Sea Bass)', category: 'meat', current_inventory: 12, unit: 'lbs', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.68, trend: -22 },
  { id: '5', name: 'Octopus', category: 'meat', current_inventory: 25, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.18, trend: 5 },
  { id: '6', name: 'Shrimp (Jumbo)', category: 'meat', current_inventory: 35, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.08, trend: 2 },
  // Dairy - Greek
  { id: '7', name: 'Feta Cheese', category: 'dairy', current_inventory: 28, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.22, trend: -8 },
  { id: '8', name: 'Halloumi Cheese', category: 'dairy', current_inventory: 15, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.38, trend: -12 },
  { id: '9', name: 'Greek Yogurt', category: 'dairy', current_inventory: 45, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.06, trend: 0 },
  // Produce - Mediterranean
  { id: '10', name: 'Tomatoes (Roma)', category: 'produce', current_inventory: 85, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.03, trend: 5 },
  { id: '11', name: 'Cucumbers', category: 'produce', current_inventory: 60, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 9, stockout_prob: 0.04, trend: 2 },
  { id: '12', name: 'Red Onions', category: 'produce', current_inventory: 70, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 0 },
  { id: '13', name: 'Eggplant', category: 'produce', current_inventory: 32, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.14, trend: -5 },
  { id: '14', name: 'Bell Peppers (Red)', category: 'produce', current_inventory: 40, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.07, trend: 3 },
  { id: '15', name: 'Fresh Spinach', category: 'produce', current_inventory: 22, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 3, stockout_prob: 0.28, trend: -10 },
  { id: '16', name: 'Lemons', category: 'produce', current_inventory: 55, unit: 'units', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.05, trend: 4 },
  // Grains & Legumes
  { id: '17', name: 'Orzo Pasta', category: 'dry', current_inventory: 80, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 15, stockout_prob: 0.01, trend: 0 },
  { id: '18', name: 'Arborio Rice', category: 'dry', current_inventory: 65, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02, trend: 0 },
  { id: '19', name: 'Phyllo Dough', category: 'dry', current_inventory: 18, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.19, trend: -7 },
  { id: '20', name: 'Chickpeas (Dried)', category: 'dry', current_inventory: 50, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 20, stockout_prob: 0.01, trend: 2 },
  // Oils & Condiments
  { id: '21', name: 'Olive Oil (Extra Virgin)', category: 'dry', current_inventory: 12, unit: 'liters', risk_level: 'CRITICAL', days_of_cover: 2, stockout_prob: 0.55, trend: -18 },
  { id: '22', name: 'Tahini', category: 'dry', current_inventory: 8, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 3, stockout_prob: 0.35, trend: -10 },
  // Fresh Herbs
  { id: '23', name: 'Fresh Oregano', category: 'produce', current_inventory: 5, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.20, trend: 0 },
  { id: '24', name: 'Fresh Dill', category: 'produce', current_inventory: 4, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 3, stockout_prob: 0.25, trend: -5 },
  { id: '25', name: 'Fresh Mint', category: 'produce', current_inventory: 6, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 5, stockout_prob: 0.12, trend: 2 },
  // Bar Ingredients
  { id: '26', name: 'Ouzo', category: 'dry', current_inventory: 8, unit: 'bottles', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.04, trend: 5 },
  { id: '27', name: 'Metaxa', category: 'dry', current_inventory: 5, unit: 'bottles', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.15, trend: 0 },
  { id: '28', name: 'Prosecco', category: 'dry', current_inventory: 18, unit: 'bottles', risk_level: 'SAFE', days_of_cover: 7, stockout_prob: 0.08, trend: 8 },
  { id: '29', name: 'Pomegranate Juice', category: 'dry', current_inventory: 10, unit: 'liters', risk_level: 'SAFE', days_of_cover: 6, stockout_prob: 0.10, trend: 3 },
  { id: '30', name: 'Honey', category: 'dry', current_inventory: 12, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 14, stockout_prob: 0.02, trend: 0 },
]

const weeklyDemand = [
  { day: 'Mon', actual: 2850, forecast: 2900 },
  { day: 'Tue', actual: 3120, forecast: 3050 },
  { day: 'Wed', actual: 3280, forecast: 3200 },
  { day: 'Thu', actual: 3650, forecast: 3500 },
  { day: 'Fri', actual: 4890, forecast: 4700 },
  { day: 'Sat', actual: 5420, forecast: 5200 },
  { day: 'Sun', actual: null, forecast: 3800 },
]

// Demand heatmap data - intensity by day and ingredient category (Mediterranean patterns)
const heatmapData = [
  { category: 'Proteins', Mon: 0.65, Tue: 0.72, Wed: 0.78, Thu: 0.85, Fri: 0.95, Sat: 1.0, Sun: 0.70 },
  { category: 'Produce', Mon: 0.58, Tue: 0.68, Wed: 0.75, Thu: 0.82, Fri: 0.92, Sat: 0.98, Sun: 0.62 },
  { category: 'Dairy', Mon: 0.55, Tue: 0.60, Wed: 0.68, Thu: 0.75, Fri: 0.85, Sat: 0.90, Sun: 0.58 },
  { category: 'Dry Goods', Mon: 0.45, Tue: 0.50, Wed: 0.55, Thu: 0.62, Fri: 0.70, Sat: 0.75, Sun: 0.42 },
]

// Top dishes data for dashboard widget
const topDishesToday = [
  { name: 'Lamb Souvlaki', orders: 32, trend: 11.4 },
  { name: 'Greek Salad', orders: 28, trend: 6.8 },
  { name: 'Baklava', orders: 25, trend: 9.1 },
  { name: 'Classic Hummus', orders: 22, trend: 5.2 },
  { name: 'Grilled Branzino', orders: 20, trend: -5.2 },
]

// Get heatmap cell color based on intensity (0-1)
const getHeatmapColor = (intensity: number): string => {
  if (intensity >= 0.9) return 'bg-red-500'
  if (intensity >= 0.8) return 'bg-orange-500'
  if (intensity >= 0.7) return 'bg-yellow-500'
  if (intensity >= 0.5) return 'bg-green-400'
  return 'bg-green-200'
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
        // Demo summary - Mykonos Mediterranean Restaurant
        setDailySummary(`Kalimera! Here's your inventory briefing for Mykonos Mediterranean:

**Priority Items:**
- **Branzino (Sea Bass)** is at CRITICAL risk with only 1 day of cover. Order from Mediterranean Seafood Co. immediately.
- **Olive Oil (Extra Virgin)** is running low - essential for tonight's service. Contact Aegean Imports.
- **Lamb Chops** and **Halloumi Cheese** show URGENT risk. Weekend dinner reservations are 40% above average.

**Menu Insights:**
- **Lamb Souvlaki** is your #1 seller (195 orders/wk, +11.4%) — driving high Lamb Chops demand (243.8 lbs/wk projected).
- **Shrimp Saganaki** is trending up fast (+12.3%) — consider promoting as a special.
- **Chicken Souvlaki** is declining (-7.8%) and **Grilled Branzino** is down (-5.2%). Consider refreshing plating or running a lunch special to boost orders.

**Today's Outlook:**
- 4 items need immediate attention
- Friday evening: Expecting 180+ covers (Grilled Branzino, Lamb Souvlaki popular)
- Mezze platters trending up 25% this week

**Recommendation:** Place urgent orders before 2 PM for same-day delivery. Feature Shrimp Saganaki and Moussaka to reduce lamb dependency tonight.`)
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
    { name: 'Proteins', value: ingredients.filter(i => i.category === 'meat' || i.category === 'protein').reduce((s, i) => s + i.current_inventory, 0) },
    { name: 'Produce', value: ingredients.filter(i => i.category === 'produce').reduce((s, i) => s + i.current_inventory, 0) },
    { name: 'Dairy', value: ingredients.filter(i => i.category === 'dairy').reduce((s, i) => s + i.current_inventory, 0) },
    { name: 'Pantry', value: ingredients.filter(i => i.category === 'dry' || i.category === 'dry_goods' || i.category === 'grains').reduce((s, i) => s + i.current_inventory, 0) },
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
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-black dark:text-white">Inventory Dashboard</h1>
              {apiConnected !== null && (
                <span className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                  apiConnected
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400'
                }`}>
                  {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{apiConnected ? 'Live' : 'Demo Mode'}</span>
                </span>
              )}
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">
              {criticalCount > 0 ? (
                <span className="text-red-600 dark:text-red-400 font-medium">{criticalCount} items need immediate attention</span>
              ) : (
                'All items at healthy levels'
              )}
            </p>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing...' : 'Run Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Daily AI Summary */}
      {dailySummary && (
        <div className="border border-red-200 dark:border-red-900 rounded-lg overflow-hidden bg-gradient-to-r from-red-50 to-indigo-50 dark:from-red-900/20 dark:to-indigo-900/20">
          <button
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
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
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Total Items</p>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-red-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white">{ingredients.length}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl p-5 border border-red-200 dark:border-red-900 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Critical</p>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {ingredients.filter(i => i.risk_level === 'CRITICAL').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-5 border border-orange-200 dark:border-orange-900 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Urgent</p>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {ingredients.filter(i => i.risk_level === 'URGENT').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-5 border border-green-200 dark:border-green-900 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Safe</p>
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {ingredients.filter(i => i.risk_level === 'SAFE').length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Est. Value</p>
            <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">$</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white font-mono">${totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Demand Forecast */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-black dark:text-white">Weekly Demand Forecast</h3>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full" />
                <span className="text-neutral-500 dark:text-neutral-400">Forecast</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                <span className="text-neutral-500 dark:text-neutral-400">Actual</span>
              </div>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyDemand}>
                <XAxis dataKey="day" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'white',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                  }}
                />
                <Line type="monotone" dataKey="forecast" stroke="url(#forecastGradient)" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#fff' }} />
                <Line type="monotone" dataKey="actual" stroke="url(#actualGradient)" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#22c55e', r: 4, strokeWidth: 2, stroke: '#fff' }} />
                <defs>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-black dark:text-white mb-4">Inventory by Category</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'white',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                  }}
                />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Dishes Today */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-black dark:text-white flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Top Dishes Today</span>
            </h3>
            <Link to="/dishes" className="text-xs text-neutral-400 hover:text-black dark:hover:text-white flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {topDishesToday.map((dish, i) => (
              <div key={dish.name} className="flex items-center space-x-3">
                <div className="w-6 flex-shrink-0 text-center">
                  {i === 0 ? (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <span className="text-xs font-bold text-neutral-400">#{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-black dark:text-white truncate">{dish.name}</span>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <span className="text-xs font-mono text-neutral-500">{dish.orders}</span>
                      <span className={`text-xs font-semibold flex items-center ${dish.trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {dish.trend > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                        {dish.trend > 0 ? '+' : ''}{dish.trend}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

      {/* Live Delivery Orders */}
      <div className="bg-gradient-to-r from-red-50 via-purple-50 to-fuchsia-50 dark:from-red-900/20 dark:via-purple-900/20 dark:to-fuchsia-900/20 rounded-2xl p-5 border border-red-200 dark:border-red-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <TruckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-black dark:text-white">Live Delivery Orders</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">DoorDash, Uber Eats, Grubhub</p>
            </div>
          </div>
          <Link
            to="/delivery"
            className="flex items-center space-x-1.5 px-4 py-2 bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all hover:scale-105"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Preparing', customer: 'Maria K.', total: 86.50, items: 'Lamb Souvlaki, Greek Salad', color: 'from-red-500 to-red-600' },
            { platform: 'Uber Eats', label: 'UE', labelColor: 'bg-green-500 text-white', status: 'Confirmed', customer: 'Nikos P.', total: 124.75, items: 'Mezze Platter, Grilled Branzino', color: 'from-green-500 to-emerald-600' },
            { platform: 'Grubhub', label: 'GH', labelColor: 'bg-orange-500 text-white', status: 'Out for Delivery', customer: 'Elena S.', total: 78.90, items: 'Moussaka, Baklava x2', color: 'from-orange-500 to-red-500' },
            { platform: 'DoorDash', label: 'DD', labelColor: 'bg-red-500 text-white', status: 'Pending', customer: 'Dimitri T.', total: 145.25, items: 'Seafood Paella, Wine', color: 'from-red-500 to-red-600' },
          ].map((order, i) => (
            <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${order.labelColor}`}>{order.label}</span>
                  <span className="text-xs font-medium text-neutral-500">{order.platform}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  order.status === 'Pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                  order.status === 'Confirmed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                  order.status === 'Preparing' ? 'bg-purple-100 dark:bg-purple-900/30 text-red-700' :
                  'bg-green-100 dark:bg-green-900/30 text-green-600'
                }`}>
                  {order.status === 'Out for Delivery' ? 'On the way' : order.status}
                </span>
              </div>
              <p className="font-medium text-black dark:text-white text-sm">{order.customer}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-bold text-black dark:text-white">${order.total.toFixed(2)}</span>
                {order.status === 'Pending' && (
                  <button className="flex items-center space-x-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors">
                    <CheckCircle className="w-3 h-3" />
                    <span>Accept</span>
                  </button>
                )}
                {order.status === 'Out for Delivery' && (
                  <span className="flex items-center space-x-1 text-xs text-green-500">
                    <Clock className="w-3 h-3" />
                    <span>~10 min</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
      <div className="bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-black dark:text-white">Inventory Overview</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{ingredients.length} items tracked</p>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
              <Package className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-neutral-500 mt-4 font-medium">Loading inventory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Item</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Inventory</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Risk</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Stockout %</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Trend</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {ingredients.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                          item.category === 'meat' ? 'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30' :
                          item.category === 'produce' ? 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30' :
                          item.category === 'dairy' ? 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30' :
                          'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30'
                        }`}>
                          <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{item.category === 'meat' ? 'MT' : item.category === 'produce' ? 'PR' : item.category === 'dairy' ? 'DY' : 'GR'}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-black dark:text-white">{item.name}</p>
                          <p className="text-xs text-neutral-400 capitalize">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <InventoryGauge
                        inventory={item.current_inventory}
                        daysOfCover={item.days_of_cover}
                        unit={item.unit}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        item.risk_level === 'CRITICAL' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30' :
                        item.risk_level === 'URGENT' ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-500/30' :
                        item.risk_level === 'MONITOR' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white shadow-lg shadow-yellow-500/30' :
                        'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                      }`}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        <span>{item.risk_level}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-bold text-black dark:text-white">
                        {(item.stockout_prob * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2">
                        <MiniSparkline trend={item.trend} />
                        <div className="flex items-center space-x-1">
                          {item.trend > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : item.trend < 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : null}
                          <span className={`text-sm font-mono font-bold ${item.trend > 0 ? 'text-green-600' : item.trend < 0 ? 'text-red-600' : 'text-neutral-400'}`}>
                            {item.trend > 0 ? '+' : ''}{item.trend}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/ingredient/${item.id}`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-all group-hover:scale-105"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Pipeline */}
      <div className="bg-gradient-to-r from-red-50 via-indigo-50 to-purple-50 dark:from-red-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-900">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-black dark:text-white">AI Pipeline</h2>
        </div>
        <div className="flex items-center justify-between text-sm">
          {[
            { label: 'Forecast', desc: 'NumPy TCN', icon: BarChart3, color: 'from-blue-400 to-cyan-500' },
            { label: 'Risk', desc: 'Agent', icon: AlertTriangle, color: 'from-orange-400 to-red-500' },
            { label: 'Reorder', desc: 'Agent', icon: ShoppingCart, color: 'from-green-400 to-emerald-500' },
            { label: 'Strategy', desc: 'Agent', icon: TruckIcon, color: 'from-purple-400 to-pink-500' },
            { label: 'Explain', desc: 'Gemini', icon: Sparkles, color: 'from-amber-400 to-orange-500' },
          ].map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.label} className="flex items-center">
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                    analyzing && i === 1
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse'
                      : `bg-gradient-to-br ${step.color}`
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-black dark:text-white mt-2">{step.label}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{step.desc}</p>
                </div>
                {i < 4 && (
                  <div className="w-8 sm:w-12 h-1 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-full mx-2 sm:mx-4" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Welcome to wdym86</h2>
                <button onClick={() => setShowWelcome(false)} className="p-1 hover:bg-white/20 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-red-100 mt-1 text-sm">AI-Powered Restaurant Inventory Intelligence</p>
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
                  { icon: TruckIcon, title: 'Strategy Agent', desc: 'Adapts to disruptions and suggests supplier actions', color: 'bg-purple-100 dark:bg-purple-900/30 text-red-700 dark:text-purple-400' },
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
