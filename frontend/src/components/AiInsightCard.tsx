import { useState, useEffect } from 'react'
import { Sparkles, AlertTriangle, TrendingUp, Info, RefreshCw, Truck, Brain, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getCuisineTemplate } from '../data/cuisineTemplates'
import { generateStructuredInsights } from '../services/geminiTools'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

interface AiInsightCardProps {
  type: 'dashboard' | 'menu' | 'procurement'
}

interface DashboardInsight {
  title: string
  description: string
  severity: string
  type: string
}

interface MenuSuggestion {
  dish_name: string
  action: string
  reason: string
  detail: string
}

interface ProcurementRec {
  action: string
  details: string
  savings_estimate: string
  priority: string
}

const headerConfig = {
  dashboard: { icon: Sparkles, label: 'AI Insights', gradient: 'from-purple-500 to-indigo-600' },
  menu: { icon: Brain, label: 'Menu Intelligence', gradient: 'from-orange-500 to-red-500' },
  procurement: { icon: Truck, label: 'Procurement AI', gradient: 'from-blue-500 to-cyan-600' },
}

const severityDot: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
}

const typeIcon = (t: string) => {
  if (t === 'risk') return AlertTriangle
  if (t === 'opportunity') return TrendingUp
  return Info
}

export default function AiInsightCard({ type }: AiInsightCardProps) {
  const { cuisineType } = useAuth()
  const template = getCuisineTemplate(cuisineType || 'mediterranean')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = `ai_insights_${type}_${cuisineType || 'mediterranean'}`

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)

    // Check sessionStorage cache
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        setData(JSON.parse(cached))
        setLoading(false)
        return
      } catch {
        sessionStorage.removeItem(cacheKey)
      }
    }

    if (!GEMINI_API_KEY) {
      console.error('[AiInsight] No GEMINI_API_KEY found in environment')
      setError('API key not configured')
      setLoading(false)
      return
    }

    try {
      const result = await generateStructuredInsights(GEMINI_API_KEY, type, template)
      setData(result)
      sessionStorage.setItem(cacheKey, JSON.stringify(result))
    } catch (err: any) {
      console.error('[AiInsight] Failed to generate insights:', err)
      setError(err?.message || 'Failed to generate')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    sessionStorage.removeItem(cacheKey)
    fetchInsights()
  }

  useEffect(() => {
    const timer = setTimeout(fetchInsights, 1000)
    return () => clearTimeout(timer)
  }, [type, cuisineType])

  const { icon: HeaderIcon, label, gradient } = headerConfig[type]

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradient} px-5 py-3.5 flex items-center justify-between`}>
        <div className="flex items-center space-x-2.5">
          <HeaderIcon className="w-5 h-5 text-white" />
          <h3 className="text-sm font-bold text-white">{label}</h3>
          <span className="text-[10px] text-white/70 font-medium">Powered by Gemini</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-white ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-start space-x-3">
                <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
                  <div className="h-3 bg-neutral-100 dark:bg-neutral-750 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <Zap className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Could not generate insights</p>
            <button onClick={handleRefresh} className="mt-2 text-xs text-red-500 hover:underline font-medium">Try again</button>
          </div>
        )}

        {!loading && !error && data && type === 'dashboard' && (
          <div className="space-y-4">
            {(data.insights as DashboardInsight[])?.map((insight, i) => {
              const t = insight.type?.toLowerCase()
              const sev = insight.severity?.toLowerCase()
              const Icon = typeIcon(t)
              return (
                <div key={i} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    t === 'risk' ? 'bg-red-100 dark:bg-red-900/30' :
                    t === 'opportunity' ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      t === 'risk' ? 'text-red-600 dark:text-red-400' :
                      t === 'opportunity' ? 'text-green-600 dark:text-green-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-black dark:text-white">{insight.title}</p>
                      <span className={`w-2 h-2 rounded-full ${severityDot[sev] || severityDot.low}`} />
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && !error && data && type === 'menu' && (
          <div className="space-y-4">
            {(data.suggestions as MenuSuggestion[])?.map((s, i) => {
              const action = s.action?.toLowerCase()
              return (
              <div key={i} className="flex items-start space-x-3">
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${
                  action === 'promote' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  action === 'reprice' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {s.action}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-black dark:text-white">{s.dish_name}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{s.reason}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5 italic">{s.detail}</p>
                </div>
              </div>
              )
            })}
          </div>
        )}

        {!loading && !error && data && type === 'procurement' && (
          <div className="space-y-4">
            {(data.recommendations as ProcurementRec[])?.map((r, i) => {
              const priority = r.priority?.toLowerCase()
              return (
              <div key={i} className="flex items-start space-x-3">
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${
                  priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                }`}>
                  {r.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-black dark:text-white">{r.action}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{r.details}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 font-medium">{r.savings_estimate}</p>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
