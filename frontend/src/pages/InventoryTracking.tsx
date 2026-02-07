import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getInventoryItems, createInventoryItem, adjustInventory, deleteInventoryItem,
  getInventoryAlerts, getInventoryValueSummary, seedDefaultInventory, checkApiHealth
} from '../services/api'
import {
  Package, AlertTriangle, Plus, Trash2, RefreshCw,
  Search, Filter, ArrowUp, Wifi, WifiOff
} from 'lucide-react'

interface InventoryItem {
  id: string
  restaurant_id: string
  category: string
  name: string
  quantity: number
  unit: string
  minimum_quantity: number
  cost_per_unit: number
  supplier_name: string | null
  location: string | null
  last_restocked: string | null
  notes: string | null
}

interface Alert {
  id: string
  name: string
  category: string
  quantity: number
  minimum_quantity: number
  deficit: number
  unit: string
}

interface ValueSummary {
  total_value: number
  by_category: Record<string, { count: number; value: number }>
  total_items: number
}

const CATEGORIES = [
  { id: 'kitchen_equipment', label: 'Kitchen Equipment', emoji: '🍳' },
  { id: 'serviceware', label: 'Serviceware', emoji: '🍽️' },
  { id: 'cleaning', label: 'Cleaning & Facility', emoji: '🧹' },
  { id: 'beverages', label: 'Beverages', emoji: '🥤' },
  { id: 'staff_supplies', label: 'Staff Supplies', emoji: '👔' },
]

