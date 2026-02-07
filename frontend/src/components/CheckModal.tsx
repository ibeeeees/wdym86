/**
 * CheckModal Component
 * 
 * Modal for creating and editing checks.
 * Allows adding menu items, viewing check details, sending to kitchen.
 * Implements 26.md modal-based check editing workflow.
 */

import { useEffect, useState } from 'react'
import { X, Plus, Send, DollarSign, XCircle } from 'lucide-react'
import {
  Check,
  CheckItem,
  getCheck,
  getCheckItems,
  addItemToCheck,
  sendOrderToBOHPOS,
  voidCheck,
} from '../services/checks'

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
}

interface CheckModalProps {
  checkId: string | null
  isOpen: boolean
  onClose: () => void
  onCheckUpdated: () => void
  onEnterPayment: (checkId: string) => void
  menuItems: MenuItem[]
}

export default function CheckModal({
  checkId,
  isOpen,
  onClose,
  onCheckUpdated,
  onEnterPayment,
  menuItems,
}: CheckModalProps) {
  const [check, setCheck] = useState<Check | null>(null)
  const [items, setItems] = useState<CheckItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [sendingOrder, setSendingOrder] = useState(false)

  // Load check data when modal opens
  useEffect(() => {
    if (isOpen && checkId) {
      loadCheckData()
    } else if (!isOpen) {
      // Clear data when modal closes to free memory
      setCheck(null)
      setItems([])
      setError(null)
    }
  }, [isOpen, checkId])

  const loadCheckData = async () => {
    if (!checkId) return

    try {
      setLoading(true)
      setError(null)
      const [checkData, itemsData] = await Promise.all([
        getCheck(checkId),
        getCheckItems(checkId),
      ])
      setCheck(checkData)
      setItems(itemsData)
    } catch (err) {
      console.error('Failed to load check:', err)
      setError(err instanceof Error ? err.message : 'Failed to load check')
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (menuItem: MenuItem) => {
    if (!checkId) return

    try {
      await addItemToCheck(checkId, {
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price,
        menu_item_id: menuItem.id,
      })
      await loadCheckData()
      onCheckUpdated()
    } catch (err) {
      console.error('Failed to add item:', err)
      setError(err instanceof Error ? err.message : 'Failed to add item')
    }
  }

  const handleSendOrder = async () => {
    if (!checkId) return

    try {
      setSendingOrder(true)
      await sendOrderToBOHPOS(checkId)
      await loadCheckData()
      onCheckUpdated()
      alert('Order sent to kitchen!')
    } catch (err) {
      console.error('Failed to send order:', err)
      setError(err instanceof Error ? err.message : 'Failed to send order')
    } finally {
      setSendingOrder(false)
    }
  }

  const handleVoidCheck = async () => {
    if (!checkId) return

    if (!confirm('Are you sure you want to void this check?')) return

    try {
      await voidCheck(checkId)
      onCheckUpdated()
      onClose()
    } catch (err) {
      console.error('Failed to void check:', err)
      setError(err instanceof Error ? err.message : 'Failed to void check')
    }
  }

  const handleEnterPayment = () => {
    if (checkId) {
      onEnterPayment(checkId)
      onClose()
    }
  }

  // Get unique categories
  const categories = ['All', ...new Set(menuItems.map((item) => item.category))]

  // Filter menu items by category
  const filteredMenuItems =
    selectedCategory === 'All'
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {check?.check_name || 'Loading...'}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {check?.check_number} • {check?.status}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex">
            {/* Left Side: Current Check Items */}
            <div className="w-1/3 border-r border-neutral-200 dark:border-neutral-700 p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Current Items ({items.length})</h3>

              {items.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>No items yet</p>
                  <p className="text-sm mt-1">Add items from the menu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </div>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="text-xs text-neutral-500 mt-1">
                              {item.modifiers.join(', ')}
                            </div>
                          )}
                          {item.sent_to_bohpos && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              ✓ Sent to kitchen
                            </div>
                          )}
                        </div>
                        <div className="font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Check Totals */}
              {check && (
                <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${check.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>${check.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${check.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={handleSendOrder}
                  disabled={sendingOrder || items.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                  {sendingOrder ? 'Sending...' : 'Send to Kitchen'}
                </button>

                <button
                  onClick={handleEnterPayment}
                  disabled={items.length === 0 || check?.status === 'voided'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <DollarSign className="w-5 h-5" />
                  Enter Payment
                </button>

                <button
                  onClick={handleVoidCheck}
                  disabled={check?.status === 'voided'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Void Check
                </button>
              </div>
            </div>

            {/* Right Side: Menu Items */}
            <div className="flex-1 flex flex-col">
              {/* Category Filter */}
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex gap-2 overflow-x-auto">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        selectedCategory === category
                          ? 'bg-red-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
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
                  {filteredMenuItems.map((menuItem) => (
                    <button
                      key={menuItem.id}
                      onClick={() => handleAddItem(menuItem)}
                      className="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg transition-all text-left"
                    >
                      <div className="font-semibold mb-1">{menuItem.name}</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        {menuItem.category}
                      </div>
                      <div className="text-lg font-bold text-red-600">
                        ${menuItem.price.toFixed(2)}
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
                        <Plus className="w-3 h-3" />
                        <span>Add to check</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
