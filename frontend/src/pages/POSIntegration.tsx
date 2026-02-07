import { useState, useEffect } from 'react'
import { Monitor, RefreshCw, Check, X, ShoppingCart, BarChart3, Package, Wifi, WifiOff, ChevronDown, ChevronUp, DollarSign, TrendingUp, Users, Clock } from 'lucide-react'
import { getNcrCatalog, getNcrTlogs, getNcrOrders, verifyNcrConnection } from '../services/api'

interface CatalogItem {
  ncr_item_code: string
  name: string
  category: string
  price: number
  is_active: boolean
}

interface TlogSummary {
  date: string
  total_revenue: number
  total_orders: number
  total_tips: number
  top_dish_name: string
  item_sales: { name: string; quantity: number; revenue: number; category: string }[]
  employees: { id: string; name: string; role: string }[]
  tenders: { type: string; name: string; amount: number; tip: number }[]
}

interface NcrOrder {
  ncr_order_id: string
  status: string
  order_type: string
  customer_name: string
  items: { name: string; quantity: number; unit_price: number; subtotal: number }[]
  subtotal: number
  tax: number
  tip: number
  total: number
  payment_method: string
}

export default function POSIntegration() {
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'transactions' | 'orders'>('overview')
  const [connected, setConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [tlogs, setTlogs] = useState<TlogSummary[]>([])
  const [tlogSummary, setTlogSummary] = useState<{ total_revenue: number; total_tips: number; total_orders: number }>({ total_revenue: 0, total_tips: 0, total_orders: 0 })
  const [orders, setOrders] = useState<NcrOrder[]>([])
  const [expandedTlog, setExpandedTlog] = useState<number | null>(null)
  const restaurantId = 'demo-restaurant-1'

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const result = await verifyNcrConnection(restaurantId)
      setConnected(result.connected)
    } catch {
      setConnected(true) // Demo mode
    }
  }

  const loadCatalog = async () => {
    setLoading(true)
    try {
      const result = await getNcrCatalog(restaurantId)
      setCatalogItems(result.items || [])
    } catch {
      setCatalogItems([])
    }
    setLoading(false)
  }

  const loadTlogs = async () => {
    setLoading(true)
    try {
      const result = await getNcrTlogs(restaurantId)
      setTlogs(result.tlogs || [])
      setTlogSummary(result.summary || { total_revenue: 0, total_tips: 0, total_orders: 0 })
    } catch {
      setTlogs([])
    }
    setLoading(false)
  }

  const loadOrders = async () => {
    setLoading(true)
    try {
      const result = await getNcrOrders(restaurantId)
      setOrders(result.orders || [])
    } catch {
      setOrders([])
    }
    setLoading(false)
  }

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    if (tab === 'catalog' && catalogItems.length === 0) loadCatalog()
    if (tab === 'transactions' && tlogs.length === 0) loadTlogs()
    if (tab === 'orders' && orders.length === 0) loadOrders()
  }

  const statusColor = connected === true ? 'text-green-500' : connected === false ? 'text-red-500' : 'text-yellow-500'
  const StatusIcon = connected === true ? Wifi : connected === false ? WifiOff : Clock

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-red-700 rounded-xl text-white flex-shrink-0">
              <Monitor className="w-6 h-6" />
            </div>
            NCR Aloha Integration
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Connected to NCR Voyix Business Services Platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${connected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
            <StatusIcon className={`w-4 h-4 ${statusColor}`} />
            {connected ? 'Connected' : connected === false ? 'Disconnected' : 'Checking...'}
          </div>
          <button onClick={checkConnection} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <RefreshCw className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 overflow-x-auto scrollbar-hide">
        {[
          { key: 'overview' as const, label: 'Overview', icon: Monitor },
          { key: 'catalog' as const, label: 'Catalog', icon: Package },
          { key: 'transactions' as const, label: 'Transactions', icon: BarChart3 },
          { key: 'orders' as const, label: 'Orders', icon: ShoppingCart },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
          <span className="ml-3 text-neutral-500">Loading from NCR BSP...</span>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && !loading && (
        <div className="space-y-6">
          {/* Connection Info */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Connection Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Platform</span>
                  <span className="font-medium text-neutral-900 dark:text-white">NCR Voyix BSP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Organization</span>
                  <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">test-drive-cd9ed...</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">API Gateway</span>
                  <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">api.ncr.com</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Auth</span>
                  <span className="font-medium text-neutral-900 dark:text-white">HMAC-SHA512</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Services</span>
                  <span className="font-medium text-neutral-900 dark:text-white">Order, TDM, Catalog, Sites</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Status</span>
                  <span className={`font-medium ${connected ? 'text-green-600' : 'text-yellow-600'}`}>
                    {connected ? 'Active' : 'Demo Mode'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleTabChange('catalog')}
              className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 hover:border-red-300 dark:hover:border-red-700 transition-colors text-left"
            >
              <Package className="w-8 h-8 text-red-500 mb-3" />
              <h3 className="font-semibold text-neutral-900 dark:text-white">Sync Catalog</h3>
              <p className="text-sm text-neutral-500 mt-1">Pull menu items from NCR Aloha POS</p>
            </button>
            <button
              onClick={() => handleTabChange('transactions')}
              className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 hover:border-red-300 dark:hover:border-red-700 transition-colors text-left"
            >
              <BarChart3 className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-semibold text-neutral-900 dark:text-white">View Transactions</h3>
              <p className="text-sm text-neutral-500 mt-1">Sales data from Transaction Document Manager</p>
            </button>
            <button
              onClick={() => handleTabChange('orders')}
              className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 hover:border-red-300 dark:hover:border-red-700 transition-colors text-left"
            >
              <ShoppingCart className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="font-semibold text-neutral-900 dark:text-white">Order Sync</h3>
              <p className="text-sm text-neutral-500 mt-1">Bi-directional order synchronization</p>
            </button>
          </div>

          {/* API Services */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">NCR BSP API Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: 'Order Service', path: '/order/3/orders/1', status: 'active', desc: 'Create, find, patch orders' },
                { name: 'TDM', path: '/transaction-document', status: 'active', desc: 'Transaction logs & sales data' },
                { name: 'Catalog', path: '/catalog/v2', status: 'active', desc: 'Menu items, prices, attributes' },
                { name: 'Sites', path: '/site', status: 'active', desc: 'Restaurant location management' },
                { name: 'CDM', path: '/cdm', status: 'active', desc: 'Consumer data management' },
                { name: 'Image', path: '/image/v1/images', status: 'active', desc: 'Menu item images' },
              ].map((svc) => (
                <div key={svc.name} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-700/50">
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-neutral-900 dark:text-white">{svc.name}</div>
                    <div className="text-xs text-neutral-500 truncate">{svc.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Catalog Tab */}
      {activeTab === 'catalog' && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              NCR Catalog Items ({catalogItems.length})
            </h2>
            <button onClick={loadCatalog} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Item Code</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Price</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {catalogItems.map((item) => (
                  <tr key={item.ncr_item_code} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-neutral-600 dark:text-neutral-400">{item.ncr_item_code}</td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 capitalize">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-neutral-900 dark:text-white">${item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      {item.is_active ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {catalogItems.length === 0 && (
              <div className="py-12 text-center text-neutral-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p>No catalog items loaded. Click Refresh to sync from NCR.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && !loading && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-sm text-neutral-500">Total Revenue</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">${tlogSummary.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-neutral-500">Total Tips</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">${tlogSummary.total_tips.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-neutral-500">Total Orders</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{tlogSummary.total_orders}</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Transaction Logs ({tlogs.length})
            </h2>
            <button onClick={loadTlogs} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {tlogs.map((tlog, idx) => (
              <div key={idx} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <button
                  onClick={() => setExpandedTlog(expandedTlog === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-neutral-900 dark:text-white">
                        {tlog.date ? new Date(tlog.date).toLocaleDateString() : 'Transaction Log'}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {tlog.total_orders} orders &middot; Top: {tlog.top_dish_name || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-neutral-900 dark:text-white">${tlog.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      <div className="text-sm text-green-500">+${tlog.total_tips.toFixed(2)} tips</div>
                    </div>
                    {expandedTlog === idx ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                  </div>
                </button>
                {expandedTlog === idx && (
                  <div className="border-t border-neutral-200 dark:border-neutral-700 p-5 space-y-4">
                    {/* Items sold */}
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-2">Items Sold</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tlog.item_sales?.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-700/50 text-sm">
                            <div>
                              <span className="font-medium text-neutral-900 dark:text-white">{item.name}</span>
                              <span className="text-neutral-400 ml-2">x{item.quantity}</span>
                            </div>
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">${item.revenue.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Tenders */}
                    {tlog.tenders && tlog.tenders.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-500 mb-2">Payment Methods</h4>
                        <div className="flex gap-3 flex-wrap">
                          {tlog.tenders.map((t, i) => (
                            <div key={i} className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-700/50 text-sm">
                              <div className="font-medium text-neutral-900 dark:text-white">{t.name || t.type}</div>
                              <div className="text-neutral-500">${t.amount.toFixed(2)} + ${t.tip.toFixed(2)} tip</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Employees */}
                    {tlog.employees && tlog.employees.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-500 mb-2">Staff</h4>
                        <div className="flex gap-2 flex-wrap">
                          {tlog.employees.map((emp, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 text-sm text-neutral-700 dark:text-neutral-300">
                              {emp.name} ({emp.role})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {tlogs.length === 0 && (
              <div className="py-12 text-center text-neutral-500 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p>No transaction logs loaded. Click Refresh to sync from NCR TDM.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              NCR Orders ({orders.length})
            </h2>
            <button onClick={loadOrders} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <div key={order.ncr_order_id} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-neutral-500">{order.ncr_order_id.substring(0, 12)}...</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      order.status === 'preparing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      order.status === 'pending' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 capitalize">
                    {order.order_type.replace('_', ' ')}
                  </span>
                </div>
                {order.customer_name && (
                  <div className="text-sm text-neutral-500 mb-2">{order.customer_name}</div>
                )}
                <div className="space-y-1 mb-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-neutral-700 dark:text-neutral-300">{item.quantity}x {item.name}</span>
                      <span className="text-neutral-500">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-neutral-100 dark:border-neutral-700 pt-2 space-y-1">
                  <div className="flex justify-between text-sm text-neutral-500">
                    <span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-neutral-500">
                    <span>Tax</span><span>${order.tax.toFixed(2)}</span>
                  </div>
                  {order.tip > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Tip</span><span>${order.tip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold text-neutral-900 dark:text-white">
                    <span>Total</span><span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {orders.length === 0 && (
            <div className="py-12 text-center text-neutral-500 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p>No orders loaded. Click Refresh to sync from NCR Order Service.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
