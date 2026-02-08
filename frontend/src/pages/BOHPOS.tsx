/**
 * BOHPOS Page - Back of House POS (Kitchen Display)
 *
 * Kitchen display system showing active orders and allowing order bumping.
 * Integrates with POSContext for demo mode and shared operating date.
 */

import { useEffect, useState, useCallback } from 'react'
import { ChefHat, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { usePOS } from '../context/POSContext'
import { checkApiHealth } from '../services/api'
import {
  SentOrder,
  getActiveOrders,
  getRecentOrders,
  bumpOrder,
  updateOrderStatus,
} from '../services/bohpos'

export default function BOHPOS() {
  const [activeOrders, setActiveOrders] = useState<SentOrder[]>([])
  const [recentOrders, setRecentOrders] = useState<SentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isOnline, setIsOnline] = useState<boolean | null>(null)

  const posContext = usePOS()
  const restaurantId = localStorage.getItem('restaurant_id') || 'demo_restaurant'
  const userId = localStorage.getItem('user_id') || 'kitchen_staff_1'

  const isDemoMode = useCallback(() => {
    return isOnline === false || localStorage.getItem('token')?.startsWith('demo-token-')
  }, [isOnline])

  // Check backend on mount
  useEffect(() => {
    checkApiHealth().then(ok => setIsOnline(ok)).catch(() => setIsOnline(false))
  }, [])

  // Load orders — from POSContext in demo mode, API otherwise
  const loadOrders = useCallback(() => {
    if (isDemoMode()) {
      // Demo mode: read from POSContext
      const active = posContext.demoSentOrders.filter(o => o.status !== 'completed')
      const recent = posContext.demoSentOrders.filter(o => o.status === 'completed')
      setActiveOrders(active as unknown as SentOrder[])
      setRecentOrders(recent as unknown as SentOrder[])
      setLoading(false)
      setError(null)
    } else {
      // API mode
      setError(null)
      Promise.all([
        getActiveOrders(restaurantId),
        getRecentOrders(restaurantId, 10),
      ])
        .then(([active, recent]) => {
          setActiveOrders(active)
          setRecentOrders(recent)
        })
        .catch(err => {
          console.error('Failed to load orders:', err)
          // Fallback to demo mode
          const active = posContext.demoSentOrders.filter(o => o.status !== 'completed')
          const recent = posContext.demoSentOrders.filter(o => o.status === 'completed')
          setActiveOrders(active as unknown as SentOrder[])
          setRecentOrders(recent as unknown as SentOrder[])
        })
        .finally(() => setLoading(false))
    }
  }, [isDemoMode, restaurantId, posContext.demoSentOrders])

  // Load on mount + auto-refresh
  useEffect(() => {
    loadOrders()

    if (autoRefresh) {
      const interval = setInterval(loadOrders, 8000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, loadOrders])

  const handleBumpOrder = async (sentOrderId: string) => {
    if (isDemoMode()) {
      posContext.bumpDemoOrder(sentOrderId)
      return
    }
    try {
      await bumpOrder(sentOrderId, userId)
      loadOrders()
    } catch (err) {
      console.error('Failed to bump order:', err)
      // Fallback to demo
      posContext.bumpDemoOrder(sentOrderId)
    }
  }

  const handleStatusChange = async (sentOrderId: string, status: 'pending' | 'in_progress') => {
    if (isDemoMode()) {
      posContext.updateDemoOrderStatus(sentOrderId, status)
      return
    }
    try {
      await updateOrderStatus(sentOrderId, status)
      loadOrders()
    } catch (err) {
      console.error('Failed to update status:', err)
      posContext.updateDemoOrderStatus(sentOrderId, status)
    }
  }

  const getOrderTypeBadge = (orderType: string) => {
    const badges = {
      dine_in: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      takeout: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      delivery: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    }
    return badges[orderType as keyof typeof badges] || badges.dine_in
  }

  const formatTimeAgo = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours}h ${diffMins % 60}m`
  }

  const getUrgencyColor = (sentAt: string) => {
    const diffMins = Math.floor((Date.now() - new Date(sentAt).getTime()) / 60000)
    if (diffMins > 20) return 'border-red-500 bg-red-50 dark:bg-red-900/20'
    if (diffMins > 10) return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
    return 'border-green-500 bg-green-50 dark:bg-green-900/20'
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                Kitchen Display
              </h1>
              <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                <span>BOHPOS</span>
                <span className="text-neutral-300 dark:text-neutral-600">|</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {posContext.operatingDateDisplay}
                </span>
                <span className="text-neutral-300 dark:text-neutral-600">|</span>
                <span>Active: {activeOrders.length}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isDemoMode() && (
              <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                Demo Mode
              </span>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                Auto-refresh (8s)
              </span>
            </label>

            <button
              onClick={loadOrders}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Closed day banner */}
        {!posContext.isOperatingDayOpen && (
          <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Operating day is closed. No new orders will appear until the POS starts a new day.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Orders */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">
              Active Orders
            </h2>

            {activeOrders.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <p className="text-neutral-600 dark:text-neutral-400">
                  No active orders — All caught up!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeOrders.map((order) => (
                  <div
                    key={order.sent_order_id}
                    className={`relative p-4 rounded-lg border-2 ${getUrgencyColor(
                      order.sent_at
                    )} transition-all`}
                  >
                    {/* Order Header */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-lg font-bold text-neutral-900 dark:text-white">
                            {order.check_name}
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            {order.check_number}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getOrderTypeBadge(
                            order.order_type
                          )}`}
                        >
                          {order.order_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeAgo(order.sent_at)}</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4 space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {item.quantity}x {item.name}
                              </div>
                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                  + {item.modifiers.join(', ')}
                                </div>
                              )}
                              {item.special_instructions && (
                                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {item.special_instructions}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Status Buttons */}
                    <div className="space-y-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() =>
                            handleStatusChange(order.sent_order_id, 'in_progress')
                          }
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          Start Cooking
                        </button>
                      )}

                      <button
                        onClick={() => handleBumpOrder(order.sent_order_id)}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        {order.status === 'in_progress' ? 'Complete Order' : 'Bump Order'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Completed Orders */}
          {recentOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">
                Recently Completed
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.sent_order_id}
                    className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 opacity-60"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="text-sm font-semibold">{order.check_name}</div>
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      {order.item_count} items {order.completed_at ? `\u2022 ${formatTimeAgo(order.completed_at)}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
