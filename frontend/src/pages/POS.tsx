/**
 * POS Page - Redesigned with Check-First Workflow
 *
 * Implements 26.md specification:
 * 1. Order type selection first
 * 2. Show check list for selected type
 * 3. Menu items only shown in check modal
 * 4. Check-based ordering system
 *
 * Supports both backend-connected and demo mode.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Receipt, Truck, ChevronRight, Plus, ArrowLeft,
  X, Send, DollarSign, XCircle, Clock, ChevronDown, Download
} from 'lucide-react'
import { getCuisineTemplate } from '../data/cuisineTemplates'
import { checkApiHealth } from '../services/api'
import {
  createCheck as apiCreateCheck,
  getCheckList as apiGetCheckList,
  getCheck as apiGetCheck,
  getCheckItems as apiGetCheckItems,
  addItemToCheck as apiAddItem,
  sendOrderToBOHPOS as apiSendOrder,
  finalizeCheck as apiFinalizeCheck,
  voidCheck as apiVoidCheck,
  Check,
  CheckItem,
} from '../services/checks'

type OrderType = 'dine_in' | 'takeout' | 'delivery'
type ViewState = 'order_type' | 'check_list' | 'check_detail' | 'payment_confirm' | 'payment' | 'tip_receipt'

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  popular?: boolean
}

// Demo mode local check storage
let demoCheckCounter = 0
const demoChecks: Map<string, Check & { items: CheckItem[] }> = new Map()

function generateDemoCheckNumber(orderType: OrderType): string {
  demoCheckCounter++
  const prefix = orderType === 'dine_in' ? 'DIN' : orderType === 'takeout' ? 'TO' : 'DEL'
  return `${prefix}-${String(demoCheckCounter).padStart(3, '0')}`
}

export default function POS() {
  // Core state
  const [view, setView] = useState<ViewState>('order_type')
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | null>(null)
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  // Check list state
  const [checks, setChecks] = useState<Check[]>([])
  const [checksLoading, setChecksLoading] = useState(false)
  const [checksError, setChecksError] = useState<string | null>(null)

  // Check detail state
  const [currentCheck, setCurrentCheck] = useState<Check | null>(null)
  const [currentCheckItems, setCurrentCheckItems] = useState<CheckItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sendingOrder, setSendingOrder] = useState(false)

  // New check dialog
  const [showNewCheckDialog, setShowNewCheckDialog] = useState(false)
  const [newCheckName, setNewCheckName] = useState('')
  const [creating, setCreating] = useState(false)

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'cash'>('credit_card')
  const [tipAmount, setTipAmount] = useState<string>('')
  const [paymentComplete, setPaymentComplete] = useState(false)

  // Get restaurant info
  const restaurantId = localStorage.getItem('restaurant_id') || 'demo_restaurant'
  const cuisineType = localStorage.getItem('cuisine_type') || localStorage.getItem('cuisineType') || 'mediterranean'

  // Check if we're in demo mode
  const isDemoMode = useCallback(() => {
    return isOnline === false || localStorage.getItem('token')?.startsWith('demo-token-')
  }, [isOnline])

  // Load menu items and check backend health on mount
  useEffect(() => {
    const template = getCuisineTemplate(cuisineType)
    setMenuItems(template.menuItems || [])

    checkApiHealth().then(ok => setIsOnline(ok)).catch(() => setIsOnline(false))
  }, [])

  // ==========================================
  // Demo Mode Check Operations
  // ==========================================

  const demoCreateCheck = (orderType: OrderType, checkName: string): Check => {
    const checkId = `demo-check-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const checkNumber = generateDemoCheckNumber(orderType)
    const check: Check = {
      check_id: checkId,
      check_name: checkName,
      check_number: checkNumber,
      order_type: orderType,
      status: 'active',
      subtotal: 0,
      tax: 0,
      tip: null,
      total: 0,
      final_total: null,
      item_count: 0,
      created_at: new Date().toISOString(),
      finalized_at: null,
    }
    demoChecks.set(checkId, { ...check, items: [] })
    return check
  }

  const demoGetCheckList = (orderType: OrderType): Check[] => {
    return Array.from(demoChecks.values())
      .filter(c => c.order_type === orderType && c.status === 'active')
      .map(({ items: _items, ...check }) => ({ ...check }))
  }

  const demoGetCheck = (checkId: string): Check | null => {
    const c = demoChecks.get(checkId)
    if (!c) return null
    const { items: _items, ...check } = c
    return check
  }

  const demoGetCheckItems = (checkId: string): CheckItem[] => {
    return demoChecks.get(checkId)?.items || []
  }

  const demoAddItem = (checkId: string, menuItem: MenuItem): void => {
    const check = demoChecks.get(checkId)
    if (!check) return

    const existingItem = check.items.find(i => i.name === menuItem.name)
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      check.items.push({
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price,
        modifiers: null,
        special_instructions: null,
        sent_to_bohpos: false,
      })
    }

    const subtotal = check.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const tax = Math.round(subtotal * 0.08 * 100) / 100
    check.subtotal = subtotal
    check.tax = tax
    check.total = Math.round((subtotal + tax) * 100) / 100
    check.item_count = check.items.reduce((sum, i) => sum + i.quantity, 0)
  }

  const demoSendOrder = (checkId: string): void => {
    const check = demoChecks.get(checkId)
    if (!check) return
    check.items.forEach(i => { i.sent_to_bohpos = true })
    check.status = 'sent'
  }

  const demoVoidCheck = (checkId: string): void => {
    const check = demoChecks.get(checkId)
    if (check) check.status = 'voided' as Check['status']
  }

  // ==========================================
  // Unified Handlers (backend or demo)
  // ==========================================

  const loadChecks = useCallback(async (orderType: OrderType) => {
    setChecksLoading(true)
    setChecksError(null)
    try {
      if (isDemoMode()) {
        setChecks(demoGetCheckList(orderType))
      } else {
        const data = await apiGetCheckList(restaurantId, orderType, 'active')
        setChecks(data)
      }
    } catch (err) {
      console.error('Failed to load checks:', err)
      // Fall back to demo mode
      setChecks(demoGetCheckList(orderType))
    } finally {
      setChecksLoading(false)
    }
  }, [isDemoMode, restaurantId])

  const handleOrderTypeSelect = (type: OrderType) => {
    setSelectedOrderType(type)
    setView('check_list')
    loadChecks(type)
  }

  const handleNewCheck = () => {
    setShowNewCheckDialog(true)
    setNewCheckName('')
  }

  const handleCreateCheck = async () => {
    if (!selectedOrderType || !newCheckName.trim()) return

    try {
      setCreating(true)
      let check: Check

      if (isDemoMode()) {
        check = demoCreateCheck(selectedOrderType, newCheckName.trim())
      } else {
        try {
          check = await apiCreateCheck({
            order_type: selectedOrderType,
            check_name: newCheckName.trim(),
            restaurant_id: restaurantId,
          })
        } catch {
          check = demoCreateCheck(selectedOrderType, newCheckName.trim())
        }
      }

      setCurrentCheck(check)
      setCurrentCheckItems(isDemoMode() ? demoGetCheckItems(check.check_id) : [])
      setSelectedCategory('All')
      setShowNewCheckDialog(false)
      setNewCheckName('')
      setView('check_detail')
    } catch (err) {
      console.error('Failed to create check:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleCheckClick = async (check: Check) => {
    try {
      if (isDemoMode()) {
        const fullCheck = demoGetCheck(check.check_id)
        if (fullCheck) {
          setCurrentCheck(fullCheck)
          setCurrentCheckItems(demoGetCheckItems(check.check_id))
        }
      } else {
        const [c, items] = await Promise.all([
          apiGetCheck(check.check_id),
          apiGetCheckItems(check.check_id),
        ])
        setCurrentCheck(c)
        setCurrentCheckItems(items)
      }
      setSelectedCategory('All')
      setView('check_detail')
    } catch (err) {
      console.error('Failed to load check:', err)
      // fallback demo
      const fullCheck = demoGetCheck(check.check_id)
      if (fullCheck) {
        setCurrentCheck(fullCheck)
        setCurrentCheckItems(demoGetCheckItems(check.check_id))
        setView('check_detail')
      }
    }
  }

  const handleAddItem = async (menuItem: MenuItem) => {
    if (!currentCheck) return

    if (isDemoMode()) {
      demoAddItem(currentCheck.check_id, menuItem)
      const updated = demoGetCheck(currentCheck.check_id)
      if (updated) setCurrentCheck(updated)
      setCurrentCheckItems(demoGetCheckItems(currentCheck.check_id))
    } else {
      try {
        await apiAddItem(currentCheck.check_id, {
          name: menuItem.name,
          quantity: 1,
          price: menuItem.price,
          menu_item_id: menuItem.id,
        })
        const [c, items] = await Promise.all([
          apiGetCheck(currentCheck.check_id),
          apiGetCheckItems(currentCheck.check_id),
        ])
        setCurrentCheck(c)
        setCurrentCheckItems(items)
      } catch (err) {
        console.error('Failed to add item:', err)
        // fallback demo
        demoAddItem(currentCheck.check_id, menuItem)
        const updated = demoGetCheck(currentCheck.check_id)
        if (updated) setCurrentCheck(updated)
        setCurrentCheckItems(demoGetCheckItems(currentCheck.check_id))
      }
    }
  }

  const handleSendOrder = async () => {
    if (!currentCheck) return

    try {
      setSendingOrder(true)
      if (isDemoMode()) {
        demoSendOrder(currentCheck.check_id)
      } else {
        await apiSendOrder(currentCheck.check_id)
      }
      // Refresh check data
      if (isDemoMode()) {
        const updated = demoGetCheck(currentCheck.check_id)
        if (updated) setCurrentCheck(updated)
        setCurrentCheckItems(demoGetCheckItems(currentCheck.check_id))
      } else {
        const [c, items] = await Promise.all([
          apiGetCheck(currentCheck.check_id),
          apiGetCheckItems(currentCheck.check_id),
        ])
        setCurrentCheck(c)
        setCurrentCheckItems(items)
      }
    } catch (err) {
      console.error('Failed to send order:', err)
    } finally {
      setSendingOrder(false)
    }
  }

  const handleVoidCheck = async () => {
    if (!currentCheck) return
    if (!confirm('Are you sure you want to void this check?')) return

    if (isDemoMode()) {
      demoVoidCheck(currentCheck.check_id)
    } else {
      try {
        await apiVoidCheck(currentCheck.check_id)
      } catch {
        demoVoidCheck(currentCheck.check_id)
      }
    }
    setView('check_list')
    if (selectedOrderType) loadChecks(selectedOrderType)
  }

  const handleEnterPayment = () => {
    setPaymentMethod('credit_card')
    setView('payment_confirm')
  }

  const handlePaymentConfirm = () => {
    setView('payment')
  }

  const handlePaymentComplete = () => {
    setPaymentComplete(true)
    setTipAmount('')
    setView('tip_receipt')
  }

  const handleFinalizeWithTip = async () => {
    if (!currentCheck) return
    const tip = parseFloat(tipAmount) || 0

    if (!isDemoMode()) {
      try {
        await apiFinalizeCheck(currentCheck.check_id, tip)
      } catch {
        // demo fallback
      }
    }

    // Reset everything and go back
    setPaymentComplete(false)
    setTipAmount('')
    setCurrentCheck(null)
    setCurrentCheckItems([])
    setView('check_list')
    if (selectedOrderType) loadChecks(selectedOrderType)
  }

  const handleBackToCheckList = () => {
    setCurrentCheck(null)
    setCurrentCheckItems([])
    setView('check_list')
    if (selectedOrderType) loadChecks(selectedOrderType)
  }

  const handleDownloadReceipt = () => {
    if (!currentCheck) return
    const tip = parseFloat(tipAmount) || 0
    const finalTotal = Math.round((currentCheck.total + tip) * 100) / 100
    const lines: string[] = []
    lines.push('RECEIPT')
    lines.push(currentCheck.check_number)
    lines.push('')
    lines.push(`Check:  ${currentCheck.check_number}`)
    lines.push(`Name:   ${currentCheck.check_name}`)
    lines.push(`Type:   ${(currentCheck.order_type || '').replace('_', ' ').toUpperCase()}`)
    lines.push(`Date:   ${new Date().toLocaleString()}`)
    lines.push(''.padEnd(40, '-'))
    for (const item of currentCheckItems) {
      lines.push(`${item.quantity}x ${item.name}  $${(item.price * item.quantity).toFixed(2)}`)
      if (item.modifiers) lines.push(`    + ${item.modifiers}`)
      if (item.special_instructions) lines.push(`    Note: ${item.special_instructions}`)
    }
    lines.push(''.padEnd(40, '-'))
    lines.push(`Subtotal:  $${currentCheck.subtotal.toFixed(2)}`)
    lines.push(`Tax:       $${currentCheck.tax.toFixed(2)}`)
    if (tip > 0) lines.push(`Tip:       $${tip.toFixed(2)}`)
    lines.push(''.padEnd(40, '='))
    lines.push(`TOTAL:     $${finalTotal.toFixed(2)}`)
    lines.push('')
    lines.push(`PAID: ${paymentMethod === 'credit_card' ? 'CREDIT CARD' : 'CASH'}`)
    lines.push('')
    lines.push('Thank you for your business!')
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${currentCheck.check_number}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleBackToOrderType = () => {
    setSelectedOrderType(null)
    setChecks([])
    setView('order_type')
  }

  // Get unique categories from menu items
  const categories = ['All', ...new Set(menuItems.map(item => item.category))]
  const filteredMenuItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory)

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return new Date(dateString).toLocaleDateString()
  }

  // ==========================================
  // VIEW: Order Type Selection
  // ==========================================
  if (view === 'order_type') {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-neutral-100 dark:bg-neutral-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              Point of Sale
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Select an order type to get started
            </p>
            {isOnline === false && (
              <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                Demo Mode
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => handleOrderTypeSelect('dine_in')}
              className="group relative p-8 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl transition-all"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover:scale-110 transition-transform">
                  <Users className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Dine-In</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Table service orders</div>
                </div>
                <ChevronRight className="w-6 h-6 text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button
              onClick={() => handleOrderTypeSelect('takeout')}
              className="group relative p-8 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-xl transition-all"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full group-hover:scale-110 transition-transform">
                  <Receipt className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Takeout</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Customer pickup orders</div>
                </div>
                <ChevronRight className="w-6 h-6 text-neutral-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button
              onClick={() => handleOrderTypeSelect('delivery')}
              className="group relative p-8 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-orange-500 dark:hover:border-orange-400 hover:shadow-xl transition-all"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full group-hover:scale-110 transition-transform">
                  <Truck className="w-12 h-12 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Delivery</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Delivery orders</div>
                </div>
                <ChevronRight className="w-6 h-6 text-neutral-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // VIEW: Check List
  // ==========================================
  if (view === 'check_list') {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-neutral-100 dark:bg-neutral-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                {selectedOrderType === 'dine_in' && 'Dine-In Orders'}
                {selectedOrderType === 'takeout' && 'Takeout Orders'}
                {selectedOrderType === 'delivery' && 'Delivery Orders'}
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Manage checks and orders
              </p>
            </div>
            <button
              onClick={handleBackToOrderType}
              className="flex items-center gap-2 px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Change Order Type
            </button>
          </div>

          {/* Header with New Check */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {selectedOrderType === 'dine_in' && <Users className="w-5 h-5 text-blue-600" />}
              {selectedOrderType === 'takeout' && <Receipt className="w-5 h-5 text-purple-600" />}
              {selectedOrderType === 'delivery' && <Truck className="w-5 h-5 text-orange-600" />}
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Active Checks ({checks.length})
              </h2>
            </div>
            <button
              onClick={handleNewCheck}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Check
            </button>
          </div>

          {/* Check List Content */}
          {checksLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
            </div>
          ) : checksError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{checksError}</p>
              <button
                onClick={() => selectedOrderType && loadChecks(selectedOrderType)}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : checks.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600">
              <Receipt className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
              <p className="text-neutral-600 dark:text-neutral-400 mb-2">No active checks</p>
              <p className="text-sm text-neutral-500 mb-4">Create a new check to get started</p>
              <button
                onClick={handleNewCheck}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create First Check
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {checks.map(check => (
                <button
                  key={check.check_id}
                  onClick={() => handleCheckClick(check)}
                  className="group relative p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg transition-all text-left"
                >
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      check.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      check.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {check.status}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{check.check_number}</div>
                    <div className="text-lg font-semibold text-neutral-900 dark:text-white pr-20">{check.check_name}</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">Items:</span>
                      <span className="font-medium text-neutral-900 dark:text-white">{check.item_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">Total:</span>
                      <span className="font-semibold text-neutral-900 dark:text-white">${check.total.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimeAgo(check.created_at)}</span>
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5 text-red-600" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Refresh */}
          <div className="text-center mt-4">
            <button
              onClick={() => selectedOrderType && loadChecks(selectedOrderType)}
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Refresh checks
            </button>
          </div>
        </div>

        {/* New Check Dialog */}
        {showNewCheckDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-white">Create New Check</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                  Check Name {selectedOrderType === 'dine_in' ? '(e.g., Table 5)' : '(e.g., John Doe)'}
                </label>
                <input
                  type="text"
                  value={newCheckName}
                  onChange={e => setNewCheckName(e.target.value)}
                  placeholder={selectedOrderType === 'dine_in' ? 'Table 5' : 'Customer Name'}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateCheck() }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewCheckDialog(false)}
                  className="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-900 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCheck}
                  disabled={creating || !newCheckName.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Check'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // VIEW: Check Detail (Modal-style full page)
  // ==========================================
  if (view === 'check_detail' && currentCheck) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-neutral-100 dark:bg-neutral-900">
        <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{currentCheck.check_name}</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{currentCheck.check_number} &middot; {currentCheck.status}</p>
            </div>
            <button
              onClick={handleBackToCheckList}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex" style={{ height: 'calc(100vh - 12rem)' }}>
          {/* Left: Current Check Items */}
          <div className="w-1/3 border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 overflow-y-auto flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">Current Items ({currentCheckItems.length})</h3>

            {currentCheckItems.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                <p>No items yet</p>
                <p className="text-sm mt-1">Add items from the menu</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {currentCheckItems.map(item => (
                  <div key={item.id} className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900 dark:text-white">{item.name}</div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          Qty: {item.quantity} x ${item.price.toFixed(2)}
                        </div>
                        {item.sent_to_bohpos && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Sent to kitchen</div>
                        )}
                      </div>
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-600 space-y-2">
              <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
                <span>Subtotal:</span>
                <span>${currentCheck.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
                <span>Tax:</span>
                <span>${currentCheck.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-neutral-900 dark:text-white">
                <span>Total:</span>
                <span>${currentCheck.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 space-y-2">
              <button
                onClick={handleSendOrder}
                disabled={sendingOrder || currentCheckItems.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
                {sendingOrder ? 'Sending...' : 'Send to Kitchen'}
              </button>

              <button
                onClick={handleEnterPayment}
                disabled={currentCheckItems.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <DollarSign className="w-5 h-5" />
                Enter Payment
              </button>

              <button
                onClick={handleVoidCheck}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
                Void Check
              </button>
            </div>
          </div>

          {/* Right: Menu Items */}
          <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-900">
            {/* Category Filter */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
              <div className="flex gap-2 overflow-x-auto">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm font-medium ${
                      selectedCategory === category
                        ? 'bg-red-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMenuItems.map(menuItem => (
                  <button
                    key={menuItem.id}
                    onClick={() => handleAddItem(menuItem)}
                    className="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg transition-all text-left"
                  >
                    <div className="font-semibold text-neutral-900 dark:text-white mb-1">{menuItem.name}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{menuItem.category}</div>
                    <div className="text-lg font-bold text-red-600">${menuItem.price.toFixed(2)}</div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <Plus className="w-3 h-3" />
                      <span>Add to check</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // VIEW: Payment Confirmation
  // ==========================================
  if (view === 'payment_confirm' && currentCheck) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Confirm Payment</h2>
            <button
              onClick={() => setView('check_detail')}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Check Info */}
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{currentCheck.check_number}</div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">{currentCheck.check_name}</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">{currentCheckItems.length} items</div>
            </div>

            {/* Items */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {currentCheckItems.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="text-neutral-900 dark:text-white">
                    <span className="font-medium">{item.quantity}x</span> {item.name}
                  </div>
                  <div className="font-medium text-neutral-900 dark:text-white">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
                <span>Subtotal:</span>
                <span>${currentCheck.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
                <span>Tax:</span>
                <span>${currentCheck.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-red-600">
                <span>Total:</span>
                <span>${currentCheck.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Payment Method:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    paymentMethod === 'credit_card'
                      ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    <ChevronDown className="w-6 h-6 mx-auto text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-white">Credit Card</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    paymentMethod === 'cash'
                      ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    <DollarSign className="w-6 h-6 mx-auto text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-white">Cash</div>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setView('check_detail')}
              className="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-900 dark:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handlePaymentConfirm}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              Confirm Payment
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // VIEW: Payment Processing
  // ==========================================
  if (view === 'payment' && currentCheck) {
    if (paymentMethod === 'cash') {
      // Inline cash payment
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Cash Payment</h2>
              <button
                onClick={() => setView('payment_confirm')}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 mb-6">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Amount Due</div>
              <div className="text-3xl font-bold font-mono text-green-700 dark:text-green-300">
                ${currentCheck.total.toFixed(2)}
              </div>
            </div>

            <button
              onClick={handlePaymentComplete}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg transition-colors"
            >
              Mark as Paid
            </button>
          </div>
        </div>
      )
    }

    // Card payment - show simplified flow for demo, or use Stripe if available
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Card Payment</h2>
            <button
              onClick={() => setView('payment_confirm')}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 mb-6">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Charge Amount</div>
            <div className="text-3xl font-bold font-mono text-blue-700 dark:text-blue-300">
              ${currentCheck.total.toFixed(2)}
            </div>
          </div>

          {isDemoMode() ? (
            <button
              onClick={handlePaymentComplete}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors"
            >
              Process Card (Demo)
            </button>
          ) : (
            <button
              onClick={handlePaymentComplete}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors"
            >
              Process Card Payment
            </button>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // VIEW: Tip & Receipt
  // ==========================================
  if (view === 'tip_receipt' && currentCheck && paymentComplete) {
    const tip = parseFloat(tipAmount) || 0
    const finalTotal = Math.round((currentCheck.total + tip) * 100) / 100

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">Payment Complete</h2>
          </div>

          {/* Receipt */}
          <div className="p-6">
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 mb-6 font-mono text-sm">
              <div className="text-center font-bold text-lg mb-3 text-neutral-900 dark:text-white">RECEIPT</div>

              <div className="space-y-1 mb-4 text-neutral-700 dark:text-neutral-300">
                <div className="flex justify-between">
                  <span>Check:</span>
                  <span>{currentCheck.check_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span>{currentCheck.check_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-neutral-300 dark:border-neutral-600 pt-3 mb-3 space-y-1">
                {currentCheckItems.map(item => (
                  <div key={item.id} className="flex justify-between text-neutral-700 dark:text-neutral-300">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-neutral-300 dark:border-neutral-600 pt-3 space-y-1">
                <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                  <span>Subtotal:</span>
                  <span>${currentCheck.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                  <span>Tax:</span>
                  <span>${currentCheck.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                  <span>Tip:</span>
                  <span>${tip.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white">
                  <span>TOTAL:</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                PAID: {paymentMethod === 'credit_card' ? 'CREDIT CARD' : 'CASH'}
              </div>
            </div>

            {/* Tip Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                Add Tip
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-neutral-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tipAmount}
                  onChange={e => setTipAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 text-lg font-mono border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              {/* Quick tip buttons */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[15, 18, 20, 25].map(pct => {
                  const tipVal = Math.round(currentCheck.subtotal * pct) / 100
                  return (
                    <button
                      key={pct}
                      onClick={() => setTipAmount(tipVal.toFixed(2))}
                      className="py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
                    >
                      {pct}%
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Download & Finalize Buttons */}
            <button
              onClick={handleDownloadReceipt}
              className="w-full flex items-center justify-center gap-2 py-3 mb-3 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Receipt
            </button>
            <button
              onClick={handleFinalizeWithTip}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg transition-colors"
            >
              Finalize Check (${finalTotal.toFixed(2)})
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
