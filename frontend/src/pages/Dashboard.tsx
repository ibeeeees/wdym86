import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, RefreshCw, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts'

const demoIngredients = [
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

const categoryData = [
  { name: 'Meat', value: 140, risk: 2 },
  { name: 'Produce', value: 235, risk: 1 },
  { name: 'Dairy', value: 50, risk: 0 },
  { name: 'Dry', value: 200, risk: 0 },
]

const riskStyles: Record<string, { dot: string; text: string; bg: string }> = {
  SAFE: { dot: 'bg-green-500', text: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
  MONITOR: { dot: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  URGENT: { dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  CRITICAL: { dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
}

export default function Dashboard() {
  const [loading, setLoading] = useState(false)

  const criticalCount = demoIngredients.filter(i => i.risk_level === 'CRITICAL' || i.risk_level === 'URGENT').length
  const totalValue = demoIngredients.reduce((sum, i) => sum + i.current_inventory * 5, 0)

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white">Inventory Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            {criticalCount > 0 ? (
              <span className="text-red-600 dark:text-red-400">{criticalCount} items need immediate attention</span>
            ) : (
              'All items at healthy levels'
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Analysis</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Items</p>
            <Package className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="text-2xl font-semibold text-black dark:text-white mt-1">{demoIngredients.length}</p>
        </div>
        <div className="border border-red-200 dark:border-red-900 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">
            {demoIngredients.filter(i => i.risk_level === 'CRITICAL').length}
          </p>
        </div>
        <div className="border border-orange-200 dark:border-orange-900 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
          <p className="text-sm text-orange-600 dark:text-orange-400">Urgent</p>
          <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400 mt-1">
            {demoIngredients.filter(i => i.risk_level === 'URGENT').length}
          </p>
        </div>
        <div className="border border-green-200 dark:border-green-900 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
          <p className="text-sm text-green-600 dark:text-green-400">Safe</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">
            {demoIngredients.filter(i => i.risk_level === 'SAFE').length}
          </p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Est. Value</p>
          <p className="text-2xl font-semibold text-black dark:text-white mt-1 font-mono">${totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
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
              <div className="w-3 h-0.5 bg-green-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #22c55e, #22c55e 2px, transparent 2px, transparent 4px)' }} />
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

      {/* Inventory Table */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Item</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Stock</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Coverage</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Risk</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Stockout %</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Trend</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
            {demoIngredients.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-black dark:text-white">{item.name}</p>
                    <p className="text-xs text-neutral-400 capitalize">{item.category}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-sm text-black dark:text-white">{item.current_inventory} {item.unit}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-sm text-black dark:text-white">{item.days_of_cover}d</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${riskStyles[item.risk_level].dot}`} />
                    <span className={`text-sm font-medium ${riskStyles[item.risk_level].text}`}>
                      {item.risk_level}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-sm text-black dark:text-white">{(item.stockout_prob * 100).toFixed(0)}%</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-1">
                    {item.trend > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : item.trend < 0 ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <div className="w-4 h-0.5 bg-neutral-300" />
                    )}
                    <span className={`text-xs font-mono ${item.trend > 0 ? 'text-green-600' : item.trend < 0 ? 'text-red-600' : 'text-neutral-400'}`}>
                      {item.trend > 0 ? '+' : ''}{item.trend}%
                    </span>
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
                <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-mono text-sm">
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
    </div>
  )
}
