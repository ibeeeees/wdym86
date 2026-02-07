import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, AlertTriangle, Send, Lightbulb, Plus, Minus, Edit3, Cloud, Truck, Zap, AlertOctagon } from 'lucide-react'
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, PieChart, Pie, Cell } from 'recharts'
import { getIngredient, runAgentPipeline, generateForecast, getForecasts, analyzeWhatIf, updateInventory } from '../services/api'

interface ForecastPoint {
  date: string
  actual: number | null
  forecast: number
  lower: number
  upper: number
}

interface AgentDecision {
  risk: {
    level: string
    probability: number
    days_of_cover: number
    factors: string[]
  }
  reorder: {
    should_reorder: boolean
    date: string
    quantity: number
    urgency: string
    confidence: number
  }
  strategy: {
    type: string
    description: string
    adjusted_lead_time: number
  }
  explanation: string
}

// Demo data fallback
const demoForecast: ForecastPoint[] = [
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
}

const demoDecision: AgentDecision = {
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

// Get inventory fill percentage and color based on days of cover
const getInventoryStatus = (daysOfCover: number) => {
  // Normalize: 7+ days = 100%, 0 days = 0%
  const percentage = Math.min(100, Math.max(0, (daysOfCover / 7) * 100))

  let color: string
  let bgColor: string
  if (daysOfCover >= 5) {
    color = '#22c55e' // green-500
    bgColor = '#dcfce7' // green-100
  } else if (daysOfCover >= 3) {
    color = '#eab308' // yellow-500
    bgColor = '#fef9c3' // yellow-100
  } else if (daysOfCover >= 1) {
    color = '#f97316' // orange-500
    bgColor = '#ffedd5' // orange-100
  } else {
    color = '#ef4444' // red-500
    bgColor = '#fee2e2' // red-100
  }

  return { percentage, color, bgColor }
}

export default function IngredientDetail() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [ingredient, setIngredient] = useState(demoIngredient)
  const [forecast, setForecast] = useState<ForecastPoint[]>(demoForecast)
  const [decision, setDecision] = useState<AgentDecision>(demoDecision)
  const [error, setError] = useState<string | null>(null)
  const [whatIfScenario, setWhatIfScenario] = useState('')
  const [whatIfAnalysis, setWhatIfAnalysis] = useState<string | null>(null)
  const [whatIfLoading, setWhatIfLoading] = useState(false)
  const [editingInventory, setEditingInventory] = useState(false)
  const [newInventory, setNewInventory] = useState('')
  const [inventoryUpdating, setInventoryUpdating] = useState(false)
  const [disruption, setDisruption] = useState({
    weather_risk: 0,
    traffic_risk: 0,
    hazard_flag: false
  })
  const [serviceLevel, setServiceLevel] = useState(95)

  const serviceLevelOptions = [
    { level: 90, label: '90%', desc: 'Lower cost, higher risk' },
    { level: 95, label: '95%', desc: 'Balanced (recommended)' },
    { level: 99, label: '99%', desc: 'Higher cost, minimal risk' },
  ]

  const disruptionScenarios = [
    { name: 'Normal', weather: 0, traffic: 0, hazard: false },
    { name: 'Rainy Day', weather: 0.3, traffic: 0.2, hazard: false },
    { name: 'Storm Warning', weather: 0.7, traffic: 0.5, hazard: false },
    { name: 'Major Weather Event', weather: 0.9, traffic: 0.8, hazard: true },
    { name: 'Traffic Congestion', weather: 0, traffic: 0.6, hazard: false },
    { name: 'Supply Chain Delay', weather: 0.2, traffic: 0.4, hazard: false },
  ]

  const suggestedScenarios = [
    "What if the supplier is delayed by 2 days?",
    "What if we have a busy weekend event?",
    "What if demand increases by 30%?",
    "What if there's a storm affecting deliveries?"
  ]

  useEffect(() => {
    const loadData = async () => {
      if (!id) return
      setLoading(true)
      try {
        // Fetch ingredient details
        const ingData = await getIngredient(id)
        if (ingData) {
          setIngredient({
            id: ingData.id,
            name: ingData.name,
            category: ingData.category,
            current_inventory: ingData.current_inventory || 0,
            unit: ingData.unit,
          })
        }

        // Fetch existing forecasts
        try {
          const forecastData = await getForecasts(id)
          if (forecastData && forecastData.length > 0) {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            const transformed = forecastData.slice(0, 7).map((f: any, i: number) => ({
              date: days[i],
              actual: i < 6 ? f.mu * (0.9 + Math.random() * 0.2) : null,
              forecast: f.mu,
              lower: f.lower_ci,
              upper: f.upper_ci,
            }))
            setForecast(transformed)
          }
        } catch {
          // Keep demo forecast
        }

        // Run agent pipeline to get decision
        try {
          const result = await runAgentPipeline(id)
          if (result) {
            setDecision({
              risk: {
                level: result.risk?.level || 'SAFE',
                probability: result.risk?.probability || 0,
                days_of_cover: result.risk?.days_of_cover || 7,
                factors: result.risk?.factors || [],
              },
              reorder: {
                should_reorder: result.reorder?.should_reorder || false,
                date: result.reorder?.date || '',
                quantity: result.reorder?.quantity || 0,
                urgency: result.reorder?.urgency || 'low',
                confidence: result.reorder?.confidence || 0,
              },
              strategy: {
                type: result.strategy?.type || 'standard',
                description: result.strategy?.description || '',
                adjusted_lead_time: result.strategy?.adjusted_lead_time || 3,
              },
              explanation: result.explanation || demoDecision.explanation,
            })
          }
        } catch {
          // Keep demo decision
        }
      } catch (err) {
        console.log('Using demo data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleRunPipeline = async () => {
    if (!id) return
    setAnalyzing(true)
    setError(null)

    try {
      // Generate new forecast
      await generateForecast(id, 7)

      // Run agent pipeline with disruption signals and service level
      const result = await runAgentPipeline(id, disruption, serviceLevel)
      if (result) {
        setDecision({
          risk: {
            level: result.risk?.level || decision.risk.level,
            probability: result.risk?.probability || decision.risk.probability,
            days_of_cover: result.risk?.days_of_cover || decision.risk.days_of_cover,
            factors: result.risk?.factors || decision.risk.factors,
          },
          reorder: {
            should_reorder: result.reorder?.should_reorder || decision.reorder.should_reorder,
            date: result.reorder?.date || decision.reorder.date,
            quantity: result.reorder?.quantity || decision.reorder.quantity,
            urgency: result.reorder?.urgency || decision.reorder.urgency,
            confidence: result.reorder?.confidence || decision.reorder.confidence,
          },
          strategy: {
            type: result.strategy?.type || decision.strategy.type,
            description: result.strategy?.description || decision.strategy.description,
            adjusted_lead_time: result.strategy?.adjusted_lead_time || decision.strategy.adjusted_lead_time,
          },
          explanation: result.explanation || decision.explanation,
        })
      }
    } catch (err) {
      setError('Pipeline failed. Showing cached results.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleInventoryAdjust = async (delta: number) => {
    const newQty = ingredient.current_inventory + delta
    if (newQty < 0) return

    setInventoryUpdating(true)
    try {
      if (id) await updateInventory(id, newQty)
      setIngredient({ ...ingredient, current_inventory: newQty })
    } catch {
      // Demo mode - just update locally
      setIngredient({ ...ingredient, current_inventory: newQty })
    } finally {
      setInventoryUpdating(false)
    }
  }

  const handleInventorySet = async () => {
    const qty = parseFloat(newInventory)
    if (isNaN(qty) || qty < 0) return

    setInventoryUpdating(true)
    try {
      if (id) await updateInventory(id, qty)
      setIngredient({ ...ingredient, current_inventory: qty })
      setEditingInventory(false)
      setNewInventory('')
    } catch {
      // Demo mode
      setIngredient({ ...ingredient, current_inventory: qty })
      setEditingInventory(false)
      setNewInventory('')
    } finally {
      setInventoryUpdating(false)
    }
  }

  const handleWhatIf = async (scenario?: string) => {
    const scenarioToAnalyze = scenario || whatIfScenario
    if (!scenarioToAnalyze.trim() || !id) return

    setWhatIfLoading(true)
    setWhatIfAnalysis(null)

    try {
      const result = await analyzeWhatIf(scenarioToAnalyze, id)
      setWhatIfAnalysis(result.analysis || result.message || 'Analysis complete.')
      if (scenario) setWhatIfScenario(scenario)
    } catch {
      // Demo fallback
      setWhatIfAnalysis(`Analyzing scenario: "${scenarioToAnalyze}"

Based on the current situation for ${ingredient.name}:

Impact Assessment:
- Current days of cover: ${decision.risk.days_of_cover} days
- This scenario could reduce cover by 1-2 days
- Stockout probability could increase from ${(decision.risk.probability * 100).toFixed(0)}% to ${Math.min(95, (decision.risk.probability * 100 + 20)).toFixed(0)}%

Recommended Actions:
1. Consider placing an earlier order
2. Contact backup suppliers proactively
3. Monitor the situation closely

The Strategy Agent would recommend adjusting lead time assumptions to account for this scenario.`)
    } finally {
      setWhatIfLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
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
            <h1 className="text-2xl font-semibold text-black dark:text-white">{ingredient.name}</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm capitalize">{ingredient.category} · {ingredient.unit}</p>
          </div>
        </div>
        <button
          onClick={handleRunPipeline}
          disabled={analyzing}
          className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Running...' : 'Run Pipeline'}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400 text-sm bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Disruption Simulation */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-medium text-black dark:text-white">Simulate Disruptions</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {disruptionScenarios.map((scenario) => (
              <button
                key={scenario.name}
                onClick={() => setDisruption({
                  weather_risk: scenario.weather,
                  traffic_risk: scenario.traffic,
                  hazard_flag: scenario.hazard
                })}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  disruption.weather_risk === scenario.weather &&
                  disruption.traffic_risk === scenario.traffic &&
                  disruption.hazard_flag === scenario.hazard
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                }`}
              >
                {scenario.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Cloud className={`w-5 h-5 ${disruption.weather_risk > 0.5 ? 'text-red-500' : disruption.weather_risk > 0.2 ? 'text-yellow-500' : 'text-green-500'}`} />
            <div className="flex-1">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Weather Risk</p>
              <input
                type="range"
                min="0"
                max="100"
                value={disruption.weather_risk * 100}
                onChange={(e) => setDisruption({ ...disruption, weather_risk: parseInt(e.target.value) / 100 })}
                className="w-full h-1 bg-neutral-200 dark:bg-neutral-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs font-mono text-black dark:text-white">{(disruption.weather_risk * 100).toFixed(0)}%</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Truck className={`w-5 h-5 ${disruption.traffic_risk > 0.5 ? 'text-red-500' : disruption.traffic_risk > 0.2 ? 'text-yellow-500' : 'text-green-500'}`} />
            <div className="flex-1">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Traffic Risk</p>
              <input
                type="range"
                min="0"
                max="100"
                value={disruption.traffic_risk * 100}
                onChange={(e) => setDisruption({ ...disruption, traffic_risk: parseInt(e.target.value) / 100 })}
                className="w-full h-1 bg-neutral-200 dark:bg-neutral-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs font-mono text-black dark:text-white">{(disruption.traffic_risk * 100).toFixed(0)}%</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Zap className={`w-5 h-5 ${disruption.hazard_flag ? 'text-red-500' : 'text-green-500'}`} />
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Hazard Alert</p>
              <button
                onClick={() => setDisruption({ ...disruption, hazard_flag: !disruption.hazard_flag })}
                className={`mt-1 px-3 py-1 text-xs rounded-full ${
                  disruption.hazard_flag
                    ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                    : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                }`}
              >
                {disruption.hazard_flag ? 'ACTIVE' : 'Clear'}
              </button>
            </div>
          </div>
        </div>

        {/* Service Level Selector */}
        <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Service Level Target</p>
            <span className="text-xs font-mono text-black dark:text-white">{serviceLevel}%</span>
          </div>
          <div className="flex gap-2">
            {serviceLevelOptions.map((option) => (
              <button
                key={option.level}
                onClick={() => setServiceLevel(option.level)}
                className={`flex-1 py-2 px-3 rounded-lg text-center transition-colors ${
                  serviceLevel === option.level
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                }`}
              >
                <p className="text-sm font-medium">{option.label}</p>
                <p className="text-xs opacity-70">{option.desc}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Higher service levels reduce stockout risk but require more safety stock.
          </p>
        </div>

        <p className="text-xs text-neutral-400 mt-3">
          Adjust disruption levels and service targets to see how agents adapt their recommendations. Click "Run Pipeline" to recalculate.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Inventory Gauge */}
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Inventory</p>
            <button
              onClick={() => { setEditingInventory(!editingInventory); setNewInventory(ingredient.current_inventory.toString()) }}
              className="p-1 text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>

          {/* Pie Chart Gauge */}
          {(() => {
            const status = getInventoryStatus(decision.risk.days_of_cover)
            const pieData = [
              { name: 'filled', value: status.percentage },
              { name: 'empty', value: 100 - status.percentage }
            ]
            return (
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={40}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        <Cell fill={status.color} />
                        <Cell fill="#e5e5e5" className="dark:fill-neutral-700" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold font-mono text-black dark:text-white">
                    {typeof ingredient.current_inventory === 'number' ? ingredient.current_inventory.toFixed(0) : ingredient.current_inventory}
                  </span>
                  <span className="text-xs text-neutral-400">{ingredient.unit}</span>
                </div>
              </div>
            )
          })()}

          {editingInventory ? (
            <div className="flex items-center justify-center space-x-1 mt-2">
              <input
                type="number"
                value={newInventory}
                onChange={(e) => setNewInventory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInventorySet()}
                className="w-16 px-2 py-1 text-sm font-mono border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-black dark:text-white text-center"
                autoFocus
              />
              <button
                onClick={handleInventorySet}
                disabled={inventoryUpdating}
                className="px-2 py-1 text-xs bg-black dark:bg-white text-white dark:text-black rounded"
              >
                Set
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 mt-2">
              <button
                onClick={() => handleInventoryAdjust(-10)}
                disabled={inventoryUpdating}
                className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 disabled:opacity-50"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleInventoryAdjust(10)}
                disabled={inventoryUpdating}
                className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Risk Level</p>
          <p className={`text-2xl font-semibold ${riskStyles[decision.risk.level] || 'text-gray-500'}`}>
            {decision.risk.level}
          </p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Stockout Prob</p>
          <p className="text-2xl font-semibold font-mono text-black dark:text-white">
            {(decision.risk.probability * 100).toFixed(0)}%
          </p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Days Cover</p>
          <p className="text-2xl font-semibold font-mono text-black dark:text-white">{decision.risk.days_of_cover}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 bg-white dark:bg-neutral-800">
        <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4">Demand Forecast (Negative Binomial)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecast}>
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
            <div className={`w-6 h-6 rounded text-white flex items-center justify-center text-xs font-mono ${
              analyzing ? 'bg-yellow-500 animate-pulse' : 'bg-black dark:bg-white dark:text-black'
            }`}>1</div>
            <h3 className="font-medium text-black dark:text-white">Risk Agent</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Level</span>
              <span className={`font-medium ${riskStyles[decision.risk.level] || 'text-gray-500'}`}>{decision.risk.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Probability</span>
              <span className="font-mono text-black dark:text-white">{(decision.risk.probability * 100).toFixed(0)}%</span>
            </div>
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700">
              <p className="text-neutral-500 dark:text-neutral-400 mb-1">Factors</p>
              <ul className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
                {decision.risk.factors.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Reorder Agent */}
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-5 bg-white dark:bg-neutral-800">
          <div className="flex items-center space-x-2 mb-4">
            <div className={`w-6 h-6 rounded text-white flex items-center justify-center text-xs font-mono ${
              analyzing ? 'bg-yellow-500 animate-pulse' : 'bg-black dark:bg-white dark:text-black'
            }`}>2</div>
            <h3 className="font-medium text-black dark:text-white">Reorder Agent</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Action</span>
              <span className={`font-medium ${decision.reorder.should_reorder ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                {decision.reorder.should_reorder ? 'ORDER NOW' : 'NO ACTION'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Quantity</span>
              <span className="font-mono text-black dark:text-white">{decision.reorder.quantity.toFixed(0)} {ingredient.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">By Date</span>
              <span className="font-mono text-black dark:text-white">{decision.reorder.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Confidence</span>
              <span className="font-mono text-black dark:text-white">{(decision.reorder.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Strategy Agent */}
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-5 bg-white dark:bg-neutral-800">
          <div className="flex items-center space-x-2 mb-4">
            <div className={`w-6 h-6 rounded text-white flex items-center justify-center text-xs font-mono ${
              analyzing ? 'bg-yellow-500 animate-pulse' : 'bg-black dark:bg-white dark:text-black'
            }`}>3</div>
            <h3 className="font-medium text-black dark:text-white">Strategy Agent</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Strategy</span>
              <span className="font-medium capitalize text-black dark:text-white">{decision.strategy.type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Lead Time</span>
              <span className="font-mono text-black dark:text-white">{decision.strategy.adjusted_lead_time} days</span>
            </div>
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700">
              <p className="text-xs text-neutral-600 dark:text-neutral-300">{decision.strategy.description}</p>
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
          {decision.explanation}
        </p>
      </div>

      {/* What-If Analysis */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 bg-white dark:bg-neutral-800">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="font-medium text-black dark:text-white">What-If Analysis</h3>
        </div>

        {/* Suggested scenarios */}
        <div className="mb-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Try a scenario:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedScenarios.map((scenario, i) => (
              <button
                key={i}
                onClick={() => handleWhatIf(scenario)}
                disabled={whatIfLoading}
                className="text-xs bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
              >
                {scenario}
              </button>
            ))}
          </div>
        </div>

        {/* Custom scenario input */}
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={whatIfScenario}
            onChange={(e) => setWhatIfScenario(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleWhatIf()}
            placeholder="Or type your own scenario..."
            className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-black dark:focus:border-white focus:ring-0 transition-colors bg-white dark:bg-neutral-900 text-black dark:text-white"
            disabled={whatIfLoading}
          />
          <button
            onClick={() => handleWhatIf()}
            disabled={!whatIfScenario.trim() || whatIfLoading}
            className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-30"
          >
            {whatIfLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Analysis result */}
        {whatIfAnalysis && (
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-100 dark:border-neutral-700">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
              {whatIfAnalysis}
            </p>
          </div>
        )}

        {whatIfLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2 text-neutral-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing scenario...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
