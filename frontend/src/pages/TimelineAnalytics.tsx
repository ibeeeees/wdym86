import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getWeeklySummary, getMonthlyTrends, getSeasonalAnalysis,
  getDayOfWeekAnalysis, getKpiSummary
} from '../services/api'
import {
  BarChart3, TrendingUp, TrendingDown, Calendar, DollarSign,
  ShoppingBag, Clock, RefreshCw, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'

interface KpiData {
  total_revenue: number
  avg_daily_revenue: number
  total_orders: number
  avg_daily_orders: number
  avg_order_value: number
  total_tips: number
  tip_rate: number
  total_refunds: number
  refund_rate: number
  labor_cost: number
  labor_cost_pct: number
  food_cost: number
  food_cost_pct: number
}

export default function TimelineAnalytics() {
  const { restaurantId, restaurantName } = useAuth()
  const [activeTab, setActiveTab] = useState<'kpi' | 'weekly' | 'monthly' | 'seasonal' | 'dow'>('kpi')
  const [loading, setLoading] = useState(true)
  const [kpi, setKpi] = useState<KpiData | null>(null)
  const [hasData, setHasData] = useState(false)
  const [weekly, setWeekly] = useState<any[]>([])
  const [monthly, setMonthly] = useState<any[]>([])
  const [seasonal, setSeasonal] = useState<Record<string, any>>({})
  const [dow, setDow] = useState<any[]>([])
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    if (restaurantId) loadData()
  }, [restaurantId, activeTab, period])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'kpi': {
          const data = await getKpiSummary(restaurantId!, period)
          setHasData(data.has_data)
          setKpi(data.kpi || null)
          break
        }
        case 'weekly': {
          const data = await getWeeklySummary(restaurantId!, 8)
          setWeekly(data.weekly || [])
          break
        }
        case 'monthly': {
          const data = await getMonthlyTrends(restaurantId!, 6)
          setMonthly(data.monthly || [])
          break
        }
        case 'seasonal': {
          const data = await getSeasonalAnalysis(restaurantId!)
          setSeasonal(data.seasons || {})
          break
        }
        case 'dow': {
          const data = await getDayOfWeekAnalysis(restaurantId!, 12)
          setDow(data.days || [])
          break
        }
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'kpi', label: 'KPIs', icon: DollarSign },
    { id: 'weekly', label: 'Weekly', icon: Calendar },
    { id: 'monthly', label: 'Monthly', icon: TrendingUp },
    { id: 'seasonal', label: 'Seasonal', icon: BarChart3 },
    { id: 'dow', label: 'Day of Week', icon: Clock },
  ] as const

  const fmtCurrency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtPct = (n: number) => `${n.toFixed(1)}%`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-indigo-500" />
          Timeline Analytics
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Performance tracking for {restaurantName}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* KPI View */}
          {activeTab === 'kpi' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-400">Period:</label>
                {[7, 30, 90, 365].map(d => (
                  <button
                    key={d}
                    onClick={() => setPeriod(d)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      period === d
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}
                  >
                    {d === 7 ? '7d' : d === 30 ? '30d' : d === 90 ? '90d' : '1y'}
                  </button>
                ))}
              </div>

              {!hasData ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border dark:border-gray-700">
                  <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No snapshot data for this period. Compute daily snapshots from order data to populate analytics.</p>
                </div>
              ) : kpi && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard title="Total Revenue" value={fmtCurrency(kpi.total_revenue)} icon={DollarSign} color="green" />
                  <KpiCard title="Avg Daily Revenue" value={fmtCurrency(kpi.avg_daily_revenue)} icon={TrendingUp} color="blue" />
                  <KpiCard title="Total Orders" value={kpi.total_orders.toLocaleString()} icon={ShoppingBag} color="purple" />
                  <KpiCard title="Avg Order Value" value={fmtCurrency(kpi.avg_order_value)} icon={DollarSign} color="indigo" />
                  <KpiCard title="Tips" value={fmtCurrency(kpi.total_tips)} subtitle={fmtPct(kpi.tip_rate)} icon={ArrowUpRight} color="teal" />
                  <KpiCard title="Refunds" value={fmtCurrency(kpi.total_refunds)} subtitle={fmtPct(kpi.refund_rate)} icon={ArrowDownRight} color="red" />
                  <KpiCard title="Labor Cost" value={fmtCurrency(kpi.labor_cost)} subtitle={fmtPct(kpi.labor_cost_pct)} icon={Clock} color="amber" />
                  <KpiCard title="Food Cost" value={fmtCurrency(kpi.food_cost)} subtitle={fmtPct(kpi.food_cost_pct)} icon={ShoppingBag} color="orange" />
                </div>
              )}
            </div>
          )}

          {/* Weekly View */}
          {activeTab === 'weekly' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Weekly Performance</h3>
              </div>
              {weekly.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No weekly data available.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="text-left p-3">Week</th>
                        <th className="text-right p-3">Revenue</th>
                        <th className="text-right p-3">Orders</th>
                        <th className="text-right p-3">Avg Daily</th>
                        <th className="text-right p-3">Avg Order</th>
                        <th className="text-right p-3">Tips</th>
                        <th className="text-right p-3">Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekly.map((w, i) => (
                        <tr key={i} className="border-t dark:border-gray-700">
                          <td className="p-3 font-medium">{w.week}</td>
                          <td className="p-3 text-right text-green-600">{fmtCurrency(w.revenue)}</td>
                          <td className="p-3 text-right">{w.orders}</td>
                          <td className="p-3 text-right">{fmtCurrency(w.avg_daily_revenue)}</td>
                          <td className="p-3 text-right">{fmtCurrency(w.avg_order_value)}</td>
                          <td className="p-3 text-right text-blue-600">{fmtCurrency(w.tips)}</td>
                          <td className="p-3 text-right text-gray-500">{w.days_recorded}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Monthly View */}
          {activeTab === 'monthly' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Monthly Trends</h3>
              </div>
              {monthly.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No monthly data available.</div>
              ) : (
                <>
                  {/* Bar chart visualization */}
                  <div className="p-4">
                    <div className="flex items-end gap-2 h-48">
                      {monthly.map((m, i) => {
                        const maxRev = Math.max(...monthly.map((x: any) => x.revenue || 0), 1)
                        const height = ((m.revenue || 0) / maxRev) * 100
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500">{fmtCurrency(m.revenue)}</span>
                            <div
                              className="w-full bg-indigo-500 rounded-t-md transition-all"
                              style={{ height: `${height}%` }}
                            />
                            <span className="text-xs text-gray-500">{m.month}</span>
                            {m.trend && (
                              <span className={`text-xs ${m.trend === 'up' ? 'text-green-500' : m.trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                                {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'} {m.revenue_change_pct}%
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="text-left p-3">Month</th>
                          <th className="text-right p-3">Revenue</th>
                          <th className="text-right p-3">Orders</th>
                          <th className="text-right p-3">Avg Daily</th>
                          <th className="text-right p-3">Labor</th>
                          <th className="text-right p-3">Food</th>
                          <th className="text-right p-3">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthly.map((m, i) => (
                          <tr key={i} className="border-t dark:border-gray-700">
                            <td className="p-3 font-medium">{m.month}</td>
                            <td className="p-3 text-right text-green-600">{fmtCurrency(m.revenue)}</td>
                            <td className="p-3 text-right">{m.orders}</td>
                            <td className="p-3 text-right">{fmtCurrency(m.avg_daily_revenue)}</td>
                            <td className="p-3 text-right">{fmtCurrency(m.labor_cost)}</td>
                            <td className="p-3 text-right">{fmtCurrency(m.food_cost)}</td>
                            <td className="p-3 text-right">
                              <TrendBadge trend={m.trend} pct={m.revenue_change_pct} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Seasonal View */}
          {activeTab === 'seasonal' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(seasonal).map(([season, data]: [string, any]) => (
                <div key={season} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
                  <h3 className="text-lg font-semibold capitalize text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    {season === 'spring' ? '🌸' : season === 'summer' ? '☀️' : season === 'fall' ? '🍂' : '❄️'}
                    {season}
                  </h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Revenue</span>
                      <span className="font-medium">{fmtCurrency(data.revenue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Daily</span>
                      <span className="font-medium">{fmtCurrency(data.avg_daily_revenue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Orders</span>
                      <span className="font-medium">{(data.orders || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg/Day</span>
                      <span className="font-medium">{data.avg_orders_per_day || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Days</span>
                      <span className="text-gray-400">{data.days || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(seasonal).length === 0 && (
                <div className="col-span-4 bg-white dark:bg-gray-800 rounded-xl p-8 text-center border dark:border-gray-700">
                  <p className="text-gray-500">No seasonal data yet. Build up daily snapshots over time.</p>
                </div>
              )}
            </div>
          )}

          {/* Day of Week View */}
          {activeTab === 'dow' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Day of Week Analysis</h3>
              </div>
              {dow.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No data available.</div>
              ) : (
                <>
                  <div className="p-4">
                    <div className="flex items-end gap-3 h-40">
                      {dow.map((d, i) => {
                        const maxRev = Math.max(...dow.map((x: any) => x.avg_revenue || 0), 1)
                        const height = ((d.avg_revenue || 0) / maxRev) * 100
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500">{fmtCurrency(d.avg_revenue)}</span>
                            <div
                              className="w-full bg-purple-500 rounded-t-md transition-all"
                              style={{ height: `${height}%` }}
                            />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{d.day}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="text-left p-3">Day</th>
                          <th className="text-right p-3">Total Revenue</th>
                          <th className="text-right p-3">Avg Revenue</th>
                          <th className="text-right p-3">Total Orders</th>
                          <th className="text-right p-3">Avg Orders</th>
                          <th className="text-right p-3">Weeks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dow.map((d, i) => (
                          <tr key={i} className="border-t dark:border-gray-700">
                            <td className="p-3 font-medium">{d.day}</td>
                            <td className="p-3 text-right text-green-600">{fmtCurrency(d.revenue)}</td>
                            <td className="p-3 text-right font-medium">{fmtCurrency(d.avg_revenue)}</td>
                            <td className="p-3 text-right">{d.orders}</td>
                            <td className="p-3 text-right">{d.avg_orders}</td>
                            <td className="p-3 text-right text-gray-500">{d.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function KpiCard({ title, value, subtitle, icon: Icon, color }: {
  title: string
  value: string
  subtitle?: string
  icon: any
  color: string
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wide">{title}</span>
        <div className={`p-1.5 rounded-lg ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle} of revenue</p>}
    </div>
  )
}

function TrendBadge({ trend, pct }: { trend?: string; pct?: number }) {
  if (!trend || trend === 'baseline') return <span className="text-gray-400">—</span>
  const isUp = trend === 'up'
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400'}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {pct !== undefined ? `${pct > 0 ? '+' : ''}${pct}%` : ''}
    </span>
  )
}
