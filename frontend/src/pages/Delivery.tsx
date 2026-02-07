import { useState } from 'react'
import {
  Truck, Package, Clock, MapPin, Phone, User, DollarSign,
  CheckCircle, XCircle, ChefHat, RefreshCw,
  AlertCircle, TrendingUp
} from 'lucide-react'

interface DeliveryOrder {
  id: string
  platform: string
  external_id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  items: { name: string; quantity: number; price: number }[]
  subtotal: number
  delivery_fee: number
  tax: number
  tip: number
  total: number
  status: string
  estimated_delivery_time: string | null
  driver_name: string | null
  driver_phone: string | null
  created_at: string
  updated_at: string
}

interface Platform {
  id: string
  name: string
  connected: boolean
  icon: string
  color: string
  commission: string
}

// Platform styling configuration
const platformConfig: Record<string, { gradient: string; bg: string; icon: string }> = {
  doordash: {
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: '🚗'
  },
  uber_eats: {
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: '🥡'
  },
  grubhub: {
    gradient: 'from-orange-500 to-red-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: '🍔'
  },
  postmates: {
    gradient: 'from-gray-700 to-black',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    icon: '📦'
  },
  seamless: {
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: '🍽️'
  },
}

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  pending: { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock },
  confirmed: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: CheckCircle },
  preparing: { color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: ChefHat },
  ready_for_pickup: { color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30', icon: Package },
  out_for_delivery: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: Truck },
  delivered: { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
  cancelled: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
}

