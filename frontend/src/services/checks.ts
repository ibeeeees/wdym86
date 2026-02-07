/**
 * Check API Service
 * 
 * Frontend service for interacting with check management endpoints.
 * Implements all check-related API calls for 26.md specification.
 */

import { fetchJson } from './http'

// ==========================================
// TypeScript Interfaces
// ==========================================

export interface Check {
  check_id: string
  check_name: string
  check_number: string
  order_type: 'dine_in' | 'takeout' | 'delivery'
  status: 'active' | 'sent' | 'paid' | 'finalized' | 'voided'
  subtotal: number
  tax: number
  tip: number | null
  total: number
  final_total: number | null
  item_count: number
  created_at: string
  finalized_at: string | null
}

export interface CheckItem {
  id: string
  name: string
  quantity: number
  price: number
  modifiers: string[] | null
  special_instructions: string | null
  sent_to_bohpos: boolean
}

export interface CreateCheckRequest {
  order_type: 'dine_in' | 'takeout' | 'delivery'
  check_name: string
  restaurant_id: string
  table_id?: string
  customer_name?: string
  customer_phone?: string
}

export interface AddItemRequest {
  name: string
  quantity: number
  price: number
  menu_item_id?: string
  modifiers?: string[]
  special_instructions?: string
}

// ==========================================
// API Functions
// ==========================================

/**
 * Create a new check
 */
export async function createCheck(data: CreateCheckRequest): Promise<Check> {
  return await fetchJson<Check>('/checks/create', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Get list of checks for a specific order type
 */
export async function getCheckList(
  restaurantId: string,
  orderType: 'dine_in' | 'takeout' | 'delivery',
  status: string = 'active'
): Promise<Check[]> {
  const params = new URLSearchParams({
    restaurant_id: restaurantId,
    order_type: orderType,
    status,
  })

  return await fetchJson<Check[]>(`/checks/list?${params.toString()}`)
}

/**
 * Get check details by ID
 */
export async function getCheck(checkId: string): Promise<Check> {
  return await fetchJson<Check>(`/checks/${checkId}`)
}

/**
 * Get all items for a check
 */
export async function getCheckItems(checkId: string): Promise<CheckItem[]> {
  return await fetchJson<CheckItem[]>(`/checks/${checkId}/items`)
}

/**
 * Add an item to a check
 */
export async function addItemToCheck(
  checkId: string,
  item: AddItemRequest
): Promise<{
  success: boolean
  item_id: string
  check_id: string
  updated_subtotal: number
  updated_tax: number
  updated_total: number
}> {
  return await fetchJson(`/checks/${checkId}/items/add`, {
    method: 'POST',
    body: JSON.stringify(item),
  })
}

/**
 * Send order to BOHPOS (kitchen)
 */
export async function sendOrderToBOHPOS(
  checkId: string,
  itemIds?: string[]
): Promise<{
  success: boolean
  sent_order_id: string
  check_id: string
  check_name: string
  check_number: string
  items_sent: number
  sent_at: string
  message: string
}> {
  return await fetchJson(`/checks/${checkId}/send`, {
    method: 'POST',
    body: JSON.stringify({ item_ids: itemIds }),
  })
}

/**
 * Finalize check with tip
 */
export async function finalizeCheck(
  checkId: string,
  tipAmount: number
): Promise<{
  success: boolean
  check_id: string
  check_number: string
  status: string
  tip: number
  final_total: number
  finalized_at: string
}> {
  return await fetchJson(`/checks/${checkId}/finalize`, {
    method: 'POST',
    body: JSON.stringify({ tip_amount: tipAmount }),
  })
}

/**
 * Void a check
 */
export async function voidCheck(checkId: string): Promise<{
  success: boolean
  check_id: string
  status: string
  message: string
}> {
  return await fetchJson(`/checks/${checkId}/void`, { method: 'POST' })
}
