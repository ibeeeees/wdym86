import { useState, useEffect } from 'react'
import { Plus, Truck, Clock, Star, DollarSign, Wifi, WifiOff, Zap, Award, Sparkles, Package, MapPin, Shield, Search, ShoppingCart, Check, ArrowRight, FileText, Building2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { getSuppliers, checkApiHealth } from '../services/api'
import { getCuisineTemplate } from '../data/cuisineTemplates'
import { useAuth } from '../context/AuthContext'
import AiInsightCard from '../components/AiInsightCard'

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
  pricing?: { ingredient: string; price: number; unit: string }[]
}

interface PurchaseOrderItem {
  ingredient: string
  quantity: number
  unitPrice: number
  unit: string
}

interface OrderHistory {
  id: string
  supplier: string
  items: number
  total: number
  status: 'Delivered' | 'In Transit' | 'Processing'
  date: string
}

const realDistributors = [
  { name: 'Sysco', products: '625,000+', delivery: 'Mon-Sat', minOrder: '$500', gradient: 'from-blue-500 to-blue-600' },
  { name: 'US Foods', products: '400,000+', delivery: 'Tue/Thu/Sat', minOrder: '$350', gradient: 'from-green-500 to-emerald-600' },
  { name: 'Performance Food Group', products: '300,000+', delivery: 'Mon/Wed/Fri', minOrder: '$400', gradient: 'from-purple-500 to-indigo-600' },
]