const DEMO_ITEMS: InventoryItem[] = [
  { id: '1', restaurant_id: 'demo', category: 'kitchen_equipment', name: "Chef's Knife Set (8pc)", quantity: 6, unit: 'sets', minimum_quantity: 4, cost_per_unit: 189.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Knife Rack', last_restocked: '2026-01-15', notes: null },
  { id: '2', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Stainless Steel Sauté Pan 12"', quantity: 8, unit: 'units', minimum_quantity: 5, cost_per_unit: 64.99, supplier_name: 'WebstaurantStore', location: 'Kitchen - Shelf A1', last_restocked: '2026-01-20', notes: null },
  { id: '3', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Cutting Boards (Color-Coded)', quantity: 12, unit: 'units', minimum_quantity: 8, cost_per_unit: 18.50, supplier_name: 'Sysco', location: 'Kitchen - Prep Station', last_restocked: '2026-01-25', notes: null },
  { id: '4', restaurant_id: 'demo', category: 'kitchen_equipment', name: 'Sheet Pans (Full Size)', quantity: 15, unit: 'units', minimum_quantity: 10, cost_per_unit: 12.99, supplier_name: 'Restaurant Depot', location: 'Kitchen - Shelf B2', last_restocked: '2026-02-01', notes: null },
  { id: '5', restaurant_id: 'demo', category: 'serviceware', name: 'Dinner Plates (White Ceramic)', quantity: 120, unit: 'units', minimum_quantity: 80, cost_per_unit: 4.99, supplier_name: 'US Foods', location: 'FOH - Plate Storage', last_restocked: '2026-01-10', notes: null },
  { id: '6', restaurant_id: 'demo', category: 'serviceware', name: 'Wine Glasses (Crystal)', quantity: 48, unit: 'units', minimum_quantity: 36, cost_per_unit: 8.50, supplier_name: 'WebstaurantStore', location: 'Bar - Glass Rack', last_restocked: '2026-01-12', notes: null },
  { id: '7', restaurant_id: 'demo', category: 'serviceware', name: 'Linen Napkins (White)', quantity: 200, unit: 'units', minimum_quantity: 150, cost_per_unit: 2.25, supplier_name: 'Cintas', location: 'FOH - Linen Closet', last_restocked: '2026-01-28', notes: null },
  { id: '8', restaurant_id: 'demo', category: 'serviceware', name: 'Silverware Sets (Fork/Knife/Spoon)', quantity: 60, unit: 'sets', minimum_quantity: 80, cost_per_unit: 3.75, supplier_name: 'Sysco', location: 'FOH - Silverware Station', last_restocked: '2025-12-20', notes: 'Need to reorder' },
  { id: '9', restaurant_id: 'demo', category: 'cleaning', name: 'Degreaser (Commercial)', quantity: 8, unit: 'gallons', minimum_quantity: 5, cost_per_unit: 24.99, supplier_name: 'Sysco', location: 'Storage Room', last_restocked: '2026-01-30', notes: null },
  { id: '10', restaurant_id: 'demo', category: 'cleaning', name: 'Sanitizer Tablets', quantity: 3, unit: 'bottles', minimum_quantity: 6, cost_per_unit: 15.99, supplier_name: 'Restaurant Depot', location: 'Storage Room', last_restocked: '2025-12-15', notes: 'LOW - reorder immediately' },
  { id: '11', restaurant_id: 'demo', category: 'cleaning', name: 'Trash Bags (55 gal)', quantity: 4, unit: 'cases', minimum_quantity: 3, cost_per_unit: 32.00, supplier_name: 'US Foods', location: 'Storage Room', last_restocked: '2026-01-22', notes: null },
  { id: '12', restaurant_id: 'demo', category: 'beverages', name: 'Sparkling Water (Pellegrino)', quantity: 10, unit: 'cases', minimum_quantity: 8, cost_per_unit: 22.99, supplier_name: 'US Foods', location: 'Bar - Cooler', last_restocked: '2026-02-01', notes: null },
  { id: '13', restaurant_id: 'demo', category: 'beverages', name: 'House Red Wine (Cabernet)', quantity: 18, unit: 'bottles', minimum_quantity: 12, cost_per_unit: 14.50, supplier_name: 'Wine Distributor', location: 'Bar - Wine Rack', last_restocked: '2026-01-18', notes: null },
  { id: '14', restaurant_id: 'demo', category: 'beverages', name: 'Coffee Beans (Espresso Blend)', quantity: 5, unit: 'lbs', minimum_quantity: 10, cost_per_unit: 18.99, supplier_name: 'Local Roaster', location: 'Bar - Coffee Station', last_restocked: '2025-12-28', notes: 'Running low' },
  { id: '15', restaurant_id: 'demo', category: 'staff_supplies', name: 'Aprons (Black)', quantity: 15, unit: 'units', minimum_quantity: 10, cost_per_unit: 12.99, supplier_name: 'Cintas', location: 'Staff Room', last_restocked: '2026-01-05', notes: null },
  { id: '16', restaurant_id: 'demo', category: 'staff_supplies', name: 'Disposable Gloves (L)', quantity: 2, unit: 'cases', minimum_quantity: 4, cost_per_unit: 28.00, supplier_name: 'Sysco', location: 'Kitchen - Shelf C1', last_restocked: '2025-12-30', notes: 'Need to reorder' },
]

function getDemoAlerts(items: InventoryItem[]): Alert[] {
  return items
    .filter(i => i.quantity < i.minimum_quantity)
    .map(i => ({
      id: i.id, name: i.name, category: i.category,
      quantity: i.quantity, minimum_quantity: i.minimum_quantity,
      deficit: i.minimum_quantity - i.quantity, unit: i.unit,
    }))
}

function getDemoValueSummary(items: InventoryItem[]): ValueSummary {
  const by_category: Record<string, { count: number; value: number }> = {}
  items.forEach(i => {
    if (!by_category[i.category]) by_category[i.category] = { count: 0, value: 0 }
    by_category[i.category].count++
    by_category[i.category].value += i.quantity * i.cost_per_unit
  })
  return {
    total_value: items.reduce((sum, i) => sum + i.quantity * i.cost_per_unit, 0),
    by_category,
    total_items: items.length,
  }
}

export default function InventoryTracking() {
  const { restaurantId } = useAuth()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [valueSummary, setValueSummary] = useState<ValueSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    loadAll()
  }, [restaurantId])

  useEffect(() => {
    if (apiConnected) loadItems()
  }, [activeCategory, showLowOnly])

  const loadAll = async () => {
    setLoading(true)
    try {
      const connected = await checkApiHealth()
      setApiConnected(connected)

      if (connected && restaurantId) {
        await Promise.all([loadItems(), loadAlerts(), loadValue()])
      } else {
        loadDemoData()
      }
    } catch {
      loadDemoData()
    } finally {
      setLoading(false)
    }
  }

  const loadDemoData = () => {
    setApiConnected(false)
    let demoItems = [...DEMO_ITEMS]
    if (activeCategory) demoItems = demoItems.filter(i => i.category === activeCategory)
    if (showLowOnly) demoItems = demoItems.filter(i => i.quantity < i.minimum_quantity)
    setItems(demoItems)
    setAlerts(getDemoAlerts(DEMO_ITEMS))
    setValueSummary(getDemoValueSummary(DEMO_ITEMS))
  }

  const loadItems = async () => {
    try {
      const data = await getInventoryItems(restaurantId!, activeCategory || undefined, showLowOnly)
      setItems(data.items || [])
    } catch {
      loadDemoData()
    }
  }

  const loadAlerts = async () => {
    try {
      const data = await getInventoryAlerts(restaurantId!)
      setAlerts(data.alerts || [])
    } catch {
      // keep demo alerts
    }
  }

  const loadValue = async () => {
    try {
      const data = await getInventoryValueSummary(restaurantId!)
      setValueSummary(data)
    } catch {
      // keep demo value summary
    }
  }

  const handleSeedDefaults = async () => {
    if (!apiConnected) {
      setItems(DEMO_ITEMS)
      setAlerts(getDemoAlerts(DEMO_ITEMS))
      setValueSummary(getDemoValueSummary(DEMO_ITEMS))
      return
    }
    setSeeding(true)
    try {
      await seedDefaultInventory(restaurantId!)
      await loadAll()
    } catch {
      loadDemoData()
    } finally {
      setSeeding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!apiConnected) {
      const newItems = items.filter(i => i.id !== id)
      setItems(newItems)
      setAlerts(getDemoAlerts(newItems))
      setValueSummary(getDemoValueSummary(newItems))
      return
    }
    if (!confirm('Delete this inventory item?')) return
    try {
      await deleteInventoryItem(restaurantId!, id)
      await loadAll()
    } catch {
      // keep current state
    }
  }

  const filteredItems = items.filter(item =>
    !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-7 h-7 text-teal-500" />
              Full Inventory Tracking
            </h1>
            {apiConnected !== null && (
              <span className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                apiConnected
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              }`}>
                {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{apiConnected ? 'Live' : 'Demo'}</span>
              </span>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Non-food items: equipment, serviceware, cleaning, beverages, staff supplies
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              Seed Default Items
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <h3 className="font-medium text-red-800 dark:text-red-300 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            {alerts.length} Low Stock Alert{alerts.length > 1 ? 's' : ''}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {alerts.slice(0, 6).map(a => (
              <div key={a.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm">
                <span className="text-gray-700 dark:text-gray-300">{a.name}</span>
                <span className="text-red-600 font-medium">
                  {a.quantity}/{a.minimum_quantity} {a.unit}
                </span>
              </div>
            ))}
          </div>
          {alerts.length > 6 && (
            <p className="text-xs text-red-500 mt-2">+{alerts.length - 6} more items below minimum</p>
          )}
        </div>
      )}

      {/* Value Summary Cards */}
      {valueSummary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-3">
            <p className="text-xs text-gray-500 uppercase">Total Value</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              ${valueSummary.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          {CATEGORIES.map(cat => {
            const catData = valueSummary.by_category[cat.id]
            return (
              <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500 uppercase">{cat.emoji} {cat.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {catData ? catData.count : 0} items
                </p>
                <p className="text-xs text-gray-400">
                  ${catData ? catData.value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-2 rounded-lg text-sm ${!activeCategory ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
              className={`px-3 py-2 rounded-lg text-sm ${activeCategory === cat.id ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
          <button
            onClick={() => setShowLowOnly(!showLowOnly)}
            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${showLowOnly ? 'bg-red-100 dark:bg-red-900/40 text-red-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
          >
            <Filter className="w-3 h-3" />
            Low Stock
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No inventory items found. {items.length === 0 ? 'Seed defaults or add items manually.' : 'Try changing filters.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left p-3">Item</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-right p-3">Qty</th>
                  <th className="text-right p-3">Min</th>
                  <th className="text-right p-3">Unit Cost</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-left p-3">Location</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const isLow = item.quantity < item.minimum_quantity
                  return (
                    <tr key={item.id} className={`border-t dark:border-gray-700 ${isLow ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                      <td className="p-3">
                        <div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>
                          {item.supplier_name && (
                            <span className="block text-xs text-gray-400">{item.supplier_name}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">
                          {CATEGORIES.find(c => c.id === item.category)?.emoji} {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={isLow ? 'text-red-600 font-bold' : ''}>{item.quantity} {item.unit}</span>
                      </td>
                      <td className="p-3 text-right text-gray-500">{item.minimum_quantity}</td>
                      <td className="p-3 text-right">${item.cost_per_unit.toFixed(2)}</td>
                      <td className="p-3 text-right font-medium">${(item.quantity * item.cost_per_unit).toFixed(2)}</td>
                      <td className="p-3 text-gray-500">{item.location || '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setShowAdjustModal(item.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Adjust quantity"
                          >
                            <ArrowUp className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <AddItemModal
          restaurantId={restaurantId!}
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); loadAll() }}
        />
      )}

      {/* Adjust Quantity Modal */}
      {showAdjustModal && (
        <AdjustModal
          restaurantId={restaurantId!}
          itemId={showAdjustModal}
          itemName={items.find(i => i.id === showAdjustModal)?.name || ''}
          onClose={() => setShowAdjustModal(null)}
          onAdjusted={() => { setShowAdjustModal(null); loadAll() }}
        />
      )}
    </div>
  )
}

function AddItemModal({ restaurantId, onClose, onCreated }: {
  restaurantId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    category: 'kitchen_equipment',
    subcategory: 'general',
    name: '',
    current_quantity: 0,
    unit: 'units',
    min_quantity: 0,
    unit_cost: 0,
    storage_location: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createInventoryItem(restaurantId, form)
      onCreated()
    } catch (err) {
      console.error('Failed to create:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Add Inventory Item</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Item Name</label>
            <input
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
              placeholder="e.g. Chef's Knife Set"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Subcategory</label>
            <input
              required
              value={form.subcategory}
              onChange={e => setForm({ ...form, subcategory: e.target.value })}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
              placeholder="e.g. knives, plates, detergent"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Quantity</label>
              <input
                type="number"
                min={0}
                value={form.current_quantity}
                onChange={e => setForm({ ...form, current_quantity: parseInt(e.target.value) || 0 })}
                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Min Qty</label>
              <input
                type="number"
                min={0}
                value={form.min_quantity}
                onChange={e => setForm({ ...form, min_quantity: parseInt(e.target.value) || 0 })}
                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Unit</label>
              <input
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Cost per Unit ($)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={form.unit_cost}
              onChange={e => setForm({ ...form, unit_cost: parseFloat(e.target.value) || 0 })}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Storage Location</label>
            <input
              value={form.storage_location}
              onChange={e => setForm({ ...form, storage_location: e.target.value })}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
              placeholder="e.g. Kitchen shelf B2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              type="submit"
              disabled={saving || !form.name}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdjustModal({ restaurantId, itemId, itemName, onClose, onAdjusted }: {
  restaurantId: string
  itemId: string
  itemName: string
  onClose: () => void
  onAdjusted: () => void
}) {
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState<string>('received')
  const [saving, setSaving] = useState(false)

  const REASONS = ['received', 'used', 'damaged', 'returned', 'counted']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (amount === 0) return
    setSaving(true)
    try {
      await adjustInventory(restaurantId, { item_id: itemId, adjustment: amount, reason })
      onAdjusted()
    } catch (err) {
      console.error('Failed to adjust:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Adjust: {itemName}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Adjustment (+ to add, - to remove)
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(parseInt(e.target.value) || 0)}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            >
              {REASONS.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              type="submit"
              disabled={saving || amount === 0}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Apply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
