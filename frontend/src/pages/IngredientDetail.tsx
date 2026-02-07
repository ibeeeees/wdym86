import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts'

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
  SAFE: 'text-green-600',
  MONITOR: 'text-yellow-600',
  URGENT: 'text-orange-600',
  CRITICAL: 'text-red-600',
}

export default function IngredientDetail() {
  const { id } = useParams()
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
          <Link to="/" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-black">{demoIngredient.name}</h1>
            <p className="text-neutral-500 text-sm capitalize">{demoIngredient.category} • {demoIngredient.unit}</p>
          </div>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Pipeline</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Inventory</p>
          <p className="text-2xl font-semibold font-mono">{demoIngredient.current_inventory}</p>
          <p className="text-xs text-neutral-400">{demoIngredient.unit}</p>
        </div>
        <div className="border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Risk Level</p>
          <p className={`text-2xl font-semibold ${riskStyles[demoIngredient.risk_level]}`}>
            {demoIngredient.risk_level}
          </p>
        </div>
        <div className="border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Stockout Prob</p>
          <p className="text-2xl font-semibold font-mono">{(demoIngredient.stockout_probability * 100).toFixed(0)}%</p>
        </div>
        <div className="border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Days Cover</p>
          <p className="text-2xl font-semibold font-mono">{demoIngredient.days_of_cover}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="border border-neutral-200 rounded-lg p-6">
        <h2 className="text-sm font-medium text-neutral-500 mb-4">Demand Forecast (Negative Binomial)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={demoForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="date" stroke="#737373" fontSize={12} />
              <YAxis stroke="#737373" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area type="monotone" dataKey="upper" stroke="none" fill="#e5e5e5" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="white" />
              <Line type="monotone" dataKey="forecast" stroke="#000" strokeWidth={2} dot={{ fill: '#000', r: 3 }} />
              <Line type="monotone" dataKey="actual" stroke="#737373" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: '#737373', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-neutral-500">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-black" />
            <span>Forecast</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-neutral-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #737373, #737373 2px, transparent 2px, transparent 4px)' }} />
            <span>Actual</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-neutral-200 rounded-sm" />
            <span>90% CI</span>
          </div>
        </div>
      </div>

      {/* Agents */}
      <div className="grid grid-cols-3 gap-4">
        {/* Risk Agent */}
        <div className="border border-neutral-200 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-black rounded text-white flex items-center justify-center text-xs font-mono">1</div>
            <h3 className="font-medium">Risk Agent</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Level</span>
              <span className={`font-medium ${riskStyles[demoDecision.risk.level]}`}>{demoDecision.risk.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Probability</span>
              <span className="font-mono">{(demoDecision.risk.probability * 100).toFixed(0)}%</span>
            </div>
            <div className="pt-2 border-t border-neutral-100">
              <p className="text-neutral-500 mb-1">Factors</p>
              <ul className="text-xs text-neutral-600 space-y-1">
                {demoDecision.risk.factors.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Reorder Agent */}
        <div className="border border-neutral-200 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-black rounded text-white flex items-center justify-center text-xs font-mono">2</div>
            <h3 className="font-medium">Reorder Agent</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Action</span>
              <span className="font-medium text-orange-600">ORDER NOW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Quantity</span>
              <span className="font-mono">{demoDecision.reorder.quantity} {demoIngredient.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">By Date</span>
              <span className="font-mono">{demoDecision.reorder.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Confidence</span>
              <span className="font-mono">{(demoDecision.reorder.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Strategy Agent */}
        <div className="border border-neutral-200 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-black rounded text-white flex items-center justify-center text-xs font-mono">3</div>
            <h3 className="font-medium">Strategy Agent</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Strategy</span>
              <span className="font-medium capitalize">{demoDecision.strategy.type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Lead Time</span>
              <span className="font-mono">{demoDecision.strategy.adjusted_lead_time} days</span>
            </div>
            <div className="pt-2 border-t border-neutral-100">
              <p className="text-xs text-neutral-600">{demoDecision.strategy.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini Explanation */}
      <div className="border border-neutral-200 rounded-lg p-6 bg-neutral-50">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-black rounded text-white flex items-center justify-center text-xs">G</div>
          <h3 className="font-medium">Gemini Explanation</h3>
          <Link to="/chat" className="ml-auto text-sm text-neutral-500 hover:text-black">
            Ask follow-up →
          </Link>
        </div>
        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
          {demoDecision.explanation}
        </p>
      </div>
    </div>
  )
}
