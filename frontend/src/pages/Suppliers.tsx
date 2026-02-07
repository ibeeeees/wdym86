import { useState, useEffect } from 'react'
import { Plus, Truck, Clock, Star, DollarSign, Wifi, WifiOff, Zap, Award, Sparkles, Package, MapPin, Shield } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { getSuppliers, checkApiHealth } from '../services/api'

// Supplier color gradients based on reliability
const getSupplierGradient = (score: number) => {
  if (score >= 0.95) return 'from-emerald-400 to-green-500'
  if (score >= 0.85) return 'from-amber-400 to-yellow-500'
  return 'from-red-400 to-rose-500'
}

interface Supplier {
  id: string
  name: string
  lead_time_days: number
  min_order_quantity: number
  reliability_score: number
  shipping_cost: number
  ingredients?: string[]
}

const demoSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Aegean Imports',
    lead_time_days: 2,
    min_order_quantity: 50,
    reliability_score: 0.98,
    shipping_cost: 45,
    ingredients: ['Kalamata Olives', 'Feta Cheese', 'Greek Yogurt', 'Olive Oil']
  },
  {
    id: '2',
    name: 'Athens Fresh Market',
    lead_time_days: 1,
    min_order_quantity: 25,
    reliability_score: 0.95,
    shipping_cost: 25,
    ingredients: ['Fresh Spinach', 'Tomatoes', 'Cucumbers', 'Red Onions', 'Eggplant']
  },
  {
    id: '3',
    name: 'Mediterranean Seafood Co',
    lead_time_days: 1,
    min_order_quantity: 30,
    reliability_score: 0.94,
    shipping_cost: 55,
    ingredients: ['Branzino', 'Octopus', 'Shrimp', 'Salmon']
  },
  {
    id: '4',
    name: 'Hellenic Farms',
    lead_time_days: 2,
    min_order_quantity: 40,
    reliability_score: 0.97,
    shipping_cost: 35,
    ingredients: ['Lamb Leg', 'Chicken Thighs', 'Ground Lamb']
  },
  {
    id: '5',
    name: 'Santorini Spirits',
    lead_time_days: 3,
    min_order_quantity: 24,
    reliability_score: 0.92,
    shipping_cost: 0,
    ingredients: ['Ouzo', 'Metaxa', 'Assyrtiko Wine', 'Retsina']
  },
  {
    id: '6',
    name: 'Mykonos Pantry',
    lead_time_days: 2,
    min_order_quantity: 50,
    reliability_score: 0.96,
    shipping_cost: 20,
    ingredients: ['Phyllo Dough', 'Tahini', 'Arborio Rice', 'Greek Honey']
  }
]

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    lead_time_days: '',
    min_order_quantity: '',
    reliability_score: '',
    shipping_cost: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const connected = await checkApiHealth()
        setApiConnected(connected)

        if (connected) {
          const restaurantId = localStorage.getItem('restaurantId') || 'demo-restaurant'
          const data = await getSuppliers(restaurantId)
          setSuppliers(data)
        } else {
          setSuppliers(demoSuppliers)
        }
      } catch {
        setSuppliers(demoSuppliers)
        setApiConnected(false)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleAddSupplier = () => {
    if (!newSupplier.name || !newSupplier.lead_time_days) return
    const supplier: Supplier = {
      id: Date.now().toString(),
      name: newSupplier.name,
      lead_time_days: parseInt(newSupplier.lead_time_days),
      min_order_quantity: parseFloat(newSupplier.min_order_quantity) || 0,
      reliability_score: parseFloat(newSupplier.reliability_score) || 0.90,
      shipping_cost: parseFloat(newSupplier.shipping_cost) || 0,
      ingredients: []
    }
    setSuppliers([...suppliers, supplier])
    setNewSupplier({ name: '', lead_time_days: '', min_order_quantity: '', reliability_score: '', shipping_cost: '' })
    setShowAddSupplier(false)
  }

  const getReliabilityColor = (score: number) => {
    if (score >= 0.95) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
    if (score >= 0.85) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
  }

  const getLeadTimeColor = (days: number) => {
    if (days <= 1) return 'text-green-600 dark:text-green-400'
    if (days <= 3) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm text-neutral-500 mt-4 font-medium">Loading suppliers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h1 className="text-xl font-bold text-black dark:text-white">Supplier Network</h1>
              {apiConnected !== null && (
                <span className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                  apiConnected
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400'
                }`}>
                  {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{apiConnected ? 'Live' : 'Demo'}</span>
                </span>
              )}
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              Mediterranean supplier network for Mykonos
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddSupplier(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Add Supplier Form */}
      {showAddSupplier && (
        <div className="border border-blue-200 dark:border-blue-900 rounded-2xl p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-black dark:text-white">Add New Supplier</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Supplier name"
              value={newSupplier.name}
              onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
              className="px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Lead time (days)"
              value={newSupplier.lead_time_days}
              onChange={e => setNewSupplier({ ...newSupplier, lead_time_days: e.target.value })}
              className="px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
            />
            <input
              type="number"
              placeholder="Min order qty"
              value={newSupplier.min_order_quantity}
              onChange={e => setNewSupplier({ ...newSupplier, min_order_quantity: e.target.value })}
              className="px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Reliability (0-1)"
              value={newSupplier.reliability_score}
              onChange={e => setNewSupplier({ ...newSupplier, reliability_score: e.target.value })}
              className="px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
            />
            <input
              type="number"
              placeholder="Shipping cost ($)"
              value={newSupplier.shipping_cost}
              onChange={e => setNewSupplier({ ...newSupplier, shipping_cost: e.target.value })}
              className="px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button onClick={() => setShowAddSupplier(false)} className="px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium">
              Cancel
            </button>
            <button onClick={handleAddSupplier} className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 hover:scale-105 transition-all">
              Add Supplier
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Total Suppliers</p>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-red-600 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white">{suppliers.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Avg Lead Time</p>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white font-mono">
            {(suppliers.reduce((sum, s) => sum + s.lead_time_days, 0) / suppliers.length || 0).toFixed(1)}<span className="text-xl">d</span>
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Avg Reliability</p>
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 font-mono">
            {((suppliers.reduce((sum, s) => sum + s.reliability_score, 0) / suppliers.length || 0) * 100).toFixed(0)}<span className="text-xl">%</span>
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Avg Shipping</p>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black dark:text-white font-mono">
            <span className="text-xl">$</span>{(suppliers.reduce((sum, s) => sum + s.shipping_cost, 0) / suppliers.length || 0).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Reliability Chart */}
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Reliability Comparison</h3>
            <Award className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={suppliers.map(s => ({
                  name: s.name.split(' ')[0],
                  reliability: s.reliability_score * 100
                }))}
                layout="vertical"
              >
                <XAxis type="number" domain={[0, 100]} stroke="#737373" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#737373" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'white'
                  }}
                  formatter={(value: number) => [`${value.toFixed(0)}%`, 'Reliability']}
                />
                <Bar dataKey="reliability" radius={[0, 4, 4, 0]}>
                  {suppliers.map((s, i) => (
                    <Cell
                      key={i}
                      fill={s.reliability_score >= 0.95 ? '#22c55e' : s.reliability_score >= 0.85 ? '#eab308' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Time Chart */}
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Lead Time Comparison</h3>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={suppliers.map(s => ({
                  name: s.name.split(' ')[0],
                  leadTime: s.lead_time_days
                }))}
                layout="vertical"
              >
                <XAxis type="number" domain={[0, 'dataMax']} stroke="#737373" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#737373" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'white'
                  }}
                  formatter={(value: number) => [`${value} day${value !== 1 ? 's' : ''}`, 'Lead Time']}
                />
                <Bar dataKey="leadTime" radius={[0, 4, 4, 0]}>
                  {suppliers.map((s, i) => (
                    <Cell
                      key={i}
                      fill={s.lead_time_days <= 1 ? '#22c55e' : s.lead_time_days <= 3 ? '#eab308' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Suppliers Cards */}
      <div className="space-y-3">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all hover:border-blue-300 dark:hover:border-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Supplier Avatar */}
                <div className={`w-14 h-14 bg-gradient-to-br ${getSupplierGradient(supplier.reliability_score)} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Truck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-black dark:text-white text-lg">{supplier.name}</h3>
                  <div className="flex items-center space-x-3 mt-1">
                    {/* Reliability Badge */}
                    <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${getReliabilityColor(supplier.reliability_score)}`}>
                      <Star className="w-3 h-3" />
                      <span>{(supplier.reliability_score * 100).toFixed(0)}% Reliable</span>
                    </span>
                    {/* Lead Time */}
                    <span className={`flex items-center space-x-1 text-sm font-medium ${getLeadTimeColor(supplier.lead_time_days)}`}>
                      <Clock className="w-3 h-3" />
                      <span>{supplier.lead_time_days}d lead</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 text-center">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Min Order</p>
                  <p className="font-mono font-bold text-black dark:text-white">{supplier.min_order_quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Shipping</p>
                  <p className="font-mono font-bold text-black dark:text-white">
                    {supplier.shipping_cost === 0 ? (
                      <span className="text-green-500">Free</span>
                    ) : (
                      `$${supplier.shipping_cost}`
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            {supplier.ingredients && supplier.ingredients.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Supplies</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {supplier.ingredients.map((ing, i) => (
                    <span key={i} className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Panel */}
      <div className="border border-blue-200 dark:border-blue-900 rounded-2xl p-6 bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-indigo-900/20">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-black dark:text-white mb-2">How Suppliers Affect AI Decisions</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              The <span className="font-semibold text-blue-600 dark:text-blue-400">Supplier Strategy Agent</span> uses lead times and reliability scores to optimize procurement.
              When disruptions occur (weather, traffic), the agent may recommend switching to faster
              suppliers or splitting orders. Higher reliability scores get priority for critical ingredients.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
