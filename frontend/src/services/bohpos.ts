/**
 * BOHPOS API Service
 * 
 * Frontend service for interacting with BOHPOS (Back of House POS) endpoints.
 * Implements kitchen display system API calls for 26.md specification.
 */

import { fetchJson } from './http'

// ==========================================
// TypeScript Interfaces
// ==========================================

export interface SentOrderItem {
  id: string
  name: string
  quantity: number
  price: number
  modifiers: string[]
  special_instructions: string | null
}

export interface SentOrder {
  sent_order_id: string
  check_id: string
  check_name: string
  check_number: string
  order_type: 'dine_in' | 'takeout' | 'delivery'
  items: SentOrderItem[]
  item_count: number
  sent_at: string
  status: 'pending' | 'in_progress' | 'completed'
  completed_at: string | null
}

// ==========================================
// API Functions
// ==========================================

/**
 * Get all active orders for kitchen display
 */
export async function getActiveOrders(restaurantId: string): Promise<SentOrder[]> {
  const params = new URLSearchParams({
    restaurant_id: restaurantId,
  })

  return await fetchJson<SentOrder[]>(`/bohpos/orders/active?${params.toString()}`)
}

/**
 * Get recent completed orders
 */
export async function getRecentOrders(
  restaurantId: string,
  limit: number = 50
): Promise<SentOrder[]> {
  const params = new URLSearchParams({
    restaurant_id: restaurantId,
    limit: limit.toString(),
  })

  return await fetchJson<SentOrder[]>(`/bohpos/orders/recent?${params.toString()}`)
}

/**
 * Get details of a specific sent order
 */
export async function getSentOrder(sentOrderId: string): Promise<SentOrder> {
  return await fetchJson<SentOrder>(`/bohpos/orders/${sentOrderId}`)
}

/**
 * Mark order as complete (bump order)
 */
export async function bumpOrder(
  sentOrderId: string,
  userId: string
): Promise<{
  success: boolean
  sent_order_id: string
  check_name: string
  status: string
  completed_at: string
  message: string
}> {
  return await fetchJson(`/bohpos/orders/${sentOrderId}/bump`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  sentOrderId: string,
  status: 'pending' | 'in_progress' | 'completed'
): Promise<{
  success: boolean
  sent_order_id: string
  status: string
  message: string
}> {
  const params = new URLSearchParams({
    status,
  })

  return await fetchJson(`/bohpos/orders/${sentOrderId}/status?${params.toString()}`, {
    method: 'POST',
  })
}