// Mock data for demo
const mockOrders: DeliveryOrder[] = [
  {
    id: '1',
    platform: 'doordash',
    external_id: 'DD-A8F2C91E',
    customer_name: 'John D.',
    customer_phone: '(555) 123-4567',
    customer_address: '123 Main St, San Francisco, CA 94105',
    items: [
      { name: 'Grilled Salmon', quantity: 1, price: 28.99 },
      { name: 'Caesar Salad', quantity: 1, price: 12.99 },
    ],
    subtotal: 41.98,
    delivery_fee: 4.99,
    tax: 3.78,
    tip: 8.00,
    total: 58.75,
    status: 'preparing',
    estimated_delivery_time: new Date(Date.now() + 25 * 60000).toISOString(),
    driver_name: 'Mike T.',
    driver_phone: '(555) 987-6543',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    platform: 'uber_eats',
    external_id: 'UE-B7E3D82F',
    customer_name: 'Sarah M.',
    customer_phone: '(555) 234-5678',
    customer_address: '456 Oak Ave, San Francisco, CA 94102',
    items: [
      { name: 'Ribeye Steak', quantity: 1, price: 34.99 },
      { name: 'Soft Drink', quantity: 2, price: 6.98 },
    ],
    subtotal: 41.97,
    delivery_fee: 3.99,
    tax: 3.78,
    tip: 7.00,
    total: 56.74,
    status: 'confirmed',
    estimated_delivery_time: new Date(Date.now() + 40 * 60000).toISOString(),
    driver_name: null,
    driver_phone: null,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    platform: 'grubhub',
    external_id: 'GH-C6F4E93A',
    customer_name: 'Alex K.',
    customer_phone: '(555) 345-6789',
    customer_address: '789 Pine St, San Francisco, CA 94108',
    items: [
      { name: 'Chicken Parmesan', quantity: 2, price: 45.98 },
      { name: 'Cheesecake', quantity: 1, price: 8.99 },
    ],
    subtotal: 54.97,
    delivery_fee: 2.99,
    tax: 4.95,
    tip: 10.00,
    total: 72.91,
    status: 'out_for_delivery',
    estimated_delivery_time: new Date(Date.now() + 10 * 60000).toISOString(),
    driver_name: 'Lisa R.',
    driver_phone: '(555) 876-5432',
    created_at: new Date(Date.now() - 35 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    platform: 'doordash',
    external_id: 'DD-D5G5H04B',
    customer_name: 'Emma W.',
    customer_phone: '(555) 456-7890',
    customer_address: '321 Elm St, San Francisco, CA 94110',
    items: [
      { name: 'Margherita Pizza', quantity: 1, price: 18.99 },
      { name: 'Garlic Bread', quantity: 1, price: 6.99 },
      { name: 'Tiramisu', quantity: 2, price: 15.98 },
    ],
    subtotal: 41.96,
    delivery_fee: 4.99,
    tax: 3.78,
    tip: 6.00,
    total: 56.73,
    status: 'pending',
    estimated_delivery_time: null,
    driver_name: null,
    driver_phone: null,
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockPlatforms: Platform[] = [
  { id: 'doordash', name: 'DoorDash', connected: true, icon: 'doordash', color: '#FF3008', commission: '15-30%' },
  { id: 'uber_eats', name: 'Uber Eats', connected: true, icon: 'uber_eats', color: '#06C167', commission: '15-30%' },
  { id: 'grubhub', name: 'Grubhub', connected: true, icon: 'grubhub', color: '#F63440', commission: '20-30%' },
  { id: 'postmates', name: 'Postmates', connected: false, icon: 'postmates', color: '#000000', commission: '15-30%' },
  { id: 'seamless', name: 'Seamless', connected: false, icon: 'seamless', color: '#F63440', commission: '20-30%' },
]

export default function Delivery() {
  const [orders, setOrders] = useState<DeliveryOrder[]>(mockOrders)
  const [platforms] = useState<Platform[]>(mockPlatforms)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Stats
  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    avgOrderValue: orders.reduce((sum, o) => sum + o.total, 0) / orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
  }

  const filteredOrders = orders.filter(order => {
    if (selectedPlatform !== 'all' && order.platform !== selectedPlatform) return false
    if (selectedStatus !== 'all' && order.status !== selectedStatus) return false
    return true
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const handleAcceptOrder = (orderId: string) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'confirmed', updated_at: new Date().toISOString() } : o
    ))
  }

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o
    ))
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const getTimeAgo = (dateString: string) => {
    const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black dark:text-white">Delivery Orders</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Manage orders from all platforms</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl font-medium text-sm transition-all hover:scale-105 shadow-lg shadow-violet-500/30 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Orders'}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-black dark:text-white">{stats.totalOrders}</p>
          <p className="text-xs text-green-500 mt-1">Today</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-black dark:text-white">${stats.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-green-500 mt-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> +12% vs yesterday</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Avg Order</span>
          </div>
          <p className="text-2xl font-bold text-black dark:text-white">${stats.avgOrderValue.toFixed(2)}</p>
          <p className="text-xs text-neutral-400 mt-1">Per order</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Pending</span>
          </div>
          <p className="text-2xl font-bold text-black dark:text-white">{stats.pendingOrders}</p>
          <p className="text-xs text-amber-500 mt-1">Need attention</p>
        </div>
      </div>

      {/* Connected Platforms */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Connected Platforms</h2>
        <div className="flex flex-wrap gap-3">
          {platforms.map(platform => {
            const config = platformConfig[platform.id]
            return (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(selectedPlatform === platform.id ? 'all' : platform.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedPlatform === platform.id
                    ? `bg-gradient-to-r ${config?.gradient} text-white shadow-lg`
                    : platform.connected
                    ? `${config?.bg} text-neutral-700 dark:text-neutral-300 hover:scale-105`
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500'
                }`}
              >
                <span className="text-lg">{config?.icon}</span>
                <span>{platform.name}</span>
                {platform.connected && (
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'].map(status => {
          const config = statusConfig[status]
          const count = status === 'all'
            ? orders.length
            : orders.filter(o => o.status === status).length
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedStatus === status
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                  : config
                  ? `${config.bg} ${config.color}`
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {config?.icon && <config.icon className="w-4 h-4" />}
              <span className="capitalize">{status.replace(/_/g, ' ')}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                selectedStatus === status
                  ? 'bg-white/20'
                  : 'bg-black/10 dark:bg-white/10'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {filteredOrders.map(order => {
          const platformCfg = platformConfig[order.platform]
          const statusCfg = statusConfig[order.status]
          const StatusIcon = statusCfg?.icon || Package

          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer overflow-hidden"
            >
              {/* Header */}
              <div className={`px-5 py-3 bg-gradient-to-r ${platformCfg?.gradient} flex items-center justify-between`}>
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{platformCfg?.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{order.external_id}</p>
                    <p className="text-white/70 text-xs">{getTimeAgo(order.created_at)}</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${statusCfg?.bg} backdrop-blur-sm`}>
                  <StatusIcon className={`w-3.5 h-3.5 ${statusCfg?.color}`} />
                  <span className={`text-xs font-semibold capitalize ${statusCfg?.color}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Customer */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-600 dark:to-neutral-700 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-black dark:text-white">{order.customer_name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {order.customer_address.slice(0, 30)}...
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-black dark:text-white">${order.total.toFixed(2)}</p>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items.slice(0, 2).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">{item.quantity}x {item.name}</span>
                      <span className="text-neutral-500">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-neutral-400">+{order.items.length - 2} more items</p>
                  )}
                </div>

                {/* Driver Info */}
                {order.driver_name && (
                  <div className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    <Truck className="w-4 h-4" />
                    <span>{order.driver_name}</span>
                    <span className="text-neutral-300 dark:text-neutral-600">|</span>
                    <Phone className="w-3 h-3" />
                    <span>{order.driver_phone}</span>
                  </div>
                )}

                {/* ETA */}
                {order.estimated_delivery_time && (
                  <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                    <Clock className="w-4 h-4" />
                    <span>ETA: {formatTime(order.estimated_delivery_time)}</span>
                  </div>
                )}

                {/* Actions */}
                {order.status === 'pending' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order.id); }}
                      className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'cancelled'); }}
                      className="px-4 py-2.5 border border-red-200 dark:border-red-800 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {order.status === 'confirmed' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'preparing'); }}
                    className="w-full mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700"
                  >
                    <span className="flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:from-purple-600 hover:to-pink-700 transition-all">
                      <ChefHat className="w-4 h-4" />
                      <span>Start Preparing</span>
                    </span>
                  </button>
                )}

                {order.status === 'preparing' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'ready_for_pickup'); }}
                    className="w-full mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700"
                  >
                    <span className="flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all">
                      <Package className="w-4 h-4" />
                      <span>Ready for Pickup</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">No orders found</p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">Try adjusting your filters</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white dark:bg-neutral-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`px-6 py-4 bg-gradient-to-r ${platformConfig[selectedOrder.platform]?.gradient} sticky top-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{platformConfig[selectedOrder.platform]?.icon}</span>
                  <div>
                    <p className="text-white font-bold">{selectedOrder.external_id}</p>
                    <p className="text-white/70 text-sm">{formatTime(selectedOrder.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">Customer</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-neutral-400" />
                    <span className="text-black dark:text-white">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <span className="text-black dark:text-white">{selectedOrder.customer_phone}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-neutral-400 mt-0.5" />
                    <span className="text-black dark:text-white">{selectedOrder.customer_address}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                          {item.quantity}x
                        </span>
                        <span className="text-black dark:text-white">{item.name}</span>
                      </div>
                      <span className="font-medium text-black dark:text-white">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="text-black dark:text-white">${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Delivery Fee</span>
                  <span className="text-black dark:text-white">${selectedOrder.delivery_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Tax</span>
                  <span className="text-black dark:text-white">${selectedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Tip</span>
                  <span className="text-green-500">${selectedOrder.tip.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <span className="text-black dark:text-white">Total</span>
                  <span className="text-black dark:text-white">${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Driver */}
              {selectedOrder.driver_name && (
                <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">Driver</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-black dark:text-white">{selectedOrder.driver_name}</p>
                        <p className="text-sm text-neutral-500">{selectedOrder.driver_phone}</p>
                      </div>
                    </div>
                    <button className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                      <Phone className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
