import { useState } from 'react'
import {
  Truck, Package, Clock, MapPin, Phone, User, DollarSign,
  CheckCircle, XCircle, ChefHat, RefreshCw,
  AlertCircle, TrendingUp
} from 'lucide-react'
import { getCuisineTemplate } from '../data/cuisineTemplates'
import { useAuth } from '../context/AuthContext'

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
  color: string
  commission: string
}

// Platform styling configuration
const platformConfig: Record<string, { gradient: string; bg: string; label: string; labelColor: string }> = {
  doordash: {
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    label: 'DD',
    labelColor: 'bg-red-500 text-white',
  },
  uber_eats: {
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
    label: 'UE',
    labelColor: 'bg-green-500 text-white',
  },
  grubhub: {
    gradient: 'from-orange-500 to-red-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    label: 'GH',
    labelColor: 'bg-orange-500 text-white',
  },
  postmates: {
    gradient: 'from-gray-700 to-black',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    label: 'PM',
    labelColor: 'bg-black text-white',
  },
  seamless: {
    gradient: 'from-blue-500 to-red-700',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    label: 'SM',
    labelColor: 'bg-blue-500 text-white',
  },
}

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  pending: { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock },
  confirmed: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: CheckCircle },
  preparing: { color: 'text-red-700', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: ChefHat },
  ready_for_pickup: { color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30', icon: Package },
  out_for_delivery: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: Truck },
  delivered: { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
  cancelled: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
}

const statusMap: Record<string, string> = {
  received: 'confirmed',
  preparing: 'preparing',
  ready: 'ready_for_pickup',
  picked_up: 'delivered',
}

const deliveryFees = [4.99, 3.99, 2.99, 4.99]
const tips = [12.00, 15.00, 18.00, 10.00]
const phones = ['(555) 123-4567', '(555) 234-5678', '(555) 345-6789', '(555) 456-7890']
const addresses = ['123 Main St, Athens, GA 30601', '456 Oak Blvd, Athens, GA 30602', '789 Elm Dr, Athens, GA 30605', '321 Pine Ave, Athens, GA 30606']
const driverNames = ['Alex K.', 'Jordan T.', null, null]
const driverPhones = ['(555) 987-6543', '(555) 876-5432', null, null]
const etaOffsets = [25, 10, null, null]
const createdOffsets = [15, 5, 25, 2]

function buildMockOrders(cuisineType: string): DeliveryOrder[] {
  const template = getCuisineTemplate(cuisineType || 'mediterranean')
  const platformOrders = template.deliveryPlatformOrders
  return platformOrders.map((po, i) => {
    const subtotal = po.items.reduce((sum, item) => sum + item.price, 0)
    const fee = deliveryFees[i % deliveryFees.length]
    const tax = parseFloat((subtotal * 0.09).toFixed(2))
    const tip = tips[i % tips.length]
    const mappedStatus = statusMap[po.status] || po.status
    const hasDriver = mappedStatus === 'preparing' || mappedStatus === 'ready_for_pickup' || mappedStatus === 'delivered' || mappedStatus === 'out_for_delivery'
    const dName = hasDriver ? (driverNames[i % driverNames.length] || template.customerNames[((i + 2) % template.customerNames.length)] ) : null
    const dPhone = hasDriver ? (driverPhones[i % driverPhones.length] || '(555) 654-3210') : null
    const offset = etaOffsets[i % etaOffsets.length]
    return {
      id: (i + 1).toString(),
      platform: po.platform,
      external_id: po.platformId,
      customer_name: po.customerName,
      customer_phone: phones[i % phones.length],
      customer_address: addresses[i % addresses.length],
      items: po.items.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
      subtotal,
      delivery_fee: fee,
      tax,
      tip,
      total: parseFloat((subtotal + fee + tax + tip).toFixed(2)),
      status: mappedStatus,
      estimated_delivery_time: offset !== null ? new Date(Date.now() + offset * 60000).toISOString() : null,
      driver_name: dName,
      driver_phone: dPhone,
      created_at: new Date(Date.now() - createdOffsets[i % createdOffsets.length] * 60000).toISOString(),
      updated_at: new Date().toISOString(),
    }
  })
}

const mockPlatforms: Platform[] = [
  { id: 'doordash', name: 'DoorDash', connected: true, color: '#FF3008', commission: '15-30%' },
  { id: 'uber_eats', name: 'Uber Eats', connected: true, color: '#06C167', commission: '15-30%' },
  { id: 'grubhub', name: 'Grubhub', connected: true, color: '#F63440', commission: '20-30%' },
  { id: 'postmates', name: 'Postmates', connected: false, color: '#000000', commission: '15-30%' },
  { id: 'seamless', name: 'Seamless', connected: false, color: '#F63440', commission: '20-30%' },
]

export default function Delivery() {
  const { cuisineType } = useAuth()
  const [orders, setOrders] = useState<DeliveryOrder[]>(() => buildMockOrders(cuisineType))
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
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
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
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-xl font-medium text-sm transition-all hover:scale-105 shadow-lg shadow-red-500/30 disabled:opacity-50"
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
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${config?.labelColor}`}>{config?.label}</span>
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
                  <span className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold text-white">{platformCfg?.label}</span>
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
                    <span className="flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl text-sm font-semibold hover:from-red-700 hover:to-pink-700 transition-all">
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
                  <span className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold text-white">{platformConfig[selectedOrder.platform]?.label}</span>
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
