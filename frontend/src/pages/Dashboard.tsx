import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, RefreshCw } from 'lucide-react'

const demoIngredients = [
  { id: '1', name: 'Chicken Breast', category: 'meat', current_inventory: 45, unit: 'lbs', risk_level: 'URGENT', days_of_cover: 2, stockout_prob: 0.38 },
  { id: '2', name: 'Ground Beef', category: 'meat', current_inventory: 80, unit: 'lbs', risk_level: 'MONITOR', days_of_cover: 5, stockout_prob: 0.15 },
  { id: '3', name: 'Romaine Lettuce', category: 'produce', current_inventory: 35, unit: 'cases', risk_level: 'SAFE', days_of_cover: 8, stockout_prob: 0.03 },
  { id: '4', name: 'Tomatoes', category: 'produce', current_inventory: 120, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 12, stockout_prob: 0.02 },
  { id: '5', name: 'Salmon Fillet', category: 'meat', current_inventory: 15, unit: 'lbs', risk_level: 'CRITICAL', days_of_cover: 1, stockout_prob: 0.65 },
  { id: '6', name: 'Cheese Blend', category: 'dairy', current_inventory: 50, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 10, stockout_prob: 0.04 },
  { id: '7', name: 'Avocados', category: 'produce', current_inventory: 80, unit: 'units', risk_level: 'MONITOR', days_of_cover: 4, stockout_prob: 0.18 },
  { id: '8', name: 'Flour', category: 'dry', current_inventory: 200, unit: 'lbs', risk_level: 'SAFE', days_of_cover: 20, stockout_prob: 0.01 },
]

const riskStyles: Record<string, { dot: string; text: string }> = {
  SAFE: { dot: 'bg-green-500', text: 'text-green-700' },
  MONITOR: { dot: 'bg-yellow-500', text: 'text-yellow-700' },
  URGENT: { dot: 'bg-orange-500', text: 'text-orange-700' },
  CRITICAL: { dot: 'bg-red-500', text: 'text-red-700' },
}

export default function Dashboard() {
  const [loading, setLoading] = useState(false)

  const criticalCount = demoIngredients.filter(i => i.risk_level === 'CRITICAL' || i.risk_level === 'URGENT').length

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-black">Inventory</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {criticalCount > 0 ? (
              <span className="text-red-600">{criticalCount} items need attention</span>
            ) : (
              'All items at healthy levels'
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Analyze</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: demoIngredients.length },
          { label: 'Critical', value: demoIngredients.filter(i => i.risk_level === 'CRITICAL').length, color: 'text-red-600' },
          { label: 'Urgent', value: demoIngredients.filter(i => i.risk_level === 'URGENT').length, color: 'text-orange-600' },
          { label: 'Safe', value: demoIngredients.filter(i => i.risk_level === 'SAFE').length, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-neutral-200 rounded-lg p-4">
            <p className="text-sm text-neutral-500">{label}</p>
            <p className={`text-2xl font-semibold ${color || 'text-black'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Item</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Stock</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Coverage</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Risk</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Probability</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {demoIngredients.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-black">{item.name}</p>
                    <p className="text-xs text-neutral-400 capitalize">{item.category}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-sm">{item.current_inventory} {item.unit}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-sm">{item.days_of_cover}d</span>
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
                  <span className="font-mono text-sm">{(item.stockout_prob * 100).toFixed(0)}%</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    to={`/ingredient/${item.id}`}
                    className="inline-flex items-center text-sm text-neutral-500 hover:text-black transition-colors"
                  >
                    <span>View</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pipeline */}
      <div className="border border-neutral-200 rounded-lg p-6">
        <h2 className="text-sm font-medium text-neutral-500 mb-4">AI Pipeline</h2>
        <div className="flex items-center justify-between text-sm">
          {[
            { label: 'Forecast', desc: 'NumPy TCN' },
            { label: 'Risk', desc: 'Agent' },
            { label: 'Reorder', desc: 'Agent' },
            { label: 'Strategy', desc: 'Agent' },
            { label: 'Explain', desc: 'Gemini' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-mono text-sm">
                  {i + 1}
                </div>
                <p className="font-medium text-black mt-2">{step.label}</p>
                <p className="text-xs text-neutral-400">{step.desc}</p>
              </div>
              {i < 4 && (
                <div className="w-12 h-px bg-neutral-200 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
