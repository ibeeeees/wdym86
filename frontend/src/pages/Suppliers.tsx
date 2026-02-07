import { useState, useEffect } from 'react'
import { Plus, Truck, Clock, Star, DollarSign, Wifi, WifiOff, Zap, Award } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { getSuppliers, checkApiHealth } from '../services/api'

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
    name: 'FreshFarms Direct',
    lead_time_days: 2,
    min_order_quantity: 50,
    reliability_score: 0.95,
    shipping_cost: 25,
    ingredients: ['Chicken Breast', 'Ground Beef', 'Salmon Fillet']
  },
  {
    id: '2',
    name: 'QuickSupply Co',
    lead_time_days: 1,
    min_order_quantity: 25,
    reliability_score: 0.88,
    shipping_cost: 35,
    ingredients: ['Romaine Lettuce', 'Tomatoes', 'Avocados']
  },
  {
    id: '3',
    name: 'Premium Proteins',
    lead_time_days: 3,
    min_order_quantity: 100,
    reliability_score: 0.92,
    shipping_cost: 15,
    ingredients: ['Chicken Breast', 'Ground Beef', 'Salmon Fillet']
  },
  {
    id: '4',
    name: 'Local Dairy Farm',
    lead_time_days: 1,
    min_order_quantity: 20,
    reliability_score: 0.97,
    shipping_cost: 20,
    ingredients: ['Cheese Blend']
  },
  {
    id: '5',
    name: 'Bulk Goods Warehouse',
    lead_time_days: 4,
    min_order_quantity: 200,
    reliability_score: 0.90,
    shipping_cost: 0,
    ingredients: ['Flour', 'Rice', 'Olive Oil']
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-black dark:text-white">Suppliers</h1>
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
            Manage suppliers, lead times, and reliability for procurement optimization
          </p>
        </div>
        <button
          onClick={() => setShowAddSupplier(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Add Supplier Form */}
      {showAddSupplier && (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-neutral-50 dark:bg-neutral-800">
          <h3 className="font-medium text-black dark:text-white mb-4">New Supplier</h3>
          <div className="grid grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Supplier name"
              value={newSupplier.name}
              onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
              className="px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 text-black dark:text-white"
            />
            <input
              type="number"
              placeholder="Lead time (days)"
              value={newSupplier.lead_time_days}
              onChange={e => setNewSupplier({ ...newSupplier, lead_time_days: e.target.value })}
              className="px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 text-black dark:text-white"
            />
            <input
              type="number"
              placeholder="Min order qty"
              value={newSupplier.min_order_quantity}
              onChange={e => setNewSupplier({ ...newSupplier, min_order_quantity: e.target.value })}
              className="px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 text-black dark:text-white"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Reliability (0-1)"
              value={newSupplier.reliability_score}
              onChange={e => setNewSupplier({ ...newSupplier, reliability_score: e.target.value })}
              className="px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 text-black dark:text-white"
            />
            <input
              type="number"
              placeholder="Shipping cost ($)"
              value={newSupplier.shipping_cost}
              onChange={e => setNewSupplier({ ...newSupplier, shipping_cost: e.target.value })}
              className="px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 text-black dark:text-white"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button onClick={() => setShowAddSupplier(false)} className="px-4 py-2 text-sm text-neutral-500">
              Cancel
            </button>
            <button onClick={handleAddSupplier} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium">
              Add Supplier
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400 mb-1">
            <Truck className="w-4 h-4" />
            <p className="text-sm">Total Suppliers</p>
          </div>
          <p className="text-2xl font-semibold text-black dark:text-white">{suppliers.length}</p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400 mb-1">
            <Clock className="w-4 h-4" />
            <p className="text-sm">Avg Lead Time</p>
          </div>
          <p className="text-2xl font-semibold text-black dark:text-white font-mono">
            {(suppliers.reduce((sum, s) => sum + s.lead_time_days, 0) / suppliers.length || 0).toFixed(1)}d
          </p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400 mb-1">
            <Star className="w-4 h-4" />
            <p className="text-sm">Avg Reliability</p>
          </div>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400 font-mono">
            {((suppliers.reduce((sum, s) => sum + s.reliability_score, 0) / suppliers.length || 0) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
          <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <p className="text-sm">Avg Shipping</p>
          </div>
          <p className="text-2xl font-semibold text-black dark:text-white font-mono">
            ${(suppliers.reduce((sum, s) => sum + s.shipping_cost, 0) / suppliers.length || 0).toFixed(0)}
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

      {/* Suppliers Table */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-800">
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr className="text-left text-sm text-neutral-500 dark:text-neutral-400">
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Lead Time</th>
              <th className="px-4 py-3 font-medium">Min Order</th>
              <th className="px-4 py-3 font-medium">Reliability</th>
              <th className="px-4 py-3 font-medium">Shipping</th>
              <th className="px-4 py-3 font-medium">Supplies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
            {suppliers.map(supplier => (
              <tr key={supplier.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    <span className="font-medium text-black dark:text-white">{supplier.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`font-mono font-medium ${getLeadTimeColor(supplier.lead_time_days)}`}>
                    {supplier.lead_time_days} day{supplier.lead_time_days !== 1 ? 's' : ''}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-neutral-600 dark:text-neutral-300">
                    {supplier.min_order_quantity} units
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReliabilityColor(supplier.reliability_score)}`}>
                    {(supplier.reliability_score * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-neutral-600 dark:text-neutral-300">
                    {supplier.shipping_cost === 0 ? 'Free' : `$${supplier.shipping_cost}`}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {supplier.ingredients && supplier.ingredients.length > 0 ? (
                      supplier.ingredients.slice(0, 3).map((ing, i) => (
                        <span key={i} className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded text-xs text-neutral-600 dark:text-neutral-300">
                          {ing}
                        </span>
                      ))
                    ) : (
                      <span className="text-neutral-400 text-sm">-</span>
                    )}
                    {supplier.ingredients && supplier.ingredients.length > 3 && (
                      <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded text-xs text-neutral-500">
                        +{supplier.ingredients.length - 3}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Panel */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 bg-neutral-50 dark:bg-neutral-800">
        <h2 className="text-sm font-medium text-black dark:text-white mb-2">How Suppliers Affect Agent Decisions</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          The Supplier Strategy Agent uses lead times and reliability scores to optimize procurement.
          When disruptions occur (weather, traffic), the agent may recommend switching to faster
          suppliers or splitting orders. Higher reliability scores get priority for critical ingredients.
        </p>
      </div>
    </div>
  )
}
