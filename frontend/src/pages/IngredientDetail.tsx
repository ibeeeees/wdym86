import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts'

const demoForecast = [
  { date: 'Mon', actual: 45, forecast: 48, lower: 38, upper: 58 },
  { date: 'Tue', actual: 52, forecast: 50, lower: 40, upper: 60 },
  { date: 'Wed', actual: 48, forecast: 52, lower: 42, upper: 62 },
  { date: 'Thu', actual: 55, forecast: 55, lower: 45, upper: 65 },
  { date: 'Fri', actual: 68, forecast: 65, lower: 55, upper: 75 },
  { date: 'Sat', actual: 72, forecast: 70, lower: 60, upper: 80 },
  { date: 'Sun', actual: null, forecast: 60, lower: 50, upper: 70 },
]

const demoIngredient = {
  id: '1',
  name: 'Chicken Breast',
  category: 'meat',
  current_inventory: 45,
  unit: 'lbs',
  risk_level: 'URGENT',
  stockout_probability: 0.38,
  days_of_cover: 2,
}

const demoDecision = {
  risk: {
    level: 'URGENT',
    probability: 0.38,
    days_of_cover: 2,
    factors: ['Low inventory vs expected demand', 'Weekend surge expected', 'Moderate weather risk']
  },
  reorder: {
    should_reorder: true,
    date: '2024-02-08',
    quantity: 120,
    urgency: 'high',
    confidence: 0.85
  },
  strategy: {
    type: 'early_order',
    description: 'Place orders earlier to buffer against delays',
    adjusted_lead_time: 4
  },
  explanation: `Chicken Breast shows elevated risk due to current inventory being below expected demand over the next few days. With the weekend approaching, demand typically increases by 20-30%.

Recommendation: Order 120 lbs by February 8th to maintain adequate stock levels. This quantity includes safety stock to account for demand variability.

Key factors: Current inventory of 45 lbs provides only 2 days of cover. Expected weekend surge and moderate weather risk are contributing factors.`
}

const riskStyles: Record<string, string> = {
  SAFE: 'text-green-600 dark:text-green-400',
  MONITOR: 'text-yellow-600 dark:text-yellow-400',
  URGENT: 'text-orange-600 dark:text-orange-400',
  CRITICAL: 'text-red-600 dark:text-red-400',
}

export default function IngredientDetail() {
  useParams()
  const [loading, setLoading] = useState(false)

  const handleRunAnalysis = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-white">{demoIngredient.name}</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm capitalize">{demoIngredient.category} · {demoIngredient.unit}</p>
          </div>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Pipeline</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Inventory</p>
          <p className="text-2xl font-semibold font-mono text-black dark:text-white">{demoIngredient.current_inventory}</p>
          <p className="text-xs text-neutral-400">{demoIngredient.unit}</p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Risk Level</p>
          <p className={`text-2xl font-semibold ${riskStyles[demoIngredient.risk_level]}`}>
            {demoIngredient.risk_level}
          </p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Stockout Prob</p>
          <p className="text-2xl font-semibold font-mono text-black dark:text-white">{(demoIngredient.stockout_probability * 100).toFixed(0)}%</p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Days Cover</p>
          <p className="text-2xl font-semibold font-mono text-black dark:text-white">{demoIngredient.days_of_cover}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 bg-white dark:bg-neutral-800">
        <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4">Demand Forecast (Negative Binomial)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={demoForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="date" stroke="#737373" fontSize={12} />
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
              <Area type="monotone" dataKey="upper" stroke="none" fill="#404040" fillOpacity={0.3} />
              <Area type="monotone" dataKey="lower" stroke="none" fill="#1a1a1a" fillOpacity={1} />
              <Line type="monotone" dataKey="forecast" stroke="#fff" strokeWidth={2} dot={{ fill: '#fff', r: 3 }} />
              <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: '#22c55e', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-neutral-500">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-black dark:bg-white" />
            <span>Forecast</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-green-500" />
            <span>Actual</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-neutral-300 dark:bg-neutral-600 rounded-sm" />
            <span>90% CI</span>
          </div>
        </div>
      </div>

      {/* Agents */}
      <div className="grid grid-cols-3 gap-4">
        {/* Risk Agent */}
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-5 bg-white dark:bg-neutral-800">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-black dark:bg-white rounded text-white dark:text-black flex items-center justify-center text-xs font-mono">1</div>
            <h3 className="font-medium text-black dark:text-white">Risk Agent</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Level</span>
              <span className={`font-medium ${riskStyles[demoDecision.risk.level]}`}>{demoDecision.risk.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Probability</span>
              <span className="font-mono text-black dark:text-white">{(demoDecision.risk.probability * 100).toFixed(0)}%</span>
            </div>
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700">
              <p className="text-neutral-500 dark:text-neutral-400 mb-1">Factors</p>
              <ul className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
                {demoDecision.risk.factors.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Reorder Agent */}
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-5 bg-white dark:bg-neutral-800">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-black dark:bg-white rounded text-white dark:text-black flex items-center justify-center text-xs font-mono">2</div>
            <h3 className="font-medium text-black dark:text-white">Reorder Agent</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Action</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">ORDER NOW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Quantity</span>
              <span className="font-mono text-black dark:text-white">{demoDecision.reorder.quantity} {demoIngredient.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">By Date</span>
              <span className="font-mono text-black dark:text-white">{demoDecision.reorder.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Confidence</span>
              <span className="font-mono text-black dark:text-white">{(demoDecision.reorder.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Strategy Agent */}
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-5 bg-white dark:bg-neutral-800">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-black dark:bg-white rounded text-white dark:text-black flex items-center justify-center text-xs font-mono">3</div>
            <h3 className="font-medium text-black dark:text-white">Strategy Agent</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Strategy</span>
              <span className="font-medium capitalize text-black dark:text-white">{demoDecision.strategy.type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Lead Time</span>
              <span className="font-mono text-black dark:text-white">{demoDecision.strategy.adjusted_lead_time} days</span>
            </div>
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700">
              <p className="text-xs text-neutral-600 dark:text-neutral-300">{demoDecision.strategy.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini Explanation */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 bg-neutral-50 dark:bg-neutral-800/50">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-black dark:bg-white rounded text-white dark:text-black flex items-center justify-center text-xs">G</div>
          <h3 className="font-medium text-black dark:text-white">Gemini Explanation</h3>
          <Link to="/chat" className="ml-auto text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white">
            Ask follow-up →
          </Link>
        </div>
        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
          {demoDecision.explanation}
        </p>
      </div>
    </div>
  )
}