export default function Suppliers() {
  const { cuisineType } = useAuth()
  const template = getCuisineTemplate(cuisineType || 'mediterranean')
  const demoSuppliers: Supplier[] = template.suppliers
  const demoOrderHistory: OrderHistory[] = template.orderHistory

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [newSupplier, setNewSupplier] = useState({ name: '', lead_time_days: '', min_order_quantity: '', reliability_score: '', shipping_cost: '' })

  // Price comparison
  const [compareIngredient, setCompareIngredient] = useState('')

  // Purchase order builder
  const [poSupplier, setPoSupplier] = useState<string>('')
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([])
  const [showPoSuccess, setShowPoSuccess] = useState(false)

  // Order history
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>(demoOrderHistory)

  // Active section
  const [activeSection, setActiveSection] = useState<'suppliers' | 'compare' | 'order' | 'history' | 'distributors'>('suppliers')
  const [connectedDistributors, setConnectedDistributors] = useState<Set<string>>(new Set())

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
      id: Date.now().toString(), name: newSupplier.name,
      lead_time_days: parseInt(newSupplier.lead_time_days),
      min_order_quantity: parseFloat(newSupplier.min_order_quantity) || 0,
      reliability_score: parseFloat(newSupplier.reliability_score) || 0.90,
      shipping_cost: parseFloat(newSupplier.shipping_cost) || 0,
      ingredients: [], pricing: []
    }
    setSuppliers([...suppliers, supplier])
    setNewSupplier({ name: '', lead_time_days: '', min_order_quantity: '', reliability_score: '', shipping_cost: '' })
    setShowAddSupplier(false)
  }

  // Get all unique ingredients across all suppliers
  const allIngredients = [...new Set(suppliers.flatMap(s => s.pricing?.map(p => p.ingredient) || []))]

  // Get price comparison for selected ingredient
  const priceComparison = compareIngredient
    ? suppliers
        .filter(s => s.pricing?.some(p => p.ingredient === compareIngredient))
        .map(s => {
          const pricing = s.pricing!.find(p => p.ingredient === compareIngredient)!
          return { supplier: s.name, price: pricing.price, unit: pricing.unit, reliability: s.reliability_score, leadTime: s.lead_time_days }
        })
        .sort((a, b) => a.price - b.price)
    : []

  const bestPrice = priceComparison.length > 0 ? priceComparison[0].price : 0

  // PO builder logic
  const selectedPoSupplier = suppliers.find(s => s.id === poSupplier)
  const poTotal = poItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) + (selectedPoSupplier?.shipping_cost || 0)

  const addPoItem = (ingredient: string, price: number, unit: string) => {
    if (poItems.some(i => i.ingredient === ingredient)) return
    setPoItems([...poItems, { ingredient, quantity: 1, unitPrice: price, unit }])
  }

  const updatePoQuantity = (ingredient: string, quantity: number) => {
    setPoItems(poItems.map(i => i.ingredient === ingredient ? { ...i, quantity: Math.max(1, quantity) } : i))
  }

  const removePoItem = (ingredient: string) => {
    setPoItems(poItems.filter(i => i.ingredient !== ingredient))
  }

  const submitPo = () => {
    if (!selectedPoSupplier || poItems.length === 0) return
    const newOrder: OrderHistory = {
      id: `PO-${Date.now().toString().slice(-3)}`,
      supplier: selectedPoSupplier.name,
      items: poItems.length,
      total: poTotal,
      status: 'Processing',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    setOrderHistory([newOrder, ...orderHistory])
    setPoItems([])
    setShowPoSuccess(true)
    setTimeout(() => setShowPoSuccess(false), 3000)
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
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{template.label} supplier network for {template.restaurantName}</p>
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

      {/* PO Success Toast */}
      {showPoSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Purchase order placed successfully!</span>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {([
          { key: 'suppliers' as const, label: 'Suppliers', icon: Truck },
          { key: 'compare' as const, label: 'Price Compare', icon: Search },
          { key: 'order' as const, label: 'Order Builder', icon: ShoppingCart },
          { key: 'history' as const, label: 'Order History', icon: FileText },
          { key: 'distributors' as const, label: 'Distributors', icon: Building2 },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeSection === key
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Add Supplier Form */}
      {showAddSupplier && (
        <div className="border border-blue-200 dark:border-blue-900 rounded-2xl p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-black dark:text-white">Add New Supplier</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input type="text" placeholder="Supplier name" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} className="px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white" />
            <input type="number" placeholder="Lead time (days)" value={newSupplier.lead_time_days} onChange={e => setNewSupplier({ ...newSupplier, lead_time_days: e.target.value })} className="px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white" />
            <input type="number" placeholder="Min order qty" value={newSupplier.min_order_quantity} onChange={e => setNewSupplier({ ...newSupplier, min_order_quantity: e.target.value })} className="px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white" />
            <input type="number" step="0.01" placeholder="Reliability (0-1)" value={newSupplier.reliability_score} onChange={e => setNewSupplier({ ...newSupplier, reliability_score: e.target.value })} className="px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white" />
            <input type="number" placeholder="Shipping cost ($)" value={newSupplier.shipping_cost} onChange={e => setNewSupplier({ ...newSupplier, shipping_cost: e.target.value })} className="px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white" />
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button onClick={() => setShowAddSupplier(false)} className="px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium">Cancel</button>
            <button onClick={handleAddSupplier} className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 hover:scale-105 transition-all">Add Supplier</button>
          </div>
        </div>
      )}

      {/* SUPPLIERS SECTION */}
      {activeSection === 'suppliers' && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Total Suppliers</p>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-red-600 rounded-xl flex items-center justify-center"><Truck className="w-5 h-5 text-white" /></div>
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">{suppliers.length}</p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Avg Lead Time</p>
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-white" /></div>
              </div>
              <p className="text-3xl font-bold text-black dark:text-white font-mono">{(suppliers.reduce((sum, s) => sum + s.lead_time_days, 0) / suppliers.length || 0).toFixed(1)}<span className="text-xl">d</span></p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Avg Reliability</p>
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 font-mono">{((suppliers.reduce((sum, s) => sum + s.reliability_score, 0) / suppliers.length || 0) * 100).toFixed(0)}<span className="text-xl">%</span></p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Avg Shipping</p>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5 text-white" /></div>
              </div>
              <p className="text-3xl font-bold text-black dark:text-white font-mono"><span className="text-xl">$</span>{(suppliers.reduce((sum, s) => sum + s.shipping_cost, 0) / suppliers.length || 0).toFixed(0)}</p>
            </div>
          </div>

          {/* Procurement AI */}
          <AiInsightCard type="procurement" />

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Reliability Comparison</h3>
                <Award className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={suppliers.map(s => ({ name: s.name.split(' ')[0], reliability: s.reliability_score * 100 }))} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} stroke="#737373" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="#737373" fontSize={11} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px', color: 'white' }} formatter={(value: number) => [`${value.toFixed(0)}%`, 'Reliability']} />
                    <Bar dataKey="reliability" radius={[0, 4, 4, 0]}>
                      {suppliers.map((s, i) => <Cell key={i} fill={s.reliability_score >= 0.95 ? '#22c55e' : s.reliability_score >= 0.85 ? '#eab308' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Lead Time Comparison</h3>
                <Zap className="w-4 h-4 text-blue-500" />
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={suppliers.map(s => ({ name: s.name.split(' ')[0], leadTime: s.lead_time_days }))} layout="vertical">
                    <XAxis type="number" domain={[0, 'dataMax']} stroke="#737373" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="#737373" fontSize={11} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px', color: 'white' }} formatter={(value: number) => [`${value} day${value !== 1 ? 's' : ''}`, 'Lead Time']} />
                    <Bar dataKey="leadTime" radius={[0, 4, 4, 0]}>
                      {suppliers.map((s, i) => <Cell key={i} fill={s.lead_time_days <= 1 ? '#22c55e' : s.lead_time_days <= 3 ? '#eab308' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Supplier Cards */}
          <div className="space-y-3">
            {suppliers.map(supplier => (
              <div key={supplier.id} className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all hover:border-blue-300 dark:hover:border-blue-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${getSupplierGradient(supplier.reliability_score)} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Truck className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-black dark:text-white text-lg">{supplier.name}</h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${getReliabilityColor(supplier.reliability_score)}`}>
                          <Star className="w-3 h-3" /><span>{(supplier.reliability_score * 100).toFixed(0)}% Reliable</span>
                        </span>
                        <span className={`flex items-center space-x-1 text-sm font-medium ${getLeadTimeColor(supplier.lead_time_days)}`}>
                          <Clock className="w-3 h-3" /><span>{supplier.lead_time_days}d lead</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-center">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Min Order</p>
                      <p className="font-mono font-bold text-black dark:text-white">{supplier.min_order_quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Shipping</p>
                      <p className="font-mono font-bold text-black dark:text-white">
                        {supplier.shipping_cost === 0 ? <span className="text-green-500">Free</span> : `$${supplier.shipping_cost}`}
                      </p>
                    </div>
                  </div>
                </div>
                {supplier.ingredients && supplier.ingredients.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="w-4 h-4 text-neutral-400" />
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Supplies</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {supplier.ingredients.map((ing, i) => (
                        <span key={i} className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300">{ing}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* PRICE COMPARISON SECTION */}
      {activeSection === 'compare' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
            <h3 className="font-semibold text-black dark:text-white mb-4 flex items-center space-x-2">
              <Search className="w-5 h-5 text-blue-500" />
              <span>Price Comparison</span>
            </h3>
            <select
              value={compareIngredient}
              onChange={e => setCompareIngredient(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white mb-4"
            >
              <option value="">Select an ingredient to compare...</option>
              {allIngredients.map(ing => <option key={ing} value={ing}>{ing}</option>)}
            </select>

            {priceComparison.length > 0 && (
              <div className="space-y-3">
                {priceComparison.map((item, i) => (
                  <div key={item.supplier} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    i === 0 ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-neutral-200 dark:border-neutral-700'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {i === 0 && <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center"><Award className="w-4 h-4 text-white" /></div>}
                      <div>
                        <p className="font-semibold text-black dark:text-white">{item.supplier}</p>
                        <div className="flex items-center space-x-2 text-xs text-neutral-500 mt-0.5">
                          <span className="flex items-center space-x-1"><Star className="w-3 h-3" /><span>{(item.reliability * 100).toFixed(0)}%</span></span>
                          <span className="flex items-center space-x-1"><Clock className="w-3 h-3" /><span>{item.leadTime}d</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-mono font-bold ${i === 0 ? 'text-green-600 dark:text-green-400' : 'text-black dark:text-white'}`}>
                        ${item.price.toFixed(2)}<span className="text-sm text-neutral-400">/{item.unit}</span>
                      </p>
                      {i > 0 && (
                        <p className="text-xs text-red-500 mt-0.5">+${(item.price - bestPrice).toFixed(2)} more</p>
                      )}
                      {i === 0 && <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-0.5">Best Price</p>}
                    </div>
                  </div>
                ))}
                {priceComparison.length > 1 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                    <p className="text-green-700 dark:text-green-400 font-semibold">
                      Save up to ${(priceComparison[priceComparison.length - 1].price - bestPrice).toFixed(2)}/{priceComparison[0].unit} by choosing {priceComparison[0].supplier}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Smart Order Suggestions */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
            <h3 className="font-semibold text-black dark:text-white mb-4 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Smart Order Suggestions</span>
            </h3>
            <div className="space-y-3">
              {template.smartSuggestions.map(suggestion => (
                <div key={suggestion.ingredient} className="flex items-center justify-between bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-black dark:text-white">{suggestion.ingredient}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        suggestion.urgency === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        suggestion.urgency === 'urgent' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>{suggestion.urgency}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">from {suggestion.supplier} · {suggestion.qty}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-black dark:text-white">{suggestion.cost}</span>
                    <button
                      onClick={() => {
                        const supplier = suppliers.find(s => s.name === suggestion.supplier)
                        if (supplier) {
                          setPoSupplier(supplier.id)
                          const pricing = supplier.pricing?.find(p => p.ingredient === suggestion.ingredient)
                          if (pricing) {
                            addPoItem(pricing.ingredient, pricing.price, pricing.unit)
                          }
                          setActiveSection('order')
                        }
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 hover:scale-105 transition-all"
                    >
                      <ArrowRight className="w-3 h-3" /><span>Order</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PURCHASE ORDER BUILDER */}
      {activeSection === 'order' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
            <h3 className="font-semibold text-black dark:text-white mb-4 flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
              <span>Purchase Order Builder</span>
            </h3>

            {/* Select Supplier */}
            <select
              value={poSupplier}
              onChange={e => { setPoSupplier(e.target.value); setPoItems([]) }}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-black dark:text-white mb-4"
            >
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {selectedPoSupplier && (
              <>
                {/* Available Items */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Available from {selectedPoSupplier.name}:</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedPoSupplier.pricing || []).map(p => (
                      <button
                        key={p.ingredient}
                        onClick={() => addPoItem(p.ingredient, p.price, p.unit)}
                        disabled={poItems.some(i => i.ingredient === p.ingredient)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                          poItems.some(i => i.ingredient === p.ingredient)
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{p.ingredient} (${p.price}/{p.unit})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Items */}
                {poItems.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {poItems.map(item => (
                      <div key={item.ingredient} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-xl">
                        <div>
                          <p className="font-medium text-sm text-black dark:text-white">{item.ingredient}</p>
                          <p className="text-xs text-neutral-500">${item.unitPrice.toFixed(2)}/{item.unit}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => updatePoQuantity(item.ingredient, parseInt(e.target.value) || 1)}
                            className="w-20 px-3 py-2 text-center font-mono font-bold border border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-black dark:text-white"
                          />
                          <span className="text-sm text-neutral-400 w-8">{item.unit}</span>
                          <span className="font-mono font-bold text-black dark:text-white w-20 text-right">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                          <button onClick={() => removePoItem(item.ingredient)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <MapPin className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Totals */}
                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Subtotal</span>
                        <span className="font-mono text-black dark:text-white">${(poTotal - (selectedPoSupplier?.shipping_cost || 0)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Shipping</span>
                        <span className="font-mono text-black dark:text-white">${(selectedPoSupplier?.shipping_cost || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Est. Delivery</span>
                        <span className="text-black dark:text-white">{selectedPoSupplier?.lead_time_days} days</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-200 dark:border-neutral-700">
                        <span className="text-black dark:text-white">Total</span>
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-mono">${poTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={submitPo}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-3 transition-all hover:scale-[1.01]"
                    >
                      <Check className="w-5 h-5" />
                      <span>Place Order</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ORDER HISTORY */}
      {activeSection === 'history' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="font-semibold text-black dark:text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>Order History</span>
            </h3>
          </div>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {orderHistory.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-black dark:text-white">{order.id}</p>
                    <p className="text-xs text-neutral-500">{order.supplier} · {order.items} items</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    order.status === 'In Transit' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>{order.status}</span>
                  <span className="font-mono font-bold text-black dark:text-white">${order.total.toFixed(2)}</span>
                  <span className="text-xs text-neutral-400">{order.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISTRIBUTORS */}
      {activeSection === 'distributors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {realDistributors.map(dist => (
              <div key={dist.name} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`px-5 py-4 bg-gradient-to-r ${dist.gradient} flex items-center space-x-3`}>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{dist.name}</h3>
                    <p className="text-white/70 text-xs">National Distributor</p>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Products</span>
                    <span className="font-semibold text-black dark:text-white">{dist.products}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Delivery Schedule</span>
                    <span className="font-semibold text-black dark:text-white">{dist.delivery}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Min Order</span>
                    <span className="font-semibold text-black dark:text-white">{dist.minOrder}</span>
                  </div>
                  <button
                    onClick={() => {
                      setConnectedDistributors(prev => {
                        const next = new Set(prev)
                        if (next.has(dist.name)) {
                          next.delete(dist.name)
                        } else {
                          next.add(dist.name)
                        }
                        return next
                      })
                    }}
                    className={`w-full mt-2 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
                      connectedDistributors.has(dist.name)
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                        : 'border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {connectedDistributors.has(dist.name) ? (
                      <><Check className="w-4 h-4" /><span>Connected</span></>
                    ) : (
                      <><ArrowRight className="w-4 h-4" /><span>Connect</span></>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Info Panel */}
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
